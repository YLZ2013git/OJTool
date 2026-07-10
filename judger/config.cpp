// config.cpp - 评测配置读取与交互式输入实现
#include "config.h"
#include "utils.h"
#include <fstream>

bool readConfigFile(const string& configPath, JudgeConfig& cfg) {
    ifstream fin(configPath);
    if (!fin.is_open()) {
        cerr << "错误: 无法打开配置文件 " << configPath << endl;
        return false;
    }
    string content, line;
    while (getline(fin, line)) {
        content += line + "\n";
    }
    fin.close();

    // 字符串字段
    string prefix = parseJsonString(content, "problemPrefix");
    if (!prefix.empty()) cfg.problemPrefix = prefix;

    string bp = parseJsonString(content, "basePath");
    if (!bp.empty()) cfg.basePath = expandEnvVars(bp);

    string checker = parseJsonString(content, "checker");
    if (!checker.empty()) cfg.checkerType = checker;

    string customChecker = parseJsonString(content, "customCheckerPath");
    if (!customChecker.empty()) cfg.customCheckerPath = customChecker;

    string lang = parseJsonString(content, "language");
    if (!lang.empty()) cfg.language = lang;

    // 整数字段
    int tc = parseJsonInt(content, "testCaseCount");
    if (tc > 0) cfg.testCaseCount = tc;

    int pc = parseJsonInt(content, "playerCount");
    if (pc > 0) cfg.playerCount = pc;

    int tl = parseJsonInt(content, "timeLimitMs");
    if (tl > 0) cfg.timeLimitMs = tl;

    int ml = parseJsonInt(content, "memoryLimitKb");
    if (ml > 0) cfg.memoryLimitKb = ml;

    int sc = parseJsonInt(content, "scorePerCase");
    if (sc > 0) cfg.scorePerCase = sc;

    int ver = parseJsonInt(content, "cppVersion");
    if (ver > 0) cfg.cppVersion = ver;

    int ol = parseJsonInt(content, "outputLimitKb");
    if (ol > 0) cfg.outputLimit = (long long)ol * 1024;

    // 布尔字段
    cfg.noipMode = parseJsonBool(content, "noipMode");

    return true;
}

void inputConfigInteractive(JudgeConfig& cfg) {
    cout << "===== 输入参数 =====" << endl;
    cout << "题目前缀: ";                cin >> cfg.problemPrefix;
    cout << "测试用例数: ";              cin >> cfg.testCaseCount;
    cout << "选手人数: ";                cin >> cfg.playerCount;
    cout << "根路径: ";                  cin >> cfg.basePath;
    cout << "限时时间(ms): ";            cin >> cfg.timeLimitMs;
    cout << "内存限制(KB, 0表示不限制): "; cin >> cfg.memoryLimitKb;
    cout << "每测试点分值: ";            cin >> cfg.scorePerCase;
    cout << "C++版本: ";                 cin >> cfg.cppVersion;
    long long ol;
    cout << "输出限制(KB): ";            cin >> ol;
    cfg.outputLimit = ol * 1024;
    cout << "checker 类型 (default/ncmp/fcmp/rcmp4/custom:路径): ";
    cin >> cfg.checkerType;
    string noipInput;
    cout << "启用 NOIP 模式 (y/n, 默认 y): ";
    cin >> noipInput;
    cfg.noipMode = !(noipInput == "n" || noipInput == "N");
}
