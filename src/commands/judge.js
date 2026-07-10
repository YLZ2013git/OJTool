const chalk = require('chalk');
const configManager = require('../core/configmanager');
const judgeEngine = require('../core/judgeengine');
const logger = require('../utils/logger');
const ProgressBar = require('../utils/progress');
const reporters = require('../reporters');

/**
 * 格式化 checker 类型显示
 * @param {Object} config - 配置对象
 * @returns {string} - 格式化后的 checker 描述
 */
function formatCheckerInfo(config) {
    const type = config.checkerType || 'default';
    if (type === 'custom') {
        const path = config.customCheckerPath || '(未配置)';
        return `custom (${path})`;
    }
    return type;
}

/**
 * 执行评测命令
 * @param {Object} options - 命令行选项
 */
async function judge(options) {
    console.log(chalk.blue.bold('🧪 开始评测...'));
    console.log();

    const config = configManager.getConfig(options);
    if (!config) {
        console.log(chalk.red('❌ 配置加载失败'));
        return;
    }

    const validation = configManager.validateConfig(config);
    if (!validation.valid) {
        console.log(chalk.yellow(`⚠️  配置验证警告: ${validation.message}`));
    }

    if (options.verbose) {
        logger.setVerbose(true);
    }

    const judgeOptions = {
        playerCount: options.players ? parseInt(options.players) : config.playerCount,
        basePath: options.path || config.basePath,
        verbose: options.verbose || false
    };

    if (!judgeOptions.playerCount || judgeOptions.playerCount < 1) {
        console.log(chalk.red('❌ 选手数量必须大于 0'));
        console.log(chalk.yellow('提示: 使用 --players 参数或在配置文件中设置 playerCount'));
        return;
    }

    if (!judgeOptions.basePath) {
        console.log(chalk.red('❌ 缺少基础路径配置'));
        console.log(chalk.yellow('提示: 使用 --path 参数或在配置文件中设置 basePath'));
        return;
    }

    const language = config.language || 'cpp';
    const testCaseCount = config.testCaseCount || 1;
    const totalSteps = judgeOptions.playerCount * testCaseCount;

    console.log(chalk.cyan('📋 评测配置:'));
    console.log(`   编程语言: ${language}`);
    console.log(`   题目前缀: ${config.problemPrefix}`);
    console.log(`   测试用例数: ${testCaseCount}`);
    console.log(`   选手数量: ${judgeOptions.playerCount}`);
    console.log(`   基础路径: ${judgeOptions.basePath}`);
    console.log(`   时间限制: ${config.timeLimitMs}ms`);
    console.log(`   每用例分值: ${config.scorePerCase}分`);
    console.log(`   Checker: ${formatCheckerInfo(config)}`);
    console.log(`   NOIP 模式: ${config.noipMode ? chalk.green('开启') : chalk.gray('关闭')}`);
    console.log();

    const progressBar = new ProgressBar(totalSteps, '评测进度');
    progressBar.setVerbose(options.verbose || false);

    judgeOptions.onProgress = (progress) => {
        const currentStep = progress.currentStep || 0;
        const statusText = `选手 ${progress.player}/${progress.totalPlayers}, ` +
                          `测试点 ${progress.case}/${progress.totalCases}`;
        progressBar.update(currentStep, statusText);
    };

    try {
        let result;

        if (language === 'cpp' && !options.useAdapter) {
            result = await judgeEngine.runJudge(config, judgeOptions);
        } else {
            result = await judgeEngine.runJudgeWithAdapter(config, judgeOptions);
        }

        progressBar.finish();

        console.log();
        judgeEngine.printResultSummary(result.results);

        if (options.detail) {
            console.log();
            console.log(chalk.cyan.bold('📊 详细结果:'));
            console.log();

            for (const playerKey of Object.keys(result.results)) {
                const playerResult = result.results[playerKey];
                console.log(judgeEngine.getDetailedResult(playerResult));
                console.log();
            }
        }

        if (options.report) {
            console.log();
            console.log(chalk.cyan('📝 生成报告中...'));

            const outputFiles = reporters.generateAndSaveReport(result.results, config, {
                format: options.report,
                output: options.output,
                mode: 'single'
            });

            console.log();
            console.log(chalk.green.bold('✅ 报告生成成功!'));
            console.log();

            for (const [fmt, filePath] of Object.entries(outputFiles)) {
                console.log(`  ${chalk.cyan(fmt.toUpperCase())}: ${filePath}`);
            }
        }

    } catch (error) {
        progressBar.finish();
        console.log();
        console.log(chalk.red(`❌ 评测失败: ${error.message}`));
        if (options.verbose && error.stack) {
            console.log(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

module.exports = judge;