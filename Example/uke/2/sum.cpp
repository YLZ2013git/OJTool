// 选手 2 代码：包含 Windows 平台特有头文件 windows.h
// 在 NOIP 模式下会触发 UKE（跨平台性受限，禁止使用）
// 即便逻辑正确（a+b），最终仍判 UKE，0 分
#include <iostream>
#include <windows.h>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
