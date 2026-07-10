// fcmp.cpp - 内置 checker：忽略空白比对
// 调用约定：checker <input> <output> <answer>
// 比对规则：忽略所有空白字符（空格、制表、换行、回车），仅比对可见字符序列
#include "testlib.h"
#include <cctype>
#include <vector>

int main(int argc, char* argv[]) {
    registerTestlibCmd(argc, argv);

    std::vector<char> e, a;
    int c;
    while ((c = ans.readChar()) != -1) {
        if (!std::isspace((unsigned char)c)) e.push_back((char)c);
    }
    while ((c = ouf.readChar()) != -1) {
        if (!std::isspace((unsigned char)c)) a.push_back((char)c);
    }

    if (e.size() != a.size()) {
        quitf(_wa, "可见字符数量不一致 (期望 %zu，得到 %zu)", e.size(), a.size());
    }
    for (size_t i = 0; i < e.size(); ++i) {
        if (e[i] != a[i]) {
            quitf(_wa, "第 %zu 个可见字符不一致 (期望 '%c'，得到 '%c')",
                  i + 1, e[i], a[i]);
        }
    }
    quitf(_ok, "答案正确");
    return 0;
}
