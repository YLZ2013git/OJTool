// result.h - 评测结果枚举与转换函数声明
// 包含 AC/CE/RTE/TLE/OLE/MLE/WA/UKE 八种状态
// UKE 用于源代码不符合 NOIP 规范的情况（#pragma 滥用、Windows 头文件等）
#ifndef JUDGER_RESULT_H
#define JUDGER_RESULT_H

#include "common.h"

// 评测结果枚举
enum JudgeResult {
    AC,   // Accepted
    CE,   // Compile Error
    RTE,  // Runtime Error
    TLE,  // Time Limit Exceeded
    OLE,  // Output Limit Exceeded
    MLE,  // Memory Limit Exceeded
    WA,   // Wrong Answer
    UKE   // Unknown Kernel Error / 源代码不符合规范
};

// 把枚举值转换为完整英文字符串（如 "Accepted"）
string resultToString(JudgeResult res);

// 把枚举值转换为短状态码字符串（如 "AC"）
string resultToShortString(JudgeResult res);

#endif // JUDGER_RESULT_H
