// default.cpp - 内置 checker：普通文本比对
// 调用约定：checker <input> <output> <answer>
// 退出码：0 = AC，1 = WA，2 = PE
//
// 比对规则：按 token 逐个比对，忽略多余空白和多余换行。
#include "testlib.h"

int main(int argc, char* argv[]) {
    registerTestlibCmd(argc, argv);

    while (!ans.seekEof()) {
        if (ouf.seekEof()) {
            quitf(_wa, "输出数量不足");
        }
        std::string expected = ans.readToken();
        std::string actual   = ouf.readToken();
        if (expected != actual) {
            quitf(_wa, "期望 '%s'，得到 '%s'", expected.c_str(), actual.c_str());
        }
    }
    if (!ouf.seekEof()) {
        quitf(_wa, "选手输出有多余内容");
    }
    quitf(_ok, "答案正确");
    return 0;
}
