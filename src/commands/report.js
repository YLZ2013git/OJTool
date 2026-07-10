const chalk = require('chalk');
const configManager = require('../core/configmanager');
const judgeEngine = require('../core/judgeengine');
const contestEngine = require('../core/contestengine');
const logger = require('../utils/logger');
const ProgressBar = require('../utils/progress');
const reporters = require('../reporters');

async function report(options) {
    console.log(chalk.blue.bold('📊 生成评测报告...'));
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

    const reportOptions = {
        playerCount: options.players ? parseInt(options.players) : config.playerCount,
        basePath: options.path || config.basePath,
        verbose: options.verbose || false,
        format: options.format || 'html',
        output: options.output
    };

    if (!reportOptions.playerCount || reportOptions.playerCount < 1) {
        console.log(chalk.red('❌ 选手数量必须大于 0'));
        console.log(chalk.yellow('提示: 使用 --players 参数或在配置文件中设置 playerCount'));
        return;
    }

    if (!reportOptions.basePath) {
        console.log(chalk.red('❌ 缺少基础路径配置'));
        console.log(chalk.yellow('提示: 使用 --path 参数或在配置文件中设置 basePath'));
        return;
    }

    const isContest = configManager.isContestMode(config);
    const language = config.language || 'cpp';

    console.log(chalk.cyan('📋 评测配置:'));
    console.log(`   模式: ${isContest ? '竞赛模式' : '单题模式'}`);
    console.log(`   编程语言: ${language}`);
    console.log(`   选手数量: ${reportOptions.playerCount}`);
    console.log(`   基础路径: ${reportOptions.basePath}`);
    console.log(`   报告格式: ${reportOptions.format}`);
    if (reportOptions.output) {
        console.log(`   输出路径: ${reportOptions.output}`);
    }
    console.log();

    let judgeResult;

    try {
        if (isContest) {
            judgeResult = await runContestWithProgress(config, reportOptions);
        } else {
            judgeResult = await runJudgeWithProgress(config, reportOptions);
        }

        console.log();
        console.log(chalk.cyan('📝 生成报告中...'));

        const reporterOptions = {
            ...reportOptions,
            mode: isContest ? 'contest' : 'single'
        };

        let resultsForReport;
        if (isContest) {
            resultsForReport = judgeResult;
        } else {
            resultsForReport = judgeResult.results;
        }

        const outputFiles = reporters.generateAndSaveReport(resultsForReport, config, reporterOptions);

        console.log();
        console.log(chalk.green.bold('✅ 报告生成成功!'));
        console.log();

        for (const [fmt, filePath] of Object.entries(outputFiles)) {
            console.log(`  ${chalk.cyan(fmt.toUpperCase())}: ${filePath}`);
        }

    } catch (error) {
        console.log();
        console.log(chalk.red(`❌ 生成报告失败: ${error.message}`));
        if (options.verbose && error.stack) {
            console.log(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

async function runJudgeWithProgress(config, options) {
    const language = config.language || 'cpp';
    const testCaseCount = config.testCaseCount || 1;
    const totalSteps = options.playerCount * testCaseCount;

    const progressBar = new ProgressBar(totalSteps, '评测进度');
    progressBar.setVerbose(options.verbose || false);

    const judgeOptions = {
        playerCount: options.playerCount,
        basePath: options.basePath,
        verbose: options.verbose,
        onProgress: (progress) => {
            const currentStep = progress.currentStep || 0;
            const statusText = `选手 ${progress.player}/${progress.totalPlayers}, ` +
                              `测试点 ${progress.case}/${progress.totalCases}`;
            progressBar.update(currentStep, statusText);
        }
    };

    let result;
    if (language === 'cpp' && !options.useAdapter) {
        result = await judgeEngine.runJudge(config, judgeOptions);
    } else {
        result = await judgeEngine.runJudgeWithAdapter(config, judgeOptions);
    }

    progressBar.finish();

    console.log();
    judgeEngine.printResultSummary(result.results);

    return result;
}

async function runContestWithProgress(config, options) {
    const problemConfigs = config.problems.map(p => configManager.getProblemConfig(p, config));

    let totalSteps = 0;
    for (const problem of problemConfigs) {
        totalSteps += problem.testCaseCount;
    }
    totalSteps *= options.playerCount;

    const progressBar = new ProgressBar(totalSteps, '竞赛进度');
    progressBar.setVerbose(options.verbose || false);

    const contestOptions = {
        playerCount: options.playerCount,
        basePath: options.basePath,
        verbose: options.verbose,
        onProgress: (progress) => {
            const currentStep = progress.currentStep || 0;
            const statusText = `选手 ${progress.player}/${progress.totalPlayers}, ` +
                              `题目 ${progress.problemIndex}/${progress.totalProblems} (${progress.problem}), ` +
                              `测试点 ${progress.case}/${progress.totalCases}`;
            progressBar.update(currentStep, statusText);
        }
    };

    const result = await contestEngine.runContest(config, contestOptions);

    progressBar.finish();

    console.log();
    contestEngine.printRanking(result.ranking, result.problems);

    return result;
}

module.exports = report;
