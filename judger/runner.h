// runner.h - 程序运行/管理工具函数声明
// 提供 runCommand（普通命令）和 runProgramWithCheck（带 TLE/MLE 监控的选手程序运行）
#ifndef JUDGER_RUNNER_H
#define JUDGER_RUNNER_H

#include "common.h"
#include "result.h"

// 运行任意命令行，等待其结束并取得退出码
bool runCommand(const string& cmdLine, const string& workDir, int& exitCode);

// 运行选手程序，附带 TLE / MLE 检测
// 输入/输出通过文件重定向，期间轮询内存与时间
JudgeResult runProgramWithCheck(const string& exePath, const string& workDir,
                                const string& inFile, const string& outFile,
                                int timeLimitMs, int memoryLimitKb,
                                int& timeMs, int& memoryKb);

#endif // JUDGER_RUNNER_H
