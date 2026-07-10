// 选手代码：读取 n 个整数，输出排序后的结果
// 题目要求：输出 n 个数的某种排列即可（顺序无关）
// 配套 checker：ncmp（无序整数比对）
#include <iostream>
#include <set>
using namespace std;

int main() {
    int n;
    cin >> n;
    multiset<int> s;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        s.insert(x);
    }
    // 升序输出；即便输出 3 2 1 或 2 1 3 也能 AC
    for (int x : s) cout << x << ' ';
    return 0;
}
