// testlib.h - testlib 简化版实现
// 提供 testlib 兼容的 SPJ checker 接口
// 命令行约定：checker <input> <output> <answer>
// 退出码约定：0 = AC，1 = WA，2 = PE，3 = FAIL
//
// 这是简化版，仅包含常用 API：registerTestlibCmd / InStream / quitf / quitp
// 兼容主流 checker 写法，不实现全功能。
#ifndef TESTLIB_H
#define TESTLIB_H

#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <cmath>
#include <cstdlib>
#include <cstdarg>
#include <cctype>
#include <set>
#include <algorithm>

// 结果类型（与 testlib 主线一致）
enum TResult {
    _ok = 0,
    _wa = 1,
    _pe = 2,        // Presentation Error
    _fail = 3,
    _dirt = 4,
    _points = 5,
    _partially = 6
};

// 全局状态
static TResult testlib_result = _ok;
static std::string testlib_message = "";
static double testlib_points = 0;

// InStream：testlib 风格的输入流包装
class InStream {
    std::istream* stream;
    bool owner;
public:
    InStream() : stream(nullptr), owner(false) {}

    void init(std::istream* s) {
        stream = s;
        owner = false;
    }

    // 设置 strict 模式（简化版忽略）
    void strict(bool /*v*/) {}

    // 读一个整数
    int readInt() {
        int x;
        if (!(*stream >> x)) {
            testlib_result = _wa;
            testlib_message = "读取整数失败";
            std::exit(1);
        }
        return x;
    }

    // 读一个 long long
    long long readLong() {
        long long x;
        if (!(*stream >> x)) {
            testlib_result = _wa;
            testlib_message = "读取长整数失败";
            std::exit(1);
        }
        return x;
    }

    // 读一个 double
    double readDouble() {
        double x;
        if (!(*stream >> x)) {
            testlib_result = _wa;
            testlib_message = "读取浮点数失败";
            std::exit(1);
        }
        return x;
    }

    // 读一个 token（非空白字符序列）
    std::string readToken() {
        std::string s;
        if (!(*stream >> s)) {
            testlib_result = _wa;
            testlib_message = "读取 token 失败";
            std::exit(1);
        }
        return s;
    }

    // 读一个字符（不做跳过，原样返回，EOF 时返回 -1）
    int readChar() {
        char c;
        if (!stream->get(c)) {
            return -1;
        }
        return (unsigned char)c;
    }

    // 读一行（不含换行符）
    std::string readLine() {
        std::string s;
        if (!std::getline(*stream, s)) {
            testlib_result = _wa;
            testlib_message = "读取行失败";
            std::exit(1);
        }
        return s;
    }

    // 跳过空白后判断是否到达 EOF
    bool seekEof() {
        char c;
        while (stream->get(c)) {
            if (!std::isspace((unsigned char)c)) {
                stream->putback(c);
                return false;
            }
        }
        return true;
    }

    // 原始 eof
    bool eof() {
        return stream->eof();
    }

    // 跳过空白
    void skipBlanks() {
        char c;
        while (stream->get(c)) {
            if (!std::isspace((unsigned char)c)) {
                stream->putback(c);
                return;
            }
        }
    }
};

// 全局输入流（testlib 兼容命名）
static InStream inf;
static InStream ouf;
static InStream ans;

// 静态文件流（注册时打开，进程结束自动关闭）
static std::ifstream* testlib_fin = nullptr;
static std::ifstream* testlib_fout = nullptr;
static std::ifstream* testlib_fans = nullptr;

// 注册 checker：参数 <input> <output> <answer>
inline void registerTestlibCmd(int argc, char* argv[]) {
    if (argc < 4) {
        std::cerr << "Usage: checker <input> <output> <answer>" << std::endl;
        std::exit(3);
    }

    static std::ifstream fin(argv[1]);
    static std::ifstream fout(argv[2]);
    static std::ifstream fans(argv[3]);

    if (!fin.is_open())  { std::cerr << "无法打开输入文件: " << argv[1] << std::endl; std::exit(3); }
    if (!fout.is_open()) { std::cerr << "无法打开输出文件: " << argv[2] << std::endl; std::exit(3); }
    if (!fans.is_open()) { std::cerr << "无法打开答案文件: " << argv[3] << std::endl; std::exit(3); }

    testlib_fin  = &fin;
    testlib_fout = &fout;
    testlib_fans = &fans;

    inf.init(&fin);
    ouf.init(&fout);
    ans.init(&fans);
}

// 退出并报告结果（printf 风格消息）
inline void quitf(TResult result, const char* format, ...) {
    testlib_result = result;

    va_list args;
    va_start(args, format);
    char buf[2048];
    vsnprintf(buf, sizeof(buf), format, args);
    va_end(args);

    testlib_message = buf;

    // 把消息写到 stderr 便于调试，stdout 留给评测机读取（如有需要）
    std::cout << testlib_message << std::endl;

    std::exit((int)result);
}

// 退出并给部分分
inline void quitp(double points, const char* format, ...) {
    testlib_result = _points;
    testlib_points = points;

    va_list args;
    va_start(args, format);
    char buf[2048];
    vsnprintf(buf, sizeof(buf), format, args);
    va_end(args);

    testlib_message = buf;
    std::cout << testlib_message << std::endl;
    std::exit(0);
}

#endif // TESTLIB_H
