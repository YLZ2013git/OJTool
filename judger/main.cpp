// main.cpp - judger 主入口
// 负责：
//   1. 读取/输入评测配置
//   2. 按需编译 checker（SPJ）
//   3. 逐选手、逐测试点评测
//      - 源代码 NOIP 规范检查（命中 → UKE，0 分）
//      - 编译选手程序（NOIP 标准编译选项）
//      - 运行并比对（内置 compareAnswer 或外部 checker.exe）
//   4. 输出 JSON 行协议供 Node.js 端解析
#include "common.h"
#include "result.h"
#include "utils.h"
#include "fileio.h"
#include "runner.h"
#include "checker.h"
#include "jsonout.h"
#include "config.h"

int main() {
    system("chcp 936");

    JudgeConfig cfg;

    char useConfig = 'n';
    cout << "是否读取配置文件(y/n,默认n): ";
    cin >> useConfig;

    if (useConfig == 'y' || useConfig == 'Y') {
        string configPath;
        cout << "输入配置文件路径: ";
        cin >> configPath;
        if (!readConfigFile(configPath, cfg)) {
            return 1;
        }
    } else {
        inputConfigInteractive(cfg);
    }

    // 规范化 basePath：把正斜杠转为反斜杠，确保末尾恰好一个反斜杠
    string basePath = cfg.basePath;
    for (size_t i = 0; i < basePath.size(); ++i) {
        if (basePath[i] == '/') basePath[i] = '\\';
    }
    while (basePath.size() > 1 && basePath[basePath.size() - 1] == '\\' &&
           basePath[basePath.size() - 2] == '\\') {
        basePath.pop_back();
    }
    if (!basePath.empty() && basePath[basePath.size() - 1] != '\\') {
        basePath += "\\";
    }

    // 转为绝对路径，避免子进程工作目录与相对路径叠加导致找不到文件
    {
        char absBuf[MAX_PATH];
        DWORD absLen = GetFullPathNameA(basePath.c_str(), MAX_PATH, absBuf, nullptr);
        if (absLen > 0 && absLen < MAX_PATH) {
            basePath = absBuf;
            if (!basePath.empty() && basePath[basePath.size() - 1] != '\\') {
                basePath += "\\";
            }
        }
    }

    // checker 目录（相对当前工作目录的 judger/checkers）
    // 优先使用 judger.exe 所在目录的相对路径，便于 portable
    string exeDir = ".\\judger\\checkers";
    string checkerExePath;
    if (!ensureCheckerReady(cfg.checkerType, cfg.customCheckerPath, exeDir, checkerExePath)) {
        cerr << "错误: checker 准备失败" << endl;
        return 1;
    }
    // checkerExePath 转为绝对路径，避免子进程工作目录不同时找不到
    if (!checkerExePath.empty()) {
        char absBuf[MAX_PATH];
        DWORD absLen = GetFullPathNameA(checkerExePath.c_str(), MAX_PATH, absBuf, nullptr);
        if (absLen > 0 && absLen < MAX_PATH) {
            checkerExePath = absBuf;
        }
    }
    bool useExternalChecker = (cfg.checkerType != "default" && !cfg.checkerType.empty());

    for (int pid = 1; pid <= cfg.playerCount; ++pid) {
        int total = 0;
        bool skipCompile = false;       // CE/UKE 后跳过本选手剩余测试点
        string pdir = basePath + to_string(pid) + "\\";
        string cpp  = pdir + cfg.problemPrefix + ".cpp";
        string exe  = pdir + cfg.problemPrefix + ".exe";
        string in   = pdir + cfg.problemPrefix + ".in";
        string out  = pdir + cfg.problemPrefix + ".out";
        string res  = pdir + cfg.problemPrefix + "_out.txt";

        outputJsonPlayerStart(pid);

        ofstream fout(res);
        fout << "Player " << pid << endl;
        cout << "\n===== 选手 " << pid << " =====\n";

        // 预先做源代码规范检查（UKE 触发条件之一）
        bool ukeFlag = false;
        string ukeReason;
        if (cfg.language == "cpp") {
            ukeReason = checkSourceCode(cpp);
            if (!ukeReason.empty()) {
                ukeFlag = true;
            }
        }

        for (int cid = 1; cid <= cfg.testCaseCount; ++cid) {
            JudgeResult r = AC;
            string cinPath = basePath + cfg.problemPrefix + to_string(cid) + ".in";
            string cans    = basePath + cfg.problemPrefix + to_string(cid) + ".ans";
            int sc = 0;
            int timeMs = 0;
            int memoryKb = 0;

            if (skipCompile) {
                // 之前已 CE/UKE，剩余测试点直接判同状态
                r = ukeFlag ? UKE : CE;
            } else if (ukeFlag) {
                // 第一个测试点：源代码不规范 → UKE
                r = UKE;
                skipCompile = true;
                cout << "UKE 原因: " << ukeReason << endl;
            } else {
                if (cid == 1) {
                    // 编译选手程序
                    string cmd = buildCompileCommand(cpp, exe, cfg.cppVersion, cfg.noipMode);
                    int exitCode = 0;
                    if (!runCommand(cmd, pdir, exitCode) || exitCode != 0 || !fileExists(exe)) {
                        r = CE;
                        skipCompile = true;
                    }
                }
                if (!skipCompile) {
                    r = runProgramWithCheck(exe, pdir, cinPath, out,
                                            cfg.timeLimitMs, cfg.memoryLimitKb, timeMs, memoryKb);
                    if (r == AC) {
                        if (!fileExists(out)) {
                            r = RTE;
                        } else if (useExternalChecker) {
                            // 调用外部 checker
                            int checkerExit = runChecker(checkerExePath, cinPath, out, cans, pdir);
                            if (checkerExit == 0) {
                                r = AC;
                            } else if (checkerExit == 2) {
                                r = WA;  // PE 在 OJ 中通常也判 WA，此处保守 WA
                            } else {
                                r = WA;
                            }
                        } else {
                            r = compareAnswer(out, cans, cfg.outputLimit);
                        }
                    }
                }
            }

            if (r == AC) {
                sc = cfg.scorePerCase;
                total += sc;
            }
            cout << cid << ": " << resultToString(r) << " [" << timeMs << "ms, " << memoryKb << "KB]" << endl;
            fout << cid << " " << sc << " " << resultToString(r) << " " << timeMs << "ms " << memoryKb << "KB" << endl;
            outputJsonResult(pid, cid, r, sc, timeMs, memoryKb);
        }

        fout << total << endl;
        fout.close();
        cout << "总得分: " << total << " / " << cfg.testCaseCount * cfg.scorePerCase << endl;
        outputJsonPlayerEnd(pid, total, cfg.testCaseCount * cfg.scorePerCase);
    }

    cout << "\n全部完成！" << endl;
    outputJsonDone(cfg.playerCount);
    system("pause");
    return 0;
}
