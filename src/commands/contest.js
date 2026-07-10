const chalk = require('chalk');
const configManager = require('../core/configmanager');
const contestEngine = require('../core/contestengine');
const logger = require('../utils/logger');
const ProgressBar = require('../utils/progress');
const reporters = require('../reporters');

/**
 * 格式化题目级 checker 显示
 * @param {Object} problem - 题目配置
 * @returns {string} - 格式化后的 checker 描述
 */
function formatProblemChecker(problem) {
    const type = problem.checkerType || 'default';
    if (type === 'custom') {
        const path = problem.customCheckerPath || '(未配置)';
        return `custom (${path})`;
    }
    return type;
}

async function contest(options) {
    console.log(chalk.blue.bold('🏆 开始竞赛评测...'));
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

    if (!configManager.isContestMode(config)) {
        console.log(chalk.red('❌ 当前配置不是竞赛模式'));
        console.log(chalk.yellow('提示: 请在 ojtool.json 中配置 problems 数组以启用竞赛模式'));
        return;
    }

    if (options.verbose) {
        logger.setVerbose(true);
    }

    const contestOptions = {
        playerCount: options.players ? parseInt(options.players) : config.playerCount,
        basePath: options.path || config.basePath,
        verbose: options.verbose || false
    };

    if (!contestOptions.playerCount || contestOptions.playerCount < 1) {
        console.log(chalk.red('❌ 选手数量必须大于 0'));
        console.log(chalk.yellow('提示: 使用 --players 参数或在配置文件中设置 playerCount'));
        return;
    }

    if (!contestOptions.basePath) {
        console.log(chalk.red('❌ 缺少基础路径配置'));
        console.log(chalk.yellow('提示: 使用 --path 参数或在配置文件中设置 basePath'));
        return;
    }

    const language = config.language || 'cpp';
    const problemConfigs = config.problems.map(p => configManager.getProblemConfig(p, config));

    let totalSteps = 0;
    for (const problem of problemConfigs) {
        totalSteps += problem.testCaseCount;
    }
    totalSteps *= contestOptions.playerCount;

    console.log(chalk.cyan('📋 竞赛配置:'));
    console.log(`   编程语言: ${language}`);
    console.log(`   题目数量: ${config.problems.length}`);
    console.log(`   选手数量: ${contestOptions.playerCount}`);
    console.log(`   基础路径: ${contestOptions.basePath}`);
    console.log(`   NOIP 模式: ${config.noipMode ? chalk.green('开启') : chalk.gray('关闭')}`);
    console.log();

    console.log(chalk.cyan('📝 题目列表:'));
    for (const problem of problemConfigs) {
        console.log(`   ${problem.name}: ${problem.testCaseCount} 个测试点, ` +
                   `每题 ${problem.scorePerCase * problem.testCaseCount} 分, ` +
                   `时限 ${problem.timeLimitMs}ms, ` +
                   `checker: ${formatProblemChecker(problem)}`);
    }
    console.log();

    const progressBar = new ProgressBar(totalSteps, '竞赛进度');
    progressBar.setVerbose(options.verbose || false);

    contestOptions.onProgress = (progress) => {
        const currentStep = progress.currentStep || 0;
        const statusText = `选手 ${progress.player}/${progress.totalPlayers}, ` +
                          `题目 ${progress.problemIndex}/${progress.totalProblems} (${progress.problem}), ` +
                          `测试点 ${progress.case}/${progress.totalCases}`;
        progressBar.update(currentStep, statusText);
    };

    try {
        const result = await contestEngine.runContest(config, contestOptions);

        progressBar.finish();

        console.log();
        contestEngine.printRanking(result.ranking, result.problems);

        if (options.detail) {
            console.log();
            contestEngine.printDetailedResults(result.players, result.problems);
        }

        if (options.report) {
            console.log();
            console.log(chalk.cyan('📝 生成报告中...'));

            const outputFiles = reporters.generateAndSaveReport(result, config, {
                format: options.report,
                output: options.output,
                mode: 'contest'
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
        console.log(chalk.red(`❌ 竞赛评测失败: ${error.message}`));
        if (options.verbose && error.stack) {
            console.log(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

module.exports = contest;
