// judger.cpp - 兼容入口
// 历史版本的单文件 judger.cpp 已拆分为 judger/ 目录下的多文件工程。
// 此文件保留以维持向后兼容（如 preinstall 脚本中的旧编译命令），
// 直接包含 judger/main.cpp 即可使用新版本。
//
// 推荐构建方式：
//   cd judger && make            # 使用 Makefile
//   或：
//   g++ judger\main.cpp judger\result.cpp judger\utils.cpp judger\fileio.cpp ^
//       judger\runner.cpp judger\checker.cpp judger\jsonout.cpp judger\config.cpp ^
//       -o bin\judger.exe -std=c++17 -O2 -static -lpsapi
#include "judger/main.cpp"
