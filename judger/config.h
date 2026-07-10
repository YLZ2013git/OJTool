// config.h - 评测配置结构体与读取函数声明
// 把 readConfigFile 的多个输出参数重构为 JudgeConfig 结构体
// 新增字段：checkerType / customCheckerPath / noipMode / language
#ifndef JUDGER_CONFIG_H
#define JUDGER_CONFIG_H

#include "common.h"

// 评测配置（所有字段都有默认值，向后兼容旧 ojtool.json）
struct JudgeConfig {
    string problemPrefix   = "problem";
    int    testCaseCount   = 10;
    int    playerCount     = 1;
    string basePath        = "./";
    int    timeLimitMs     = 1000;
    int    memoryLimitKb   = 262144;       // 默认 256 MB
    int    scorePerCase    = 10;
    int    cppVersion      = 14;           // NOIP 默认 c++14
    long long outputLimit  = 1024LL * 1024; // 默认 1 MB（字节）
    string checkerType     = "default";   // default / ncmp / fcmp / rcmp4 / custom:路径
    string customCheckerPath = "";         // custom checker 源文件路径
    bool   noipMode        = true;         // NOIP 标准编译选项
    string language        = "cpp";        // 选手语言（暂仅 cpp 完整支持）
};

// 从 ojtool.json 读取配置（缺失字段使用默认值）
bool readConfigFile(const string& configPath, JudgeConfig& cfg);

// 在控制台交互式输入配置
void inputConfigInteractive(JudgeConfig& cfg);

#endif // JUDGER_CONFIG_H
