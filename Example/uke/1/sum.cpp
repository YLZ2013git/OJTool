// 选手 1 代码：使用了 #pragma GCC optimize 指令
// 在 NOIP 模式下会触发 UKE（#pragma once 之外的 pragma 均被禁止）
// 即便逻辑正确（a+b），最终仍判 UKE，0 分
#pragma GCC optimize("O3")
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
