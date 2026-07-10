// rcmp4.cpp - 内置 checker：浮点数比对（4 位小数精度）
// 调用约定：checker <input> <output> <answer>
// 输入文件首行为整数 n，表示有 n 个浮点数
// 比对规则：|expected - actual| <= 1e-4 视为相等
#include "testlib.h"
#include <cmath>

int main(int argc, char* argv[]) {
    registerTestlibCmd(argc, argv);

    int n = inf.readInt();
    const double EPS = 1e-4;

    for (int i = 0; i < n; ++i) {
        double expected = ans.readDouble();
        double actual   = ouf.readDouble();
        if (std::fabs(expected - actual) > EPS) {
            quitf(_wa, "第 %d 个数误差过大: 期望 %.6f，得到 %.6f",
                  i + 1, expected, actual);
        }
    }
    quitf(_ok, "答案正确");
    return 0;
}
