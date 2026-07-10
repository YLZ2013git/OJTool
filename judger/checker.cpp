// checker.cpp - 评测核心实现：答案比对、源代码检查、SPJ 调用
#include "checker.h"
#include "utils.h"
#include "fileio.h"
#include "runner.h"

// ---------- 内置默认文本比对 ----------
JudgeResult compareAnswer(const string& playerOutFile, const string& ansFile, long long outputLimit) {
    vector<string> playerLines, ansLines;
    if (!readFileToVector(playerOutFile, playerLines) || !readFileToVector(ansFile, ansLines)) {
        return RTE;
    }

    if (getFileSize(playerOutFile) > outputLimit) {
        return OLE;
    }

    int p_idx = 0, a_idx = 0;
    while (p_idx < playerLines.size() || a_idx < ansLines.size()) {
        while (p_idx < playerLines.size() && playerLines[p_idx].empty()) p_idx++;
        while (a_idx < ansLines.size() && ansLines[a_idx].empty()) a_idx++;

        if ((p_idx < playerLines.size()) != (a_idx < ansLines.size())) {
            return WA;
        }
        if (p_idx >= playerLines.size() && a_idx >= ansLines.size()) {
            break;
        }
        if (playerLines[p_idx] != ansLines[a_idx]) {
            return WA;
        }
        p_idx++;
        a_idx++;
    }
    return AC;
}

// ---------- 源代码 NOIP 规范检查 ----------
// 命中规则即返回非空错误描述（应判 UKE，0 分）
string checkSourceCode(const string& sourcePath) {
    string content;
    if (!readFileToString(sourcePath, content)) {
        return "无法读取源文件: " + sourcePath;
    }

    // 简单注释剥离（避免注释里的内容被误判）
    string stripped;
    bool inLineComment = false;
    bool inBlockComment = false;
    for (size_t i = 0; i < content.size(); ++i) {
        if (inLineComment) {
            if (content[i] == '\n') {
                inLineComment = false;
                stripped += content[i];
            }
        } else if (inBlockComment) {
            if (i + 1 < content.size() && content[i] == '*' && content[i + 1] == '/') {
                inBlockComment = false;
                ++i;
            }
        } else {
            if (i + 1 < content.size() && content[i] == '/' && content[i + 1] == '/') {
                inLineComment = true;
                ++i;
            } else if (i + 1 < content.size() && content[i] == '/' && content[i + 1] == '*') {
                inBlockComment = true;
                ++i;
            } else {
                stripped += content[i];
            }
        }
    }

    // 1. #pragma 检查（#pragma once 除外）
    size_t pos = 0;
    while ((pos = stripped.find("#pragma", pos)) != string::npos) {
        size_t lineEnd = stripped.find('\n', pos);
        string line = stripped.substr(pos, lineEnd == string::npos ? string::npos : lineEnd - pos);
        // 解析 #pragma 后第一个 token
        size_t p = 7; // strlen("#pragma")
        while (p < line.size() && isspace((unsigned char)line[p])) ++p;
        string rest = line.substr(p);
        size_t tokEnd = 0;
        while (tokEnd < rest.size() && !isspace((unsigned char)rest[tokEnd])) ++tokEnd;
        string token = rest.substr(0, tokEnd);
        if (token != "once") {
            return "源代码包含禁用的 #pragma 指令: " + trim(line);
        }
        pos = lineEnd == string::npos ? stripped.size() : lineEnd + 1;
    }

    // 2. Windows 特有头文件检查（仅检测 #include 行）
    static const char* forbiddenHeaders[] = {
        "windows.h", "conio.h", "io.h", "direct.h", "process.h",
        "winsock2.h", "ws2tcpip.h", "winbase.h", "winuser.h",
        "shlobj.h", "tlhelp32.h", "psapi.h", "winternl.h",
        nullptr
    };
    size_t incPos = 0;
    while ((incPos = stripped.find("#include", incPos)) != string::npos) {
        size_t lineEnd = stripped.find('\n', incPos);
        string line = stripped.substr(incPos, lineEnd == string::npos ? string::npos : lineEnd - incPos);
        for (int i = 0; forbiddenHeaders[i]; ++i) {
            if (line.find(forbiddenHeaders[i]) != string::npos) {
                return string("源代码包含 Windows 特有头文件: #include ") + forbiddenHeaders[i];
            }
        }
        incPos = lineEnd == string::npos ? stripped.size() : lineEnd + 1;
    }

    return ""; // 通过
}

// ---------- 构建选手程序编译命令 ----------
string buildCompileCommand(const string& cppPath, const string& exePath,
                           int cppVersion, bool noipMode) {
    string safeCpp = sanitizePath(cppPath);
    string safeExe = sanitizePath(exePath);
    if (noipMode) {
        // NOIP 标准：强制 c++14（除非显式指定更高）、-O2、-DONLINE_JUDGE、-lm
        int ver = (cppVersion >= 14) ? cppVersion : 14;
        return "g++ \"" + safeCpp + "\" -o \"" + safeExe + "\" -std=c++" + to_string(ver)
               + " -O2 -DONLINE_JUDGE -lm";
    }
    return "g++ \"" + safeCpp + "\" -o \"" + safeExe + "\" -std=c++" + to_string(cppVersion) + " -O2";
}

// ---------- 构建 checker 编译命令 ----------
string buildCheckerCompileCommand(const string& srcPath, const string& exePath) {
    return "g++ \"" + sanitizePath(srcPath) + "\" -o \"" + sanitizePath(exePath)
           + "\" -std=c++14 -O2";
}

// ---------- 按需编译 checker ----------
// 返回值：checkerExePath 写入实际可执行文件路径
// 对于 default checker，返回空字符串表示使用内置 compareAnswer
bool ensureCheckerReady(const string& checkerType, const string& customCheckerPath,
                        const string& checkerDir, string& checkerExePath) {
    checkerExePath = "";

    if (checkerType == "default" || checkerType.empty()) {
        // 内置默认比对，无需编译外部 checker
        return true;
    }

    string srcPath;
    string exePath;

    if (checkerType.rfind("custom:", 0) == 0) {
        // 自定义 checker，格式 custom:路径
        string customPath = checkerType.substr(7);
        srcPath = customPath;
        // exe 路径取同名 .exe 放到 checkerDir
        // 取文件名部分（不含扩展名）
        size_t slashPos = customPath.find_last_of("\\/");
        string base = (slashPos != string::npos) ? customPath.substr(slashPos + 1) : customPath;
        size_t dotPos = base.find_last_of('.');
        if (dotPos != string::npos) base = base.substr(0, dotPos);
        exePath = checkerDir + "\\" + base + ".exe";
    } else if (checkerType == "ncmp" || checkerType == "fcmp" || checkerType == "rcmp4") {
        srcPath = checkerDir + "\\" + checkerType + ".cpp";
        exePath = checkerDir + "\\" + checkerType + ".exe";
    } else {
        cerr << "错误: 不支持的 checker 类型: " << checkerType << endl;
        return false;
    }

    if (!fileExists(srcPath)) {
        cerr << "错误: checker 源文件不存在: " << srcPath << endl;
        return false;
    }

    // 已存在且比源文件新则跳过编译
    if (fileExists(exePath) && getFileSize(exePath) > 0) {
        checkerExePath = exePath;
        return true;
    }

    string cmd = buildCheckerCompileCommand(srcPath, exePath);
    int exitCode = 0;
    if (!runCommand(cmd, checkerDir, exitCode) || exitCode != 0 || !fileExists(exePath)) {
        cerr << "错误: 编译 checker 失败: " << srcPath << " (exitCode=" << exitCode << ")" << endl;
        return false;
    }
    checkerExePath = exePath;
    return true;
}

// ---------- 调用外部 checker ----------
// checker.exe <input> <output> <answer>
// 退出码约定：0 = AC，1 = WA，2 = PE，其它 = RTE
int runChecker(const string& checkerExe, const string& inputFile,
               const string& outputFile, const string& answerFile,
               const string& workDir) {
    string cmd = "\"" + checkerExe + "\" \"" + inputFile + "\" \""
                 + outputFile + "\" \"" + answerFile + "\"";
    int exitCode = 0;
    if (!runCommand(cmd, workDir, exitCode)) {
        return 3;
    }
    return exitCode;
}
