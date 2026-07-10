// test_check.cpp - 验证 checkSourceCode 的 UKE 检测逻辑
#include "judger/checker.h"
#include "judger/fileio.h"
#include <iostream>

int main() {
    // 测试用例 1: 带 #pragma GCC optimize
    string r1 = checkSourceCode("test_uke/1/uke.cpp");
    cout << "[1] #pragma GCC optimize: "
         << (r1.empty() ? "PASS (不应通过却通过)" : "UKE 触发") << endl;
    cout << "    原因: " << r1 << endl;

    // 测试用例 2: 正常源文件
    string r2 = checkSourceCode("test_uke/1/sum.cpp");
    cout << "[2] 正常源文件: "
         << (r2.empty() ? "PASS (通过)" : "UKE 触发 (不应触发)") << endl;
    if (!r2.empty()) cout << "    原因: " << r2 << endl;

    // 测试用例 3: 带 #pragma once (应该通过)
    ofstream fout("test_uke/once_test.cpp");
    fout << "#pragma once\n#include <iostream>\nint main(){return 0;}\n";
    fout.close();
    string r3 = checkSourceCode("test_uke/once_test.cpp");
    cout << "[3] #pragma once: "
         << (r3.empty() ? "PASS (通过)" : "UKE 触发 (不应触发)") << endl;
    if (!r3.empty()) cout << "    原因: " << r3 << endl;

    // 测试用例 4: Windows 头文件
    ofstream fout4("test_uke/win_test.cpp");
    fout4 << "#include <iostream>\n#include <windows.h>\nint main(){return 0;}\n";
    fout4.close();
    string r4 = checkSourceCode("test_uke/win_test.cpp");
    cout << "[4] #include <windows.h>: "
         << (r4.empty() ? "PASS (不应通过却通过)" : "UKE 触发") << endl;
    cout << "    原因: " << r4 << endl;

    // 测试用例 5: 注释里的 #pragma (应该通过)
    ofstream fout5("test_uke/comment_test.cpp");
    fout5 << "// #pragma GCC optimize(\"O3\")\n#include <iostream>\nint main(){return 0;}\n";
    fout5.close();
    string r5 = checkSourceCode("test_uke/comment_test.cpp");
    cout << "[5] 注释里的 #pragma: "
         << (r5.empty() ? "PASS (通过)" : "UKE 触发 (不应触发)") << endl;
    if (!r5.empty()) cout << "    原因: " << r5 << endl;

    // 测试用例 6: conio.h
    ofstream fout6("test_uke/conio_test.cpp");
    fout6 << "#include <iostream>\n#include <conio.h>\nint main(){return 0;}\n";
    fout6.close();
    string r6 = checkSourceCode("test_uke/conio_test.cpp");
    cout << "[6] #include <conio.h>: "
         << (r6.empty() ? "PASS (不应通过却通过)" : "UKE 触发") << endl;
    cout << "    原因: " << r6 << endl;

    // 测试编译命令构建
    cout << "\n=== 编译命令测试 ===" << endl;
    cout << "[NOIP] " << buildCompileCommand("a.cpp", "a.exe", 14, true) << endl;
    cout << "[非NOIP] " << buildCompileCommand("a.cpp", "a.exe", 17, false) << endl;
    cout << "[checker] " << buildCheckerCompileCommand("ncmp.cpp", "ncmp.exe") << endl;

    return 0;
}
