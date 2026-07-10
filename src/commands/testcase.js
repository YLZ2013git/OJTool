const { Command } = require('commander');
const chalk = require('chalk');
const configManager = require('../core/configmanager');
const testCaseManager = require('../core/testcasemanager');

function formatSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}

function validate(options) {
    console.log(chalk.blue.bold('🔍 校验测试用例...'));
    console.log();

    const config = configManager.getConfig(options);

    const basePath = options.path || config.basePath || process.cwd();
    const prefix = options.prefix || config.problemPrefix;
    const count = options.count ? parseInt(options.count) : config.testCaseCount;

    if (!prefix) {
        console.log(chalk.red('❌ 缺少题目前缀'));
        console.log(chalk.yellow('提示: 使用 --prefix 参数或在配置文件中设置 problemPrefix'));
        process.exit(1);
    }

    if (!count || count < 1) {
        console.log(chalk.red('❌ 测试用例数量必须大于 0'));
        console.log(chalk.yellow('提示: 使用 --count 参数或在配置文件中设置 testCaseCount'));
        process.exit(1);
    }

    if (configManager.isContestMode(config) && !options.prefix && !options.count) {
        console.log(chalk.cyan('📋 竞赛模式 - 校验所有题目测试用例'));
        console.log(`   基础路径: ${basePath}`);
        console.log(`   题目数量: ${config.problems.length}`);
        console.log();

        const result = testCaseManager.validateContestTestCases(basePath, config.problems);

        console.log(chalk.cyan.bold('📊 校验结果:'));
        console.log();

        for (const problemResult of result.results) {
            const status = problemResult.valid ? chalk.green('✅ 通过') : chalk.red('❌ 失败');
            console.log(`  ${chalk.bold(problemResult.name)} (${problemResult.prefix}): ${status}`);
            console.log(`    有效: ${problemResult.stats.valid}/${problemResult.stats.total} 个用例`);
            
            if (!problemResult.valid) {
                for (const error of problemResult.errors) {
                    console.log(`    ${chalk.red('•')} ${error}`);
                }
            }
            console.log();
        }

        if (result.valid) {
            console.log(chalk.green.bold('✅ 所有测试用例校验通过!'));
        } else {
            console.log(chalk.red.bold(`❌ 校验失败，共 ${result.errors.length} 个错误`));
            process.exit(1);
        }
    } else {
        console.log(chalk.cyan('📋 校验配置:'));
        console.log(`   题目前缀: ${prefix}`);
        console.log(`   测试用例数: ${count}`);
        console.log(`   基础路径: ${basePath}`);
        console.log();

        const result = testCaseManager.validateTestCases(basePath, prefix, count);

        console.log(chalk.cyan.bold('📊 校验结果:'));
        console.log();

        if (result.valid) {
            console.log(chalk.green.bold('✅ 测试用例校验通过!'));
        } else {
            console.log(chalk.red.bold(`❌ 校验失败，共 ${result.errors.length} 个错误:`));
            console.log();
            for (const error of result.errors) {
                console.log(`  ${chalk.red('•')} ${error}`);
            }
            process.exit(1);
        }

        console.log();
        console.log(`  有效用例: ${chalk.green(result.stats.valid)}/${result.stats.total}`);
        if (result.stats.missingInput > 0) {
            console.log(`  缺少输入文件: ${chalk.red(result.stats.missingInput)}`);
        }
        if (result.stats.missingOutput > 0) {
            console.log(`  缺少输出文件: ${chalk.red(result.stats.missingOutput)}`);
        }
        if (result.stats.emptyInput > 0) {
            console.log(`  空输入文件: ${chalk.red(result.stats.emptyInput)}`);
        }
        if (result.stats.emptyOutput > 0) {
            console.log(`  空输出文件: ${chalk.red(result.stats.emptyOutput)}`);
        }
    }
}

function stats(options) {
    console.log(chalk.blue.bold('📊 测试用例统计...'));
    console.log();

    const config = configManager.getConfig(options);

    const basePath = options.path || config.basePath || process.cwd();
    const prefix = options.prefix || config.problemPrefix;
    const count = options.count ? parseInt(options.count) : config.testCaseCount;

    if (!prefix) {
        console.log(chalk.red('❌ 缺少题目前缀'));
        console.log(chalk.yellow('提示: 使用 --prefix 参数或在配置文件中设置 problemPrefix'));
        process.exit(1);
    }

    if (!count || count < 1) {
        console.log(chalk.red('❌ 测试用例数量必须大于 0'));
        console.log(chalk.yellow('提示: 使用 --count 参数或在配置文件中设置 testCaseCount'));
        process.exit(1);
    }

    console.log(chalk.cyan('📋 统计配置:'));
    console.log(`   题目前缀: ${prefix}`);
    console.log(`   测试用例数: ${count}`);
    console.log(`   基础路径: ${basePath}`);
    console.log();

    const result = testCaseManager.getTestCaseStats(basePath, prefix, count);

    console.log(chalk.cyan.bold('📈 统计信息:'));
    console.log();
    console.log(`  总用例数: ${result.total}`);
    console.log(`  有效用例: ${chalk.green(result.valid)}`);
    console.log(`  无效用例: ${chalk.red(result.invalid)}`);
    console.log();
    console.log(`  总输入大小: ${formatSize(result.totalInputSize)}`);
    console.log(`  总输出大小: ${formatSize(result.totalOutputSize)}`);
    console.log(`  平均输入大小: ${formatSize(result.avgInputSize)}`);
    console.log(`  平均输出大小: ${formatSize(result.avgOutputSize)}`);
    console.log();

    console.log(chalk.cyan.bold('📝 详细列表:'));
    console.log();
    console.log(chalk.bold('  用例  输入文件        输入大小    输出文件        输出大小    状态'));
    console.log(chalk.gray('  ' + '-'.repeat(75)));

    for (const caseInfo of result.cases) {
        const status = caseInfo.valid ? chalk.green('有效') : chalk.red('无效');
        const inputSizeStr = formatSize(caseInfo.inputSize).padEnd(10);
        const outputSizeStr = formatSize(caseInfo.outputSize).padEnd(10);
        const caseNum = String(caseInfo.index).padEnd(4);
        const inputFile = caseInfo.inputFile.padEnd(16);
        const outputFile = caseInfo.outputFile.padEnd(16);
        
        console.log(`  ${caseNum} ${inputFile} ${inputSizeStr} ${outputFile} ${outputSizeStr} ${status}`);
    }
}

const program = new Command();

program
    .name('testcase')
    .description('测试用例管理工具');

program
    .command('validate')
    .description('校验测试用例完整性')
    .option('--path <basePath>', '基础路径')
    .option('--prefix <prefix>', '题目前缀')
    .option('--count <count>', '测试用例数量')
    .action(validate);

program
    .command('stats')
    .description('统计测试用例信息')
    .option('--path <basePath>', '基础路径')
    .option('--prefix <prefix>', '题目前缀')
    .option('--count <count>', '测试用例数量')
    .action(stats);

module.exports = program;
