# OJTool - 命令行代码评测工具

一个轻量级的命令行代码评测工具，支持多选手、多题目、多语言评测。使用 C++ 实现高性能评测引擎，Node.js 提供友好的 CLI 界面。

## 功能特点

- 🚀 **高性能评测**：C++ 评测引擎，支持超时检测、内存限制、输入输出重定向
- 👥 **多选手评测**：支持同时评测多个选手的代码
- 🏆 **竞赛模式**：多题目竞赛，自动排行榜统计
- 🌐 **多语言支持**：支持 C++、Python、Java 三种编程语言
- 💾 **内存限制检测**：实时监控内存使用，超限返回 MLE
- 📊 **详细结果**：每个测试点的状态、得分、耗时、内存使用统计
- 📝 **评测报告**：支持 JSON、HTML、Markdown 三种格式的报告生成
- ⚡ **实时进度条**：评测过程中显示进度和预计剩余时间
- 🔧 **灵活配置**：JSON 格式配置文件，支持全局配置 + 项目配置两级
- 🧹 **自动清理**：评测后自动清理临时文件
- 🌈 **彩色输出**：友好的命令行界面，支持详细/简洁模式
- 🔍 **测试用例管理**：校验测试用例完整性，统计用例信息
- 🎯 **SPJ (Special Judge)**：内置 5 种 checker（default / ncmp / fcmp / rcmp4 / custom），支持无序输出、浮点误差、自定义 checker
- ⚠️ **UKE 状态**：源代码 NOIP 规范检查（`#pragma`、Windows 头文件等），不符合规范直接判 UKE 0 分
- 🎓 **NOIP 模式**：模拟 NOIP/CSP 评测环境，使用 `g++ -std=c++14 -O2 -DONLINE_JUDGE -lm` 编译选项
- 🏗️ **C++ 评测机工程化**：judger/ 目录模块化拆分，提供 Makefile 一键构建（`make` / `make checkers`）

## 项目结构

```
OJTool/
├── bin/
│   ├── ojtool.js              # CLI 入口
│   └── judger.exe             # C++ 评测引擎（由 judger/ 编译产出）
├── src/                       # Node.js CLI 层
│   ├── commands/              # 命令实现
│   │   ├── doctor.js          # 环境检测
│   │   ├── init.js            # 初始化配置
│   │   ├── config.js          # 配置管理
│   │   ├── judge.js           # 单题评测
│   │   ├── contest.js         # 竞赛模式
│   │   ├── report.js          # 报告生成
│   │   └── testcase.js        # 测试用例管理
│   ├── core/                  # 核心模块
│   │   ├── configmanager.js   # 配置管理
│   │   ├── judgeengine.js     # 评测引擎（Node.js层）
│   │   ├── contestengine.js   # 竞赛引擎
│   │   └── testcasemanager.js # 测试用例管理
│   ├── languages/             # 语言适配器
│   │   ├── base.js            # 基类
│   │   ├── cpp.js             # C++ 适配器
│   │   ├── python.js          # Python 适配器
│   │   ├── java.js            # Java 适配器
│   │   └── index.js           # 语言注册
│   ├── reporters/             # 报告生成器
│   │   ├── json.js            # JSON 报告
│   │   ├── html.js            # HTML 报告
│   │   ├── markdown.js        # Markdown 报告
│   │   └── index.js           # 报告入口
│   └── utils/                 # 工具模块
│       ├── logger.js          # 日志工具
│       ├── progress.js        # 进度条
│       └── gppdetect.js       # g++ 检测
├── judger/                    # C++ 评测机工程化源码
│   ├── main.cpp               # 评测主流程
│   ├── config.{h,cpp}         # 配置读取（JudgeConfig 结构体）
│   ├── checker.{h,cpp}        # 答案比对、SPJ 调度、源码检查、NOIP 编译命令
│   ├── runner.{h,cpp}         # 进程启动、超时/内存控制
│   ├── result.{h,cpp}         # 结果枚举（AC/CE/RTE/TLE/OLE/MLE/WA/UKE）
│   ├── fileio.{h,cpp}         # 文件读写工具
│   ├── utils.{h,cpp}          # 通用工具（路径清洗、文件存在等）
│   ├── jsonout.{h,cpp}        # JSON 行输出协议
│   ├── common.h               # 公共头与类型别名
│   ├── testlib.h              # testlib 简化版（自定义 checker 接口）
│   ├── checkers/              # 内置 SPJ checker 源码
│   │   ├── default.cpp        # 默认文本比对（参考实现，judger 内置不走 exe）
│   │   ├── ncmp.cpp           # 无序整数比对
│   │   ├── fcmp.cpp           # 忽略空白比对
│   │   └── rcmp4.cpp          # 浮点数比对（1e-4 误差）
│   └── Makefile               # 构建脚本（make / make checkers）
├── Example/                   # 示例文件
│   ├── 1/, 2/                 # C++ 单题示例
│   ├── python/                # Python 示例
│   ├── java/                  # Java 示例
│   ├── contest/               # 竞赛模式示例
│   ├── spj/                   # SPJ 示例（ncmp / rcmp4 两种 checker）
│   └── uke/                   # UKE 示例（#pragma / windows.h 触发）
├── judger.cpp                 # C++ 评测机源码（兼容旧版单文件入口）
├── package.json               # Node.js 依赖
└── ojtool.json                # 当前配置文件
```

## 安装

### 前置要求

- Node.js >= 14
- 至少一种编程语言环境：
  - g++ 编译器（MinGW 或其他）- 用于 C++ 评测
  - Python 3 - 用于 Python 评测
  - JDK - 用于 Java 评测

### 本地安装

```bash
# 克隆项目后安装依赖
npm install

# 全局链接（可选，方便全局使用）
npm link
```

> **注意**：需要编译 C++ 评测机。如果已存在 `bin/judger.exe` 可跳过，否则推荐使用 `judger/` 目录下的 Makefile 构建：
>
> ```bash
> # 方式 1（推荐）：使用 judger/ 工程化 Makefile
> cd judger
> make              # 构建 bin/judger.exe
> make checkers     # 构建内置 SPJ checker（ncmp / fcmp / rcmp4）
> make clean        # 清理产物
>
> # 方式 2：单文件编译（兼容旧版）
> g++ -o bin/judger.exe judger.cpp -std=c++17 -O2 -static -lpsapi
> ```
>
> 详见下文 [C++ 评测机工程化](#c-评测机工程化) 章节。

### 验证安装

```bash
# 查看版本
ojtool --version

# 或使用简写命令
ojt --version

# 环境检测
ojtool doctor
```

## 快速开始

### 1. 环境检测

```bash
ojtool doctor
# 或
ojt doctor
```

检查编译器、配置文件、目录权限、评测机是否就绪。

### 2. 运行示例评测

```bash
# C++ 示例
ojtool judge --path ./Example -d

# Python 示例
ojtool judge --path ./Example/python -d

# Java 示例
ojtool judge --path ./Example/java -d

# 竞赛模式示例
ojtool contest --path ./Example/contest

# SPJ 示例（无序整数比对）
ojtool judge --path ./Example/spj/ncmp -d

# SPJ 示例（浮点数 1e-4 误差比对）
ojtool judge --path ./Example/spj/rcmp4 -d

# UKE 示例（选手代码触发 NOIP 规范检查）
ojtool judge --path ./Example/uke -d
```

### 3. 初始化配置

```bash
ojtool config init
# 或
ojt config init
```

在当前目录生成 `ojtool.json` 配置文件。

## 使用指南

### 配置文件说明

`ojtool.json` 配置项：

```json
{
  "version": "1.0.0",
  "language": "cpp",
  "compilerPath": "g++",
  "pythonPath": "python",
  "javaPath": "java",
  "javacPath": "javac",
  "problemPrefix": "sum",
  "testCaseCount": 3,
  "timeLimitMs": 1000,
  "memoryLimitKb": 262144,
  "scorePerCase": 10,
  "cppVersion": 17,
  "compileFlags": "-O2 -Wall",
  "outputLimitKb": 1024,
  "playerCount": 2,
  "basePath": "./Example/",
  "scoreMode": "sum",
  "checkerType": "default",
  "customCheckerPath": "",
  "noipMode": true,
  "problems": [
    {
      "name": "A",
      "prefix": "sum",
      "testCaseCount": 3,
      "timeLimitMs": 1000,
      "scorePerCase": 10,
      "checkerType": "default",
      "noipMode": true
    }
  ]
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `language` | 编程语言（cpp/python/java） | `cpp` |
| `problemPrefix` | 题目前缀（文件名前缀） | `problem` |
| `testCaseCount` | 测试用例数量 | `10` |
| `timeLimitMs` | 时间限制（毫秒） | `1000` |
| `memoryLimitKb` | 内存限制（KB） | `262144` (256MB) |
| `scorePerCase` | 每测试点分值 | `10` |
| `playerCount` | 选手数量 | `1` |
| `basePath` | 基础路径 | `./` |
| `checkerType` | SPJ checker 类型（`default` / `ncmp` / `fcmp` / `rcmp4` / `custom`） | `default` |
| `customCheckerPath` | 自定义 checker 源文件路径（仅 `checkerType=custom` 时使用） | `""` |
| `noipMode` | 是否启用 NOIP 模式（NOIP 编译选项 + 源代码规范检查） | `true` |
| `problems` | 竞赛模式题目数组（可选，每题可单独配置 `checkerType` / `noipMode`） | - |

> **checkerType 兼容性**：旧配置文件中的 `checker` 字段仍可读取，会自动映射到 `checkerType`，推荐使用新字段。

#### 两级配置系统

- **全局配置**：`~/.ojtool/config.json`（用户目录下）
- **项目配置**：当前目录的 `ojtool.json`
- **优先级**：命令行参数 > 项目配置 > 全局配置 > 默认配置

### 目录结构约定

#### 单题模式

```
{basePath}/
├── 1/                    # 选手 1 目录
│   └── {problemPrefix}.cpp  # 选手代码
├── 2/                    # 选手 2 目录
│   └── {problemPrefix}.cpp
├── {problemPrefix}1.in   # 测试点 1 输入
├── {problemPrefix}1.ans  # 测试点 1 答案
├── {problemPrefix}2.in   # 测试点 2 输入
├── {problemPrefix}2.ans  # 测试点 2 答案
└── ...
```

#### 竞赛模式

```
{basePath}/
├── 1/                    # 选手 1 目录
│   ├── A.cpp             # A 题代码
│   └── B.cpp             # B 题代码
├── 2/                    # 选手 2 目录
│   ├── A.cpp
│   └── B.cpp
├── A1.in / A1.ans        # A 题测试点 1
├── B1.in / B1.ans        # B 题测试点 1
└── ...
```

### 命令详解

#### 命令别名

支持两种命令形式：
- `ojtool` - 完整命令
- `ojt` - 简写命令（完全等效）

#### doctor - 环境检测

```bash
ojtool doctor
```

检测内容：
- Node.js 环境
- g++ / Python / Java 编译器
- 配置文件
- 评测机 exe

#### config - 配置管理

```bash
# 显示当前配置（含来源）
ojtool config show

# 获取配置项
ojtool config get language

# 设置全局配置
ojtool config set language python

# 初始化项目配置
ojtool config init

# 编辑配置文件
ojtool config edit
ojtool config edit -g    # 编辑全局配置
```

#### init - 初始化配置

```bash
ojtool init
```

交互式创建配置文件（config init 的别名）。

#### judge - 单题评测

```bash
# 使用默认配置评测
ojtool judge

# 指定选手数量
ojtool judge --players 10

# 指定基础路径
ojtool judge --path ./data

# 显示详细结果
ojtool judge -d

# 详细日志模式
ojtool judge -v

# 生成评测报告
ojtool judge --report html

# 指定 SPJ checker 类型（覆盖配置文件）
ojtool judge --checker ncmp
ojtool judge --checker rcmp4
ojtool judge --checker custom:./mychecker.cpp

# 启用 / 关闭 NOIP 模式
ojtool judge --noip true
ojtool judge --noip false

# 组合使用
ojtool judge -n 5 --path ./data -v -d --report all
ojtool judge --path ./Example/spj/rcmp4 --checker rcmp4 --noip true -d
```

参数说明：
- `-n, --players <count>`：指定选手数量
- `--path <basePath>`：指定基础路径
- `--language <lang>`：指定编程语言
- `--checker <type>`：SPJ checker 类型（`default` / `ncmp` / `fcmp` / `rcmp4` / `custom`），覆盖配置文件中的 `checkerType`
- `--noip <bool>`：是否启用 NOIP 模式（`true` / `false`），覆盖配置文件中的 `noipMode`
- `-v, --verbose`：详细日志输出
- `-d, --detail`：显示详细评测结果
- `--report <format>`：评测后生成报告（json/html/md/all）

#### contest - 竞赛模式

```bash
# 竞赛模式评测
ojtool contest

# 指定路径和选手数
ojtool contest --path ./contest --players 5

# 显示详细结果
ojtool contest -d

# 生成报告
ojtool contest --report html

# 全局覆盖 checker / NOIP 模式（不影响 problems 中已配置的题目）
ojtool contest --checker ncmp --noip true
```

竞赛模式支持：
- 多题目配置（problems 数组）
- 自动排行榜（按总分降序）
- 每道题独立评测
- 每道题可在 `problems[]` 中单独配置 `checkerType` / `noipMode`

#### report - 评测报告

```bash
# 生成 HTML 报告（默认）
ojtool report

# 指定格式
ojtool report --format json
ojtool report --format md
ojtool report --format all

# 指定输出文件
ojtool report --output result.html

# 指定路径和选手
ojtool report --path ./data --players 5
```

支持的报告格式：
- `json` - JSON 格式，便于后续处理
- `html` - HTML 网页，美观直观
- `md` - Markdown 格式，适合文档
- `all` - 同时生成所有格式

#### testcase - 测试用例管理

```bash
# 校验测试用例完整性
ojtool testcase validate

# 统计测试用例信息
ojtool testcase stats

# 指定路径和前缀
ojtool testcase validate --path ./data --prefix sum
```

校验内容：
- 输入/输出文件是否存在
- 文件是否为空
- 数量是否匹配

### 评测结果说明

| 状态 | 说明 | 是否得分 |
|------|------|----------|
| Accepted (AC) | 答案正确 | ✅ 得分 |
| Wrong Answer (WA) | 答案错误 | ❌ 0 分 |
| Time Limit Exceeded (TLE) | 运行超时 | ❌ 0 分 |
| Memory Limit Exceeded (MLE) | 内存超限 | ❌ 0 分 |
| Runtime Error (RTE) | 运行时错误 | ❌ 0 分 |
| Compile Error (CE) | 编译错误 | ❌ 0 分 |
| Output Limit Exceeded (OLE) | 输出超限 | ❌ 0 分 |
| Unknown Kernel Error (UKE) | 源代码不符合 NOIP 规范（含 `#pragma` 滥用、Windows 头文件等） | ❌ 0 分 |

> **UKE 触发条件**详见下文 [UKE 状态](#uke-状态) 章节。

## 多语言支持

### C++

默认语言，使用 g++ 编译，支持 C++11/14/17/20。

### Python

需要 Python 3 环境。无需编译，直接运行。

```bash
ojtool judge --language python
```

### Java

需要 JDK 环境。先 javac 编译，再 java 运行。主类名默认为 `Main`，也支持从源文件自动提取 `public class`。

```bash
ojtool judge --language java
```

## SPJ (Special Judge) 支持

### 什么是 SPJ

普通评测用「选手输出」与「标准答案」做**字节级精确比对**，一旦有任意字符不一致就判 WA。但很多题目的答案并不唯一：

- 输出集合 / 排列（顺序无关，例如最小生成树边集）
- 浮点数结果（允许误差）
- 多解问题（任意一组合法解都算对）

**SPJ (Special Judge)** 就是针对这类题目引入的「自定义答案检查程序」，在选手程序运行结束后，由 checker 决定输出是否正确。OJTool 内置了 5 种 checker，覆盖绝大多数常见场景，无需自己写 checker 即可使用。

### 内置 checker 类型

| checker | 名称 | 比对规则 | 适用场景 |
|---------|------|----------|----------|
| `default` | 普通文本比对 | 按 token 逐个比对，忽略多余空白与多余换行；逐行精确匹配，忽略空行 | 普通题目，输出格式固定 |
| `ncmp` | 无序整数比对 | 把选手输出和答案各读 n 个整数，作为**多重集**比对，顺序无关 | 输出集合 / 排列 / 最小生成树边集 |
| `fcmp` | 忽略空白比对 | 忽略所有空白字符（空格、制表、换行、回车），仅比对可见字符序列 | 输出格式自由、空格换行差异较大 |
| `rcmp4` | 浮点数比对 | `|expected - actual| <= 1e-4` 视为相等；输入文件首行为整数 n | 浮点题，允许 1e-4 误差 |
| `custom` | 自定义 checker | 调用用户提供的 checker 程序（需配合 `customCheckerPath`） | 上述都不满足时的特殊题目 |

> **default 与 fcmp 的区别**：`default` 按 token 比对，token 之间的空白数量无所谓，但 token 顺序必须一致；`fcmp` 直接忽略所有空白，只比对可见字符序列，对格式宽容度更高。

### 配置示例

#### 配置文件方式

```json
{
  "problemPrefix": "set",
  "testCaseCount": 1,
  "playerCount": 1,
  "basePath": "./Example/spj/ncmp/",
  "checkerType": "ncmp",
  "customCheckerPath": "",
  "noipMode": true
}
```

`checkerType=custom` 时需要给出 checker 源文件路径（相对于配置文件所在目录），judger 会自动编译：

```json
{
  "problemPrefix": "magic",
  "checkerType": "custom",
  "customCheckerPath": "./checkers/magic_checker.cpp"
}
```

#### 命令行方式

```bash
# 临时切换 checker（不修改配置文件）
ojtool judge --path ./Example/spj/ncmp --checker ncmp -d
ojtool judge --path ./Example/spj/rcmp4 --checker rcmp4 -d

# 自定义 checker（路径前加 custom: 前缀）
ojtool judge --checker custom:./checkers/magic_checker.cpp
```

### 竞赛模式中按题配置

竞赛模式下，可在 `problems[]` 中为每道题单独指定 checker：

```json
{
  "problems": [
    { "name": "A", "prefix": "sum",    "checkerType": "default" },
    { "name": "B", "prefix": "set",    "checkerType": "ncmp" },
    { "name": "C", "prefix": "sqrt",   "checkerType": "rcmp4" },
    { "name": "D", "prefix": "magic",  "checkerType": "custom", "customCheckerPath": "./checkers/magic.cpp" }
  ]
}
```

### 内置 checker 调用约定

所有 checker（包括自定义 checker）都遵循 testlib 兼容的命令行约定：

```
checker.exe <input> <output> <answer>
```

- `input`：选手程序的输入文件（也是 `.in` 文件）
- `output`：选手程序的输出文件
- `answer`：标准答案文件（`.ans`）

退出码约定：

| 退出码 | 含义 |
|--------|------|
| 0 | AC（答案正确） |
| 1 | WA（答案错误） |
| 2 | PE（格式错误） |
| 其他 | RTE（checker 自身出错） |

### 如何写自定义 checker

OJTool 在 `judger/testlib.h` 提供了 testlib 简化版，包含常用 API：`registerTestlibCmd` / `InStream` / `quitf` / `readInt` / `readDouble` / `readToken` / `readLong` / `seekEof` 等，兼容主流 checker 写法。

#### 示例：要求选手输出一个满足某条件的整数

题目：给定 n，要求输出一个 1~n 之间且能被 3 整除的正整数。

将以下内容保存为 `checkers/div3_checker.cpp`：

```cpp
// div3_checker.cpp - 自定义 checker 示例
// 调用约定：checker <input> <output> <answer>
#include "testlib.h"

int main(int argc, char* argv[]) {
    registerTestlibCmd(argc, argv);

    int n = inf.readInt();          // 从输入文件读 n
    int x = ouf.readInt(1, n);     // 从选手输出读 x，并校验 1 <= x <= n

    if (x % 3 != 0) {
        quitf(_wa, "输出 %d 不能被 3 整除", x);
    }
    quitf(_ok, "答案正确：%d 是合法解", x);
    return 0;
}
```

#### 配置使用

```json
{
  "problemPrefix": "div3",
  "testCaseCount": 1,
  "playerCount": 1,
  "basePath": "./",
  "checkerType": "custom",
  "customCheckerPath": "./checkers/div3_checker.cpp",
  "noipMode": false
}
```

#### 编译说明

- judger 会在评测前**自动编译** `customCheckerPath` 指向的 `.cpp` 文件（如果对应的 `.exe` 不存在或源文件已更新），编译命令为 `g++ <src> -o <exe> -std=c++14 -O2`，工作目录为 `judger/`，因此 `#include "testlib.h"` 可以直接找到。
- 如果想手动编译，可执行：
  ```bash
  cd judger
  g++ -std=c++14 -O2 -I. -o ../checkers/div3_checker.exe ../checkers/div3_checker.cpp
  ```
- 也可使用 `make checkers` 一键构建内置 checker（ncmp / fcmp / rcmp4）。

### SPJ 示例目录

`Example/spj/` 下提供两个完整可运行示例：

```
Example/spj/
├── ncmp/                       # 无序整数比对示例
│   ├── 1/set.cpp               # 选手代码：读 n 个数，排序后输出
│   ├── set1.in                 # 输入：3\n3 1 2
│   ├── set1.ans                # 答案：3 2 1（顺序无关，1 2 3 也能 AC）
│   └── ojtool.json             # checkerType: ncmp
└── rcmp4/                      # 浮点数比对示例
    ├── 1/sqrt.cpp              # 选手代码：读 n 个数，输出平方根
    ├── sqrt1.in                # 输入：3\n4 9 16
    ├── sqrt1.ans               # 答案：2.000000 3.000000 4.000000
    └── ojtool.json             # checkerType: rcmp4
```

运行：

```bash
ojtool judge --path ./Example/spj/ncmp  -d
ojtool judge --path ./Example/spj/rcmp4 -d
```

## UKE 状态

### 什么是 UKE

UKE（Unknown Kernel Error）是 OJTool 在 NOIP 模式下对「源代码不符合 NOIP 规范」专门引入的结果状态。一旦触发，**该选手本题直接判 UKE，0 分**，且不再编译运行后续测试点（与 CE 同等处理）。

### 触发条件

OJTool 在编译选手程序之前，会对源代码做静态扫描（已剥离注释，避免误判）。命中以下任一规则即触发 UKE：

#### 1. 包含 `#pragma` 指令（`#pragma once` 除外）

NOIP/CSP 评测环境禁止选手通过 `#pragma` 优化编译器行为，常见的禁用写法：

```cpp
#pragma GCC optimize("O3")          // ❌ 触发 UKE
#pragma GCC target("avx2")           // ❌ 触发 UKE
#pragma comment(lib, "winmm")       // ❌ 触发 UKE
#pragma once                        // ✅ 允许（头文件保护，不影响代码生成）
```

#### 2. 包含 Windows 特有头文件

NOIP/CSP 在 Linux 下评测，Windows 平台头文件无法编译。被禁的头文件包括但不限于：

```cpp
#include <windows.h>     // ❌ 触发 UKE
#include <conio.h>       // ❌ 触发 UKE
#include <io.h>          // ❌ 触发 UKE
#include <direct.h>      // ❌ 触发 UKE
#include <process.h>     // ❌ 触发 UKE
#include <winsock2.h>    // ❌ 触发 UKE
#include <ws2tcpip.h>    // ❌ 触发 UKE
#include <winbase.h>     // ❌ 触发 UKE
#include <winuser.h>     // ❌ 触发 UKE
#include <shlobj.h>      // ❌ 触发 UKE
#include <tlhelp32.h>    // ❌ 触发 UKE
#include <psapi.h>       // ❌ 触发 UKE
#include <winternl.h>    // ❌ 触发 UKE
```

### 为什么需要 UKE

- **公平性**：`#pragma GCC optimize` 等指令可让选手获得非标准性能优势
- **跨平台性**：Windows 头文件在 Linux 评测机下无法编译，提前拦截避免误判 CE
- **规范性**：模拟真实 NOIP/CSP 评测环境，培养选手写「干净」代码的习惯

### UKE 示例

`Example/uke/` 下提供两个触发 UKE 的选手代码示例：

```
Example/uke/
├── 1/sum.cpp          # 选手 1：使用 #pragma GCC optimize("O3")
├── 2/sum.cpp          # 选手 2：包含 <windows.h>
├── sum1.in            # 输入：1 2
├── sum1.ans           # 答案：3
└── ojtool.json        # noipMode: true（默认开启）
```

运行：

```bash
ojtool judge --path ./Example/uke -d
```

预期输出：两位选手均判 UKE，0 分。即使代码逻辑正确（a+b），由于源代码不规范，仍无法得分。

### 关闭 UKE 检查

如果不希望进行 NOIP 规范检查，可关闭 NOIP 模式：

```bash
# 命令行
ojtool judge --noip false

# 配置文件
{ "noipMode": false }
```

> 关闭 NOIP 模式后，既不会做源代码规范检查，也不会使用 NOIP 标准编译选项（详见下文）。

## NOIP 模式

### 编译选项

NOIP 模式开启时，选手代码使用 NOIP/CSP 官方评测环境的编译选项：

```bash
g++ <src> -o <exe> -std=c++14 -O2 -DONLINE_JUDGE -lm
```

各选项说明：

| 选项 | 作用 |
|------|------|
| `-std=c++14` | 强制使用 C++14 标准（NOIP/CSP 标准；若配置 `cppVersion >= 14` 则用配置值，否则强制升到 14） |
| `-O2` | 优化等级 2，与官方评测一致 |
| `-DONLINE_JUDGE` | 定义 `ONLINE_JUDGE` 宏，常见于 Codeforces 等 OJ，部分代码会用 `#ifdef ONLINE_JUDGE` 切换调试逻辑 |
| `-lm` | 链接数学库（C 语言遗留，C++ 默认已链接，这里加上与官方命令保持一致） |

关闭 NOIP 模式时，使用通用编译选项：

```bash
g++ <src> -o <exe> -std=c++<cppVersion> -O2
```

### 源代码检查

NOIP 模式开启时，在编译前对源代码做静态检查，命中规则直接判 UKE。详见 [UKE 状态](#uke-状态) 章节。

### 模拟 NOIP/CSP 评测环境

完整开启 NOIP 模式后，OJTool 可用于：

- NOIP/CSP 模拟赛训练
- 校内 OJ 仿真评测
- 选手代码规范检查

```bash
# 完整模拟 NOIP 评测
ojtool judge --path ./contest --noip true --checker default -d
```

## C++ 评测机工程化

### 项目结构

从 v2.1.0 起，C++ 评测机源码从单文件 `judger.cpp` 重构为模块化的 `judger/` 目录：

```
judger/
├── main.cpp               # 评测主流程（编排 config / checker / runner）
├── config.{h,cpp}         # JudgeConfig 结构体 + ojtool.json 读取
├── checker.{h,cpp}        # 答案比对、SPJ 调度、源码 NOIP 检查、编译命令构建
├── runner.{h,cpp}         # 进程启动、超时检测、内存监控
├── result.{h,cpp}         # 结果枚举（AC/CE/RTE/TLE/OLE/MLE/WA/UKE）+ 字符串转换
├── fileio.{h,cpp}         # 文件读写工具（按行读取、整体读取、文件大小等）
├── utils.{h,cpp}          # 通用工具（路径清洗、文件存在、字符串裁剪等）
├── jsonout.{h,cpp}        # JSON 行输出协议（与 Node.js 层通信）
├── common.h               # 公共头与类型别名（string / vector / 通用宏）
├── testlib.h              # testlib 简化版（自定义 checker 接口）
├── checkers/              # 内置 SPJ checker 源码
│   ├── default.cpp        # 默认文本比对（参考实现，judger 内置不走 exe）
│   ├── ncmp.cpp           # 无序整数比对
│   ├── fcmp.cpp           # 忽略空白比对
│   └── rcmp4.cpp          # 浮点数比对（1e-4 误差）
└── Makefile               # 构建脚本
```

### 模块职责

| 模块 | 职责 |
|------|------|
| `main.cpp` | 评测主流程：读取配置 → 遍历选手 → 遍历测试点 → 编译 → 运行 → 比对 → 输出 JSON 行 |
| `config` | `JudgeConfig` 结构体定义与 `ojtool.json` 解析（缺失字段使用默认值，向后兼容） |
| `checker` | `compareAnswer`（内置默认比对）、`checkSourceCode`（UKE 检查）、`buildCompileCommand`（NOIP 编译命令）、`ensureCheckerReady`（按需编译 checker）、`runChecker`（调用外部 checker） |
| `runner` | `runCommand`（同步执行命令并获取退出码）、`runPlayer`（带超时与内存限制的选手程序运行） |
| `result` | `JudgeResult` 枚举与字符串转换 |
| `fileio` | 文件存在 / 文件大小 / 按行读 / 整体读 |
| `utils` | `sanitizePath`（路径危险字符过滤）、`trim`（字符串裁剪）等 |
| `jsonout` | 与 Node.js 层的 JSON 行协议输出 |

### 如何编译

#### 使用 Makefile（推荐）

```bash
cd judger

make              # 构建 bin/judger.exe（默认目标）
make all          # 等同于 make
make checkers     # 仅构建内置 SPJ checker（ncmp / fcmp / rcmp4）
make clean        # 清理产物（*.o / judger.exe / checkers/*.exe）
```

Makefile 关键说明：

- `judger.exe` 用 `-std=c++17` 编译（评测机自身使用现代 C++）
- 内置 checker 用 `-std=c++14`（NOIP 标准），`-I.` 用于找到 `testlib.h`
- `default` 类型不走外部 checker，由 judger 内置 `compareAnswer` 实现，因此 `make checkers` 不编译 `default.exe`（也避免 Windows 上 `default.exe` 文件名与系统冲突）。`checkers/default.cpp` 仅作为参考实现保留

#### 单文件编译（兼容旧版）

如果不想使用 Makefile，仍可直接编译根目录的 `judger.cpp`：

```bash
g++ -o bin/judger.exe judger.cpp -std=c++17 -O2 -static -lpsapi
```

> `judger.cpp` 是 v1 时代的单文件入口，保留用于向后兼容。新功能（SPJ、UKE 等）只在 `judger/` 工程化版本中提供，推荐使用 Makefile 构建。

#### 自动构建（npm install 时）

`package.json` 的 `preinstall` 脚本会尝试自动编译 `judger.cpp`：

```bash
npm install
```

如果编译失败，会输出提示，可手动执行上述命令。

## 安全特性

- 🔒 **命令注入防护**：路径过滤危险字符
- 🔒 **路径遍历防护**：禁止 `..` 路径遍历
- 🧹 **临时文件自动清理**：评测后自动删除编译产物
- 🛡️ **输入验证**：所有配置项均有类型和范围校验

## 版本历史

### v2.1.0

**新增功能：**
- 🎯 **SPJ (Special Judge) 支持**：内置 5 种 checker
  - `default`：普通文本比对（按 token 比对，忽略多余空白与空行）
  - `ncmp`：无序整数比对（多重集比对，顺序无关，适合集合/排列输出）
  - `fcmp`：忽略空白比对（仅比对可见字符序列）
  - `rcmp4`：浮点数比对（允许 1e-4 误差，适合浮点题）
  - `custom`：自定义 checker 程序路径（基于 testlib.h 简化版）
- ⚠️ **UKE 状态**：源代码 NOIP 规范检查
  - 检测 `#pragma` 指令（`#pragma once` 除外）
  - 检测 Windows 特有头文件（`windows.h` / `conio.h` / `winsock2.h` 等 13 种）
  - 命中即判 UKE，0 分，跳过本选手剩余测试点
- 🎓 **NOIP 模式**：模拟 NOIP/CSP 评测环境
  - 编译选项：`g++ -std=c++14 -O2 -DONLINE_JUDGE -lm`
  - 编译前源代码静态检查（自动剥离注释，避免误判）
  - 可通过 `--noip false` 或 `noipMode: false` 关闭
- 🏗️ **C++ 评测机工程化**：单文件 `judger.cpp` 重构为模块化 `judger/` 目录
  - 拆分为 8 个模块：main / config / checker / runner / result / fileio / utils / jsonout
  - 提供 `Makefile`：`make` 构建 judger.exe，`make checkers` 构建内置 checker
  - 内置 `testlib.h` 简化版，自定义 checker 可直接 `#include "testlib.h"`

**新增配置字段：**
- `checkerType`：SPJ checker 类型（默认 `default`）
- `customCheckerPath`：自定义 checker 源文件路径
- `noipMode`：是否启用 NOIP 模式（默认 `true`）

**新增命令参数：**
- `judge --checker <type>`：覆盖配置文件中的 `checkerType`
- `judge --noip <bool>`：覆盖配置文件中的 `noipMode`
- `contest --checker <type>` / `contest --noip <bool>`：竞赛模式全局覆盖

**新增示例：**
- `Example/spj/ncmp/`：无序整数比对完整示例
- `Example/spj/rcmp4/`：浮点数比对完整示例
- `Example/uke/`：UKE 触发示例（`#pragma` / `windows.h`）

**兼容性：**
- 旧配置文件中的 `checker` 字段自动映射到 `checkerType`，无需修改
- `judger.cpp` 单文件入口保留，向后兼容旧版本

### v2.0.0

**新增功能：**
- 多语言支持（C++、Python、Java）
- 插件化语言适配器架构
- 多题目竞赛模式与排行榜
- 内存限制检测（MLE）
- 评测报告生成（JSON/HTML/Markdown）
- 实时进度条
- 测试用例管理工具
- 两级配置系统（全局 + 项目）
- C++ 评测机 JSON 行输出
- Node.js 评测引擎重构

**架构优化：**
- 引入 ESLint 代码规范
- Jest 单元测试框架
- Logger 模块化重构
- 统一错误处理系统

### v1.0.0

**新增功能：**
- 完整的评测功能（编译、运行、超时检测、结果比对）
- 多选手单题目评测
- 彩色命令行界面
- 自动清理临时文件
- Example 示例目录

**Bug 修复：**
- 修复 C++ 评测机输入重定向缺失问题
- 修复 C++ 评测机输出句柄继承问题
- 修复 C++ 评测机未解析 basePath 配置的问题
- 修复命名不一致导致的跨平台兼容问题
- 修复 config --reset 功能缺失

**安全修复：**
- 修复编译命令注入漏洞
- 添加路径遍历防护

## License

MIT:
可以自行Fork、修改/优化、提出PR
