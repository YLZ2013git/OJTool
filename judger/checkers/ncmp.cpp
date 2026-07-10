// ncmp.cpp - 内置 checker：无序整数比对
// 调用约定：checker <input> <output> <answer>
// 输入文件首行为整数 n，表示有 n 个数；选手输出和答案各有 n 个整数
// 比对规则：作为多重集比对，顺序无关
#include "testlib.h"
#include <set>

int main(int argc, char* argv[]) {
    registerTestlibCmd(argc, argv);

    int n = inf.readInt();

    std::multiset<long long> expected, actual;
    for (int i = 0; i < n; ++i) {
        expected.insert(ans.readLong());
    }
    for (int i = 0; i < n; ++i) {
        if (ouf.seekEof()) {
            quitf(_wa, "输出数量不足");
        }
        actual.insert(ouf.readLong());
    }
    if (expected != actual) {
        quitf(_wa, "集合不匹配");
    }
    quitf(_ok, "答案正确");
    return 0;
}
