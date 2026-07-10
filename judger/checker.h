// checker.h - 评测核心：答案比对、源代码检查、SPJ 调用
// 提供:
//   1. compareAnswer       - 内置默认文本比对
//   2. checkSourceCode     - NOIP 规范检查（触发 UKE）
//   3. buildCompileCommand - 构建选手程序编译命令（支持 NOIP 模式）
//   4. buildCheckerCompileCommand - 构建 checker 编译命令
//   5. ensureCheckerReady - 按需编译 checker（内置或自定义）
//   6. runChecker         - 调用外部 checker，返回 JudgeResult
#ifndef JUDGER_CHECKER_H
#define JUDGER_CHECKER_H

#include "common.h"
#include "result.h"

// 内置默认文本比对（忽略首尾空白、忽略空行）
JudgeResult compareAnswer(const string& playerOutFile, const string& ansFile, long long outputLimit);

// 检查源代码是否符合 NOIP 规范
// 返回空字符串表示通过，否则返回错误描述（调用方应判 UKE，0 分）
string checkSourceCode(const string& sourcePath);

// 构建选手程序编译命令
// noipMode = true 时使用 NOIP 标准选项（-std=c++14 -O2 -DONLINE_JUDGE -lm）
string buildCompileCommand(const string& cppPath, const string& exePath,
                           int cppVersion, bool noipMode);

// 构建 checker 编译命令（始终 NOIP 标准 c++14）
string buildCheckerCompileCommand(const string& srcPath, const string& exePath);

// 确保 checker 已编译为 exe；成功返回 true
// checkerType 取值：default / ncmp / fcmp / rcmp4 / custom:路径
bool ensureCheckerReady(const string& checkerType, const string& customCheckerPath,
                        const string& checkerDir, string& checkerExePath);

// 调用外部 checker.exe 进行 SPJ
// 返回 exitCode：0 = AC，1 = WA，2 = PE，其它 = RTE
int runChecker(const string& checkerExe, const string& inputFile,
               const string& outputFile, const string& answerFile,
               const string& workDir);

#endif // JUDGER_CHECKER_H
