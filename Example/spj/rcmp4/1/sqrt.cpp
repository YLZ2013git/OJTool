// 选手代码：读取 n 个整数，输出它们的平方根
// 题目要求：浮点输出，允许 1e-4 误差
// 配套 checker：rcmp4（浮点数比对）
#include <iostream>
#include <cmath>
#include <iomanip>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << fixed << setprecision(6);
    for (int i = 0; i < n; ++i) {
        double x;
        cin >> x;
        cout << sqrt(x) << ' ';
    }
    return 0;
}
