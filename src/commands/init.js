const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const { getConfigPath, DEFAULT_CONFIG, writeConfig } = require('../core/configmanager');
const { detectGpp } = require('../utils/gppdetect');
const PythonAdapter = require('../languages/python');

module.exports = async function init() {
    console.log(chalk.blue.bold('📝 初始化配置文件'));

    // 检查是否已存在配置文件
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: '配置文件已存在，是否覆盖？',
                default: false
            }
        ]);
        if (!overwrite) {
            console.log(chalk.yellow('⚠️  已取消'));
            return;
        }
    }

    // 选择编程语言
    const { language } = await inquirer.prompt([
        {
            type: 'list',
            name: 'language',
            message: '选择编程语言:',
            choices: [
                { name: 'C++', value: 'cpp' },
                { name: 'Python', value: 'python' }
            ],
            default: DEFAULT_CONFIG.language
        }
    ]);

    let gppPath = 'g++';
    let pythonPath = 'python';

    if (language === 'cpp') {
        // 检测 g++
        console.log(chalk.blue('🔍 检测 g++...'));
        const gppResult = await detectGpp();
        if (gppResult.found) {
            console.log(chalk.green(`✅ 检测到 g++ (版本: ${gppResult.version})`));
            gppPath = 'g++';
        } else {
            console.log(chalk.yellow('⚠️  未检测到 g++，将使用默认值，你可稍后手动修改配置文件'));
        }
    } else if (language === 'python') {
        // 检测 Python
        console.log(chalk.blue('🔍 检测 Python...'));
        const pythonAdapter = new PythonAdapter();
        const pythonResult = await pythonAdapter.detect();
        if (pythonResult.available) {
            console.log(chalk.green(`✅ 检测到 Python (版本: ${pythonResult.version})`));
            pythonPath = pythonResult.path;
        } else {
            console.log(chalk.yellow('⚠️  未检测到 Python，将使用默认值，你可稍后手动修改配置文件'));
        }
    }

    // 基础问题
    const baseAnswers = await inquirer.prompt([
        {
            type: 'input',
            name: 'problemPrefix',
            message: '题目前缀:',
            default: DEFAULT_CONFIG.problemPrefix
        },
        {
            type: 'number',
            name: 'testCaseCount',
            message: '测试用例数量:',
            default: DEFAULT_CONFIG.testCaseCount
        },
        {
            type: 'number',
            name: 'timeLimitMs',
            message: '超时时间 (毫秒):',
            default: DEFAULT_CONFIG.timeLimitMs
        },
        {
            type: 'number',
            name: 'scorePerCase',
            message: '单测试点分值:',
            default: DEFAULT_CONFIG.scorePerCase
        },
        {
            type: 'input',
            name: 'basePath',
            message: '基础路径:',
            default: DEFAULT_CONFIG.basePath
        }
    ]);

    let languageAnswers = {};

    if (language === 'cpp') {
        languageAnswers = await inquirer.prompt([
            {
                type: 'number',
                name: 'cppVersion',
                message: 'C++ 版本:',
                default: DEFAULT_CONFIG.cppVersion
            }
        ]);
    }

    // 生成配置
    const config = {
        version: '1.0.0',
        language: language,
        gppPath: gppPath,
        pythonPath: pythonPath,
        ...baseAnswers,
        ...languageAnswers,
        compileFlags: DEFAULT_CONFIG.compileFlags,
        outputLimitKb: DEFAULT_CONFIG.outputLimitKb,
        directories: DEFAULT_CONFIG.directories,
        playerCount: DEFAULT_CONFIG.playerCount
    };

    writeConfig(config);
    console.log(chalk.green(`✅ 配置文件已生成: ${configPath}`));
    console.log(chalk.gray(`💡 使用 ojtool config --edit 手动修改配置`));
};