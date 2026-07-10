const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getConfigPath, getGlobalConfigPath, loadGlobalConfig, getConfig } = require('../core/configmanager');
const { detectGpp } = require('../utils/gppdetect');
const { getJudgerPath } = require('../core/judgeengine');
const PythonAdapter = require('../languages/python');
const JavaAdapter = require('../languages/java');

module.exports = async function doctor() {
    console.log(chalk.blue.bold('🔍 环境检测中...'));
    console.log('');

    // 1. 检测 g++
    console.log(chalk.cyan('📌 [1/8] 检测 g++ 编译器'));
    const gppResult = await detectGpp();
    if (gppResult.found) {
        console.log(chalk.green(`  ✅ g++ 已安装 (版本: ${gppResult.version})`));
    } else {
        console.log(chalk.red('  ❌ g++ 未找到'));
        console.log(chalk.gray('     请安装 MinGW 或手动指定 g++ 路径'));
        console.log(chalk.gray('     配置方法: ojtool config --edit'));
    }
    console.log('');

    // 2. 检测 Python
    console.log(chalk.cyan('📌 [2/8] 检测 Python 环境'));
    const pythonAdapter = new PythonAdapter();
    const pythonResult = await pythonAdapter.detect();
    if (pythonResult.available) {
        console.log(chalk.green(`  ✅ Python 已安装 (版本: ${pythonResult.version}, 路径: ${pythonResult.path})`));
    } else {
        console.log(chalk.red('  ❌ Python 未找到'));
        console.log(chalk.gray('     请安装 Python 3.x 或手动指定 Python 路径'));
        console.log(chalk.gray('     下载地址: https://www.python.org/downloads/'));
    }
    console.log('');

    // 3. 检测 Java
    console.log(chalk.cyan('📌 [3/8] 检测 Java 环境'));
    const javaAdapter = new JavaAdapter();
    const javaResult = await javaAdapter.detect();
    if (javaResult.available) {
        let javaInfo = `Java 已安装 (版本: ${javaResult.version}, 路径: ${javaResult.path})`;
        if (javaResult.javacPath) {
            javaInfo += `, javac: ${javaResult.javacVersion || 'available'}`;
        } else {
            javaInfo += ', javac: 未找到';
        }
        console.log(chalk.green(`  ✅ ${javaInfo}`));
        if (!javaResult.javacPath) {
            console.log(chalk.yellow('  ⚠️  Java 编译器 (javac) 未找到，无法编译 Java 程序'));
        }
    } else {
        console.log(chalk.red('  ❌ Java 未找到'));
        console.log(chalk.gray('     请安装 JDK 或手动指定 Java 路径'));
        console.log(chalk.gray('     下载地址: https://www.oracle.com/java/technologies/downloads/'));
    }
    console.log('');

    // 4. 检测配置文件
    console.log(chalk.cyan('📌 [4/8] 检测配置文件'));
    const globalConfigPath = getGlobalConfigPath();
    const projectConfigPath = getConfigPath();
    const globalConfigExists = fs.existsSync(globalConfigPath);
    const projectConfigExists = fs.existsSync(projectConfigPath);

    console.log(chalk.gray('  全局配置:'));
    if (globalConfigExists) {
        console.log(chalk.green(`    ✅ 全局配置存在: ${globalConfigPath}`));
        const globalConfig = loadGlobalConfig();
        console.log(chalk.gray(`       已配置字段: ${Object.keys(globalConfig).length} 个`));
    } else {
        console.log(chalk.yellow('    ⚠️  全局配置不存在'));
        console.log(chalk.gray('       可使用: ojtool config set <key> <value>'));
    }

    console.log(chalk.gray('  项目配置:'));
    if (projectConfigExists) {
        console.log(chalk.green(`    ✅ 项目配置存在: ${projectConfigPath}`));
        const config = getConfig();
        console.log(chalk.gray(`       编程语言: ${config.language || 'cpp'}`));
        console.log(chalk.gray(`       题目前缀: ${config.problemPrefix}`));
        console.log(chalk.gray(`       测试用例: ${config.testCaseCount}`));
        console.log(chalk.gray(`       超时时间: ${config.timeLimitMs}ms`));
        console.log(chalk.gray(`       Checker: ${config.checkerType || 'default'}`));
        console.log(chalk.gray(`       NOIP 模式: ${config.noipMode ? '开启' : '关闭'}`));
    } else {
        console.log(chalk.yellow('    ⚠️  项目配置不存在'));
        console.log(chalk.gray('       请运行: ojtool config init'));
    }
    console.log('');

    // 5. 检测目录权限
    console.log(chalk.cyan('📌 [5/8] 检测目录权限'));
    try {
        const testFile = './.ojtool_test.tmp';
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(chalk.green('  ✅ 当前目录可读写'));
    } catch (error) {
        console.log(chalk.red('  ❌ 当前目录不可读写'));
    }
    console.log('');

    // 6. 检测评测机
    console.log(chalk.cyan('📌 [6/8] 检测评测机'));
    const judgerPath = getJudgerPath();
    if (fs.existsSync(judgerPath)) {
        const stats = fs.statSync(judgerPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(chalk.green(`  ✅ 评测机已编译 (大小: ${sizeMB}MB)`));
        console.log(chalk.gray(`     路径: ${judgerPath}`));
        console.log(chalk.gray('     注意: 评测机仅用于 C++ 语言评测'));
    } else {
        console.log(chalk.yellow('  ⚠️  评测机未编译 (C++ 评测需要)'));
        console.log(chalk.gray('     请运行以下命令编译评测机：'));
        console.log(chalk.gray('     g++ -o bin/judger.exe judger.cpp -std=c++17 -O2 -static'));
    }
    console.log('');

    // 7. 检测 SPJ checkers 与 testlib.h
    console.log(chalk.cyan('📌 [7/8] 检测 SPJ checker 与 testlib.h'));
    const projectRoot = process.cwd();
    const checkersDir = path.join(projectRoot, 'judger', 'checkers');
    const testlibPath = path.join(projectRoot, 'judger', 'testlib.h');

    if (fs.existsSync(checkersDir)) {
        console.log(chalk.green(`  ✅ checkers 目录存在: ${checkersDir}`));
        const builtCheckers = [];
        const sourceCheckers = [];
        const expectedCheckers = ['default', 'ncmp', 'fcmp', 'rcmp4'];
        for (const name of expectedCheckers) {
            const exe = path.join(checkersDir, `${name}.exe`);
            const cpp = path.join(checkersDir, `${name}.cpp`);
            if (fs.existsSync(exe)) {
                builtCheckers.push(name);
            }
            if (fs.existsSync(cpp)) {
                sourceCheckers.push(name);
            }
        }
        if (builtCheckers.length > 0) {
            console.log(chalk.green(`    ✅ 已编译 checker: ${builtCheckers.join(', ')}`));
        } else {
            console.log(chalk.yellow('    ⚠️  未发现已编译的 checker'));
        }
        if (sourceCheckers.length > 0) {
            console.log(chalk.gray(`    源码 checker: ${sourceCheckers.join(', ')}`));
        }
        const missing = expectedCheckers.filter(n => !builtCheckers.includes(n));
        if (missing.length > 0) {
            console.log(chalk.yellow(`    ⚠️  缺少已编译的 checker: ${missing.join(', ')}`));
            console.log(chalk.gray('       可在 judger/checkers/ 目录下编译：'));
            console.log(chalk.gray(`       g++ -o ${missing[0]}.exe ${missing[0]}.cpp -O2 -static`));
        }
    } else {
        console.log(chalk.yellow(`  ⚠️  checkers 目录不存在: ${checkersDir}`));
    }

    if (fs.existsSync(testlibPath)) {
        const stats = fs.statSync(testlibPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(chalk.green(`  ✅ testlib.h 存在 (大小: ${sizeKB}KB)`));
        console.log(chalk.gray(`     路径: ${testlibPath}`));
    } else {
        console.log(chalk.red('  ❌ testlib.h 不存在 (SPJ checker 编译需要)'));
        console.log(chalk.gray('     请从 https://github.com/MikeMirzayanov/testlib 获取'));
    }
    console.log('');

    // 8. 检测 NOIP 模式状态
    console.log(chalk.cyan('📌 [8/8] 检测 NOIP 模式状态'));
    if (projectConfigExists) {
        const config = getConfig();
        if (config.noipMode) {
            console.log(chalk.green('  ✅ NOIP 模式: 开启'));
            console.log(chalk.gray('     - 使用 NOIP 标准编译选项'));
            console.log(chalk.gray('     - 源码包含 #pragma 或 Windows 头文件会触发 UKE'));
        } else {
            console.log(chalk.gray('  ◻️  NOIP 模式: 关闭'));
            console.log(chalk.gray('     - 不检查源码合规性'));
        }
    } else {
        console.log(chalk.gray('  ◻️  项目配置不存在，使用默认值（NOIP 模式开启）'));
    }
    console.log('');

    console.log(chalk.green.bold('✅ 环境检测完成'));
};