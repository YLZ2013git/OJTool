#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

// 命令模块
const doctor = require('../src/commands/doctor');
const config = require('../src/commands/config');
const judge = require('../src/commands/judge');
const init = require('../src/commands/init');
const contest = require('../src/commands/contest');
const report = require('../src/commands/report');
const testcase = require('../src/commands/testcase');

// 版本信息
program
    .version(pkg.version)
    .description('🧪 OJTool - 命令行代码评测工具');

// doctor 命令
program
    .command('doctor')
    .description('检测环境（g++、评测机、配置）')
    .action(doctor);

// init 命令
program
    .command('init')
    .description('初始化配置文件')
    .action(init);

// config 命令
program.addCommand(config);

// judge 命令
program
    .command('judge')
    .description('执行评测' +
        '\n  checker 类型说明:' +
        '\n    default: 普通文本比对（逐行精确匹配）' +
        '\n    ncmp:    无序整数比对（忽略顺序，适合集合输出）' +
        '\n    fcmp:    忽略空白比对（忽略空格、换行、制表符）' +
        '\n    rcmp4:   浮点数比对（允许 1e-4 误差）' +
        '\n    custom:  自定义 checker 程序（需配合 customCheckerPath）')
    .option('-n, --players <count>', '选手数量')
    .option('--path <basePath>', '基础路径（选手目录所在路径）')
    .option('--checker <type>', 'SPJ checker 类型 (default|ncmp|fcmp|rcmp4|custom)')
    .option('--noip <bool>', '启用 NOIP 模式 (true/false，开启时使用 NOIP 编译选项 + 源码检查)')
    .option('-v, --verbose', '详细输出模式')
    .option('-d, --detail', '显示详细评测结果')
    .option('--report <format>', '评测完成后生成报告 (json|html|md|all)')
    .option('--output <path>', '报告输出路径')
    .action(judge);

// contest 命令
program
    .command('contest')
    .description('竞赛模式 - 多题目评测排行榜' +
        '\n  每道题可在 problems 数组中单独配置 checkerType')
    .option('-n, --players <count>', '选手数量')
    .option('--path <basePath>', '基础路径（选手目录所在路径）')
    .option('--checker <type>', 'SPJ checker 类型 (default|ncmp|fcmp|rcmp4|custom)，覆盖全局配置')
    .option('--noip <bool>', '启用 NOIP 模式 (true/false)')
    .option('-v, --verbose', '详细输出模式')
    .option('-d, --detail', '显示详细评测结果')
    .option('--report <format>', '评测完成后生成报告 (json|html|md|all)')
    .option('--output <path>', '报告输出路径')
    .action(contest);

// report 命令
program
    .command('report')
    .description('执行评测并生成报告')
    .option('-n, --players <count>', '选手数量')
    .option('--path <basePath>', '基础路径（选手目录所在路径）')
    .option('-v, --verbose', '详细输出模式')
    .option('--format <format>', '报告格式: json|html|md|all (默认: html)')
    .option('--output <path>', '输出文件路径 (默认: report.html)')
    .action(report);

// testcase 命令
program.addCommand(testcase);

// 未知命令提示
program.on('command:*', () => {
    console.error(chalk.red('❌ 未知命令，请使用 ojtool --help 查看可用命令'));
    process.exit(1);
});

// 解析参数
program.parse(process.argv);

// 如果没有输入任何命令，显示帮助
if (!process.argv.slice(2).length) {
    program.outputHelp();
}