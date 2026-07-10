const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');
const configManager = require('../core/configmanager');

const SOURCE_LABELS = {
    default: chalk.gray('默认'),
    global: chalk.blue('全局'),
    project: chalk.green('项目'),
    cli: chalk.yellow('命令行')
};

function formatValue(value) {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}

function showConfig() {
    const result = configManager.getConfigWithSources();
    const { config, sources } = result;

    console.log(chalk.blue.bold('📄 当前生效配置:'));
    console.log();

    const schema = configManager.getConfigSchema();
    const keys = Object.keys(config);

    const maxKeyLen = Math.max(...keys.map(k => k.length), 15);

    for (const key of keys) {
        if (key === 'version' || key === 'directories') continue;
        const value = config[key];
        const source = sources[key] || 'default';
        const sourceLabel = SOURCE_LABELS[source] || chalk.gray(source);
        const desc = schema[key]?.description || '';

        const valueStr = formatValue(value);
        if (valueStr.includes('\n')) {
            console.log(`  ${chalk.cyan(key.padEnd(maxKeyLen))}  ${sourceLabel}`);
            console.log(`    ${chalk.gray(desc)}`);
            console.log(`    ${valueStr.split('\n').join('\n    ')}`);
        } else {
            console.log(`  ${chalk.cyan(key.padEnd(maxKeyLen))}  ${sourceLabel}  ${valueStr}`);
            console.log(`    ${chalk.gray(desc)}`);
        }
        console.log();
    }

    console.log(chalk.cyan('📁 配置文件位置:'));
    console.log(`  全局配置: ${configManager.getGlobalConfigPath()}`);
    console.log(`  项目配置: ${configManager.getProjectConfigPath()}`);
    console.log();

    const globalExists = fs.existsSync(configManager.getGlobalConfigPath());
    const projectExists = fs.existsSync(configManager.getProjectConfigPath());

    console.log(chalk.cyan('📊 配置状态:'));
    console.log(`  全局配置: ${globalExists ? chalk.green('已存在') : chalk.yellow('不存在')}`);
    console.log(`  项目配置: ${projectExists ? chalk.green('已存在') : chalk.yellow('不存在')}`);
    console.log();
}

function getConfig(key) {
    const result = configManager.getConfigWithSources();
    const { config, sources } = result;

    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
        if (value === undefined || value === null) {
            console.log(chalk.red(`❌ 配置项 '${key}' 不存在`));
            process.exit(1);
        }
        value = value[k];
    }

    const source = sources[key] || 'default';
    const sourceLabel = SOURCE_LABELS[source] || chalk.gray(source);

    console.log(`${chalk.cyan(key)} = ${formatValue(value)}`);
    console.log(chalk.gray(`来源: ${sourceLabel}`));
}

function setConfig(key, value) {
    const schema = configManager.getConfigSchema();
    const keySchema = schema[key];

    let typedValue = value;
    if (keySchema && keySchema.type === 'number') {
        typedValue = parseFloat(value);
        if (isNaN(typedValue)) {
            console.log(chalk.red(`❌ 值 '${value}' 不是有效的数字`));
            process.exit(1);
        }
    } else if (keySchema && keySchema.type === 'boolean') {
        const v = String(value).toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes' || v === 'on') {
            typedValue = true;
        } else if (v === 'false' || v === '0' || v === 'no' || v === 'off') {
            typedValue = false;
        } else {
            console.log(chalk.red(`❌ 值 '${value}' 不是有效的布尔值 (true/false)`));
            process.exit(1);
        }
    }

    if (keySchema && keySchema.enum && !keySchema.enum.includes(typedValue)) {
        console.log(chalk.red(`❌ 值 '${typedValue}' 无效，可选值: ${keySchema.enum.join(', ')}`));
        process.exit(1);
    }

    configManager.setGlobalConfigValue(key, typedValue);
    console.log(chalk.green(`✅ 已设置全局配置: ${key} = ${formatValue(typedValue)}`));
    console.log(chalk.gray(`配置文件: ${configManager.getGlobalConfigPath()}`));
}

function initConfig(cmd) {
    const configPath = configManager.getProjectConfigPath();

    if (fs.existsSync(configPath) && !cmd.force) {
        console.log(chalk.yellow(`⚠️  项目配置文件已存在: ${configPath}`));
        console.log(chalk.gray('使用 --force 强制覆盖'));
        return;
    }

    const defaultConfig = {
        _comment: 'OJTool 项目配置文件 - 参考 https://github.com/YLZ15920813102/ojtool',
        language: 'cpp',
        problemPrefix: 'problem',
        testCaseCount: 10,
        timeLimitMs: 1000,
        memoryLimitKb: 262144,
        scorePerCase: 10,
        basePath: './',
        playerCount: 1,
        checkerType: 'default',
        customCheckerPath: '',
        noipMode: true
    };

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));

    console.log(chalk.green(`✅ 项目配置文件已创建: ${configPath}`));
    console.log();
    console.log(chalk.cyan('💡 提示:'));
    console.log('  - 修改配置: ojtool config set <key> <value>');
    console.log('  - 查看配置: ojtool config show');
    console.log('  - 编辑配置: ojtool config edit');
}

function editConfig(cmd) {
    const target = cmd.global ? 'global' : 'project';
    let configPath;

    if (target === 'global') {
        configPath = configManager.getGlobalConfigPath();
        configManager.ensureGlobalConfigDir();
        if (!fs.existsSync(configPath)) {
            configManager.saveGlobalConfig({});
        }
    } else {
        configPath = configManager.getProjectConfigPath();
        if (!fs.existsSync(configPath)) {
            console.log(chalk.red('❌ 项目配置文件不存在，请先运行 ojtool config init'));
            process.exit(1);
        }
    }

    console.log(chalk.blue(`📝 正在打开配置文件: ${configPath}`));

    const platform = os.platform();
    let editorCmd;

    if (platform === 'win32') {
        editorCmd = `notepad "${configPath}"`;
    } else if (platform === 'darwin') {
        editorCmd = `open -e "${configPath}"`;
    } else {
        editorCmd = process.env.EDITOR
            ? `${process.env.EDITOR} "${configPath}"`
            : `nano "${configPath}"`;
    }

    exec(editorCmd, (err) => {
        if (err) {
            console.log(chalk.yellow('⚠️  无法打开编辑器，请手动编辑文件'));
            console.log(chalk.gray(`配置文件路径: ${configPath}`));
        }
    });
}

const program = new Command();

program
    .name('config')
    .description('配置管理');

program
    .command('show')
    .description('显示当前生效的配置')
    .action(showConfig);

program
    .command('get <key>')
    .description('获取配置项的值')
    .action(getConfig);

program
    .command('set <key> <value>')
    .description('设置全局配置项')
    .action(setConfig);

program
    .command('init')
    .description('在当前目录初始化项目配置')
    .option('-f, --force', '强制覆盖已有配置')
    .action(initConfig);

program
    .command('edit')
    .description('打开配置文件编辑器')
    .option('-g, --global', '编辑全局配置')
    .action(editConfig);

module.exports = program;
