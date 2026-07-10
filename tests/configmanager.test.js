const fs = require('fs');
const path = require('path');
const os = require('os');

const originalCwd = process.cwd();
let tempDir;
let originalHomedir;

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-test-'));
    process.chdir(tempDir);

    originalHomedir = os.homedir;
    os.homedir = jest.fn(() => tempDir);

    jest.resetModules();
});

afterEach(() => {
    os.homedir = originalHomedir;
    process.chdir(originalCwd);
    if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

console.error = jest.fn();
console.warn = jest.fn();

describe('configmanager', () => {
    describe('DEFAULT_CONFIG', () => {
        it('应该包含所有必要的默认配置字段', () => {
            const { DEFAULT_CONFIG } = require('../src/core/configmanager');
            expect(DEFAULT_CONFIG).toBeDefined();
            expect(DEFAULT_CONFIG.version).toBe('1.0.0');
            expect(DEFAULT_CONFIG.language).toBe('cpp');
            expect(DEFAULT_CONFIG.gppPath).toBe('g++');
            expect(DEFAULT_CONFIG.problemPrefix).toBe('problem');
            expect(DEFAULT_CONFIG.testCaseCount).toBe(10);
            expect(DEFAULT_CONFIG.timeLimitMs).toBe(1000);
            expect(DEFAULT_CONFIG.memoryLimitKb).toBe(262144);
            expect(DEFAULT_CONFIG.scorePerCase).toBe(10);
            expect(DEFAULT_CONFIG.cppVersion).toBe(17);
            expect(DEFAULT_CONFIG.compileFlags).toBe('-O2 -Wall');
            expect(DEFAULT_CONFIG.outputLimitKb).toBe(1024);
            expect(DEFAULT_CONFIG.playerCount).toBe(1);
            expect(DEFAULT_CONFIG.basePath).toBeDefined();
            expect(DEFAULT_CONFIG.scoreMode).toBe('sum');
            expect(DEFAULT_CONFIG.directories).toBeDefined();
            expect(DEFAULT_CONFIG.directories.input).toBe('./data/in');
            expect(DEFAULT_CONFIG.directories.output).toBe('./data/out');
            expect(DEFAULT_CONFIG.directories.answer).toBe('./data/ans');
            expect(DEFAULT_CONFIG.directories.temp).toBe('./temp');
        });

        it('应该包含 SPJ checker 与 NOIP 模式相关字段', () => {
            const { DEFAULT_CONFIG } = require('../src/core/configmanager');
            expect(DEFAULT_CONFIG.checkerType).toBe('default');
            expect(DEFAULT_CONFIG.customCheckerPath).toBe('');
            expect(DEFAULT_CONFIG.noipMode).toBe(true);
        });
    });

    describe('checker / NOIP 配置', () => {
        it('CONFIG_SCHEMA 应该包含 checkerType/customCheckerPath/noipMode 字段说明', () => {
            const { getConfigSchema } = require('../src/core/configmanager');
            const schema = getConfigSchema();
            expect(schema.checkerType).toBeDefined();
            expect(schema.checkerType.enum).toEqual(['default', 'ncmp', 'fcmp', 'rcmp4', 'custom']);
            expect(schema.customCheckerPath).toBeDefined();
            expect(schema.noipMode).toBeDefined();
            expect(schema.noipMode.type).toBe('boolean');
        });

        it('合法的 checkerType 值应该验证通过', () => {
            const { validateConfig } = require('../src/core/configmanager');
            for (const t of ['default', 'ncmp', 'fcmp', 'rcmp4']) {
                const r = validateConfig({ checkerType: t });
                expect(r.valid).toBe(true);
            }
        });

        it('无效的 checkerType 值应该验证失败', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const r = validateConfig({ checkerType: 'invalid' });
            expect(r.valid).toBe(false);
            expect(r.message).toContain('checkerType');
        });

        it('checkerType=custom 时缺少 customCheckerPath 应该验证失败', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const r = validateConfig({ checkerType: 'custom', customCheckerPath: '' });
            expect(r.valid).toBe(false);
            expect(r.message).toContain('customCheckerPath');
        });

        it('checkerType=custom 时提供 customCheckerPath 应该验证通过', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const r = validateConfig({ checkerType: 'custom', customCheckerPath: './mychecker.exe' });
            expect(r.valid).toBe(true);
        });

        it('题目级 checkerType=custom 缺少 customCheckerPath 应该验证失败', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const r = validateConfig({
                problems: [
                    { name: 'A', testCaseCount: 3, checkerType: 'custom', customCheckerPath: '' }
                ]
            });
            expect(r.valid).toBe(false);
            expect(r.message).toContain('customCheckerPath');
        });

        it('resolveConfig 应该支持 --checker CLI 选项', () => {
            const { resolveConfig } = require('../src/core/configmanager');
            const r = resolveConfig({ checkerType: 'default' }, { checker: 'ncmp' });
            expect(r.checkerType).toBe('ncmp');
        });

        it('resolveConfig 应该支持 --noip CLI 选项', () => {
            const { resolveConfig } = require('../src/core/configmanager');
            const r1 = resolveConfig({ noipMode: true }, { noip: false });
            expect(r1.noipMode).toBe(false);
            const r2 = resolveConfig({ noipMode: false }, { noip: true });
            expect(r2.noipMode).toBe(true);
            const r3 = resolveConfig({ noipMode: true }, { noip: 'false' });
            expect(r3.noipMode).toBe(false);
            const r4 = resolveConfig({ noipMode: false }, { noip: 'true' });
            expect(r4.noipMode).toBe(true);
        });

        it('resolveConfig 应该兼容旧版 checker 字段（向后兼容）', () => {
            const { resolveConfig } = require('../src/core/configmanager');
            // 旧配置只有 checker 字段
            const r = resolveConfig({ checker: 'ncmp' });
            expect(r.checkerType).toBe('ncmp');
        });

        it('checkerType 优先级高于旧版 checker 字段', () => {
            const { resolveConfig } = require('../src/core/configmanager');
            const r = resolveConfig({ checker: 'ncmp', checkerType: 'fcmp' });
            expect(r.checkerType).toBe('fcmp');
        });

        it('getProblemConfig 应该支持 per-problem checker 配置', () => {
            const { getProblemConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 5, checkerType: 'rcmp4' };
            const result = getProblemConfig(problem, DEFAULT_CONFIG);
            expect(result.checkerType).toBe('rcmp4');
            // 未指定的字段应该继承全局
            expect(result.customCheckerPath).toBe(DEFAULT_CONFIG.customCheckerPath);
            expect(result.noipMode).toBe(DEFAULT_CONFIG.noipMode);
        });

        it('getProblemConfig 应该支持 per-problem noipMode 配置', () => {
            const { getProblemConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 5, noipMode: false };
            const result = getProblemConfig(problem, DEFAULT_CONFIG);
            expect(result.noipMode).toBe(false);
        });
    });

    describe('getConfigSchema', () => {
        it('应该返回配置字段说明', () => {
            const { getConfigSchema } = require('../src/core/configmanager');
            const schema = getConfigSchema();
            expect(schema).toBeDefined();
            expect(schema.language).toBeDefined();
            expect(schema.language.type).toBe('string');
            expect(schema.language.description).toBeDefined();
            expect(schema.testCaseCount.type).toBe('number');
            expect(schema.testCaseCount.min).toBe(1);
        });

        it('应该返回 schema 的深拷贝', () => {
            const { getConfigSchema, CONFIG_SCHEMA } = require('../src/core/configmanager');
            const schema = getConfigSchema();
            schema.language.type = 'modified';
            expect(CONFIG_SCHEMA.language.type).toBe('string');
        });
    });

    describe('getGlobalConfigPath', () => {
        it('应该返回用户主目录下的 .ojtool/config.json 路径', () => {
            const { getGlobalConfigPath } = require('../src/core/configmanager');
            const configPath = getGlobalConfigPath();
            expect(configPath).toBe(path.join(tempDir, '.ojtool', 'config.json'));
        });
    });

    describe('getProjectConfigPath', () => {
        it('应该返回当前目录下的 ojtool.json 路径', () => {
            const { getProjectConfigPath } = require('../src/core/configmanager');
            const configPath = getProjectConfigPath();
            expect(configPath).toBe(path.join(tempDir, 'ojtool.json'));
        });

        it('应该支持自定义路径', () => {
            const { getProjectConfigPath } = require('../src/core/configmanager');
            const customDir = path.join(tempDir, 'custom');
            fs.mkdirSync(customDir);
            const configPath = getProjectConfigPath(customDir);
            expect(configPath).toBe(path.join(customDir, 'ojtool.json'));
        });
    });

    describe('getConfigPath', () => {
        it('应该返回当前工作目录下的 ojtool.json 路径', () => {
            const { getConfigPath } = require('../src/core/configmanager');
            const configPath = getConfigPath();
            expect(configPath).toBe(path.join(tempDir, 'ojtool.json'));
        });
    });

    describe('loadGlobalConfig', () => {
        it('全局配置文件不存在时返回空对象', () => {
            const { loadGlobalConfig } = require('../src/core/configmanager');
            const result = loadGlobalConfig();
            expect(result).toEqual({});
        });

        it('全局配置文件存在时返回解析后的配置', () => {
            const { loadGlobalConfig, getGlobalConfigPath, ensureGlobalConfigDir } = require('../src/core/configmanager');
            ensureGlobalConfigDir();
            const testConfig = { language: 'python', testCaseCount: 5 };
            fs.writeFileSync(getGlobalConfigPath(), JSON.stringify(testConfig));
            const result = loadGlobalConfig();
            expect(result).toEqual(testConfig);
        });

        it('全局配置文件格式错误时返回空对象并输出错误', () => {
            const { loadGlobalConfig, getGlobalConfigPath, ensureGlobalConfigDir } = require('../src/core/configmanager');
            ensureGlobalConfigDir();
            fs.writeFileSync(getGlobalConfigPath(), 'invalid json {{{');
            const result = loadGlobalConfig();
            expect(result).toEqual({});
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('saveGlobalConfig', () => {
        it('应该成功保存全局配置并自动创建目录', () => {
            const { saveGlobalConfig, getGlobalConfigPath } = require('../src/core/configmanager');
            const testConfig = { language: 'python', testCaseCount: 5 };
            const result = saveGlobalConfig(testConfig);
            expect(result).toBe(true);
            expect(fs.existsSync(getGlobalConfigPath())).toBe(true);
            const savedConfig = JSON.parse(fs.readFileSync(getGlobalConfigPath(), 'utf-8'));
            expect(savedConfig).toEqual(testConfig);
        });
    });

    describe('readConfig', () => {
        it('配置文件不存在时返回 null', () => {
            const { readConfig } = require('../src/core/configmanager');
            const result = readConfig();
            expect(result).toBeNull();
        });

        it('配置文件存在时返回解析后的配置对象', () => {
            const { readConfig, getConfigPath } = require('../src/core/configmanager');
            const testConfig = { gppPath: 'custom-g++', testCaseCount: 5 };
            fs.writeFileSync(getConfigPath(), JSON.stringify(testConfig));
            const result = readConfig();
            expect(result).toEqual(testConfig);
        });

        it('配置文件格式损坏时返回 null 并输出错误', () => {
            const { readConfig, getConfigPath } = require('../src/core/configmanager');
            fs.writeFileSync(getConfigPath(), 'invalid json {{{');
            const result = readConfig();
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('writeConfig', () => {
        it('应该成功写入配置文件', () => {
            const { writeConfig, getConfigPath } = require('../src/core/configmanager');
            const testConfig = { gppPath: 'test-g++', testCaseCount: 3 };
            const result = writeConfig(testConfig);
            expect(result).toBe(true);
            expect(fs.existsSync(getConfigPath())).toBe(true);
            const savedConfig = JSON.parse(fs.readFileSync(getConfigPath(), 'utf-8'));
            expect(savedConfig).toEqual(testConfig);
        });
    });

    describe('deepMerge', () => {
        it('应该正确合并两个对象', () => {
            const { deepMerge } = require('../src/core/configmanager');
            const target = { a: 1, b: { c: 2, d: 3 } };
            const source = { b: { c: 4 }, e: 5 };
            const result = deepMerge(target, source);
            expect(result).toEqual({ a: 1, b: { c: 4, d: 3 }, e: 5 });
        });

        it('source 为 null/undefined 时返回 target 副本', () => {
            const { deepMerge } = require('../src/core/configmanager');
            const target = { a: 1 };
            expect(deepMerge(target, null)).toEqual(target);
            expect(deepMerge(target, undefined)).toEqual(target);
        });

        it('不应该合并数组', () => {
            const { deepMerge } = require('../src/core/configmanager');
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5] };
            const result = deepMerge(target, source);
            expect(result.arr).toEqual([4, 5]);
        });

        it('应该忽略 undefined 和 null 值', () => {
            const { deepMerge } = require('../src/core/configmanager');
            const target = { a: 1, b: 2 };
            const source = { a: undefined, b: null, c: 3 };
            const result = deepMerge(target, source);
            expect(result.a).toBe(1);
            expect(result.b).toBe(2);
            expect(result.c).toBe(3);
        });
    });

    describe('mergeConfig', () => {
        it('应该按照优先级正确合并配置', () => {
            const { mergeConfig } = require('../src/core/configmanager');
            const defaultConfig = { a: 1, b: 2, c: 3, d: 4 };
            const globalConfig = { b: 20, c: 30 };
            const projectConfig = { c: 300 };
            const cliConfig = { d: 4000 };

            const result = mergeConfig(defaultConfig, globalConfig, projectConfig, cliConfig);
            expect(result.a).toBe(1);
            expect(result.b).toBe(20);
            expect(result.c).toBe(300);
            expect(result.d).toBe(4000);
        });

        it('命令行参数优先级最高', () => {
            const { mergeConfig } = require('../src/core/configmanager');
            const defaultConfig = { testCaseCount: 10 };
            const globalConfig = { testCaseCount: 20 };
            const projectConfig = { testCaseCount: 30 };
            const cliConfig = { testCaseCount: 40 };

            const result = mergeConfig(defaultConfig, globalConfig, projectConfig, cliConfig);
            expect(result.testCaseCount).toBe(40);
        });

        it('项目配置优先级高于全局配置', () => {
            const { mergeConfig } = require('../src/core/configmanager');
            const defaultConfig = { language: 'cpp' };
            const globalConfig = { language: 'python' };
            const projectConfig = { language: 'cpp' };

            const result = mergeConfig(defaultConfig, globalConfig, projectConfig, {});
            expect(result.language).toBe('cpp');
        });

        it('全局配置优先级高于默认配置', () => {
            const { mergeConfig } = require('../src/core/configmanager');
            const defaultConfig = { timeLimitMs: 1000 };
            const globalConfig = { timeLimitMs: 2000 };

            const result = mergeConfig(defaultConfig, globalConfig, {}, {});
            expect(result.timeLimitMs).toBe(2000);
        });
    });

    describe('validateConfig', () => {
        it('完整配置应该验证通过', () => {
            const { validateConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const result = validateConfig(DEFAULT_CONFIG);
            expect(result.valid).toBe(true);
        });

        it('字段类型错误应该验证失败并指出字段', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const config = { testCaseCount: 'not-a-number' };
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].field).toBe('testCaseCount');
            expect(result.message).toContain('testCaseCount');
        });

        it('枚举值无效应该验证失败', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const config = { language: 'invalid_lang' };
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('language');
            expect(result.message).toContain('可选值');
        });

        it('数值小于最小值应该验证失败', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const config = { testCaseCount: 0 };
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('testCaseCount');
            expect(result.message).toContain('不能小于');
        });

        it('可以同时检测多个错误', () => {
            const { validateConfig } = require('../src/core/configmanager');
            const config = { testCaseCount: -1, language: 'invalid_lang' };
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('validateProblem', () => {
        it('有效的题目配置应该验证通过', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 10 };
            const result = validateProblem(problem, 0);
            expect(result.valid).toBe(true);
        });

        it('缺少 name 应该验证失败', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const problem = { testCaseCount: 10 };
            const result = validateProblem(problem, 0);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('name');
        });

        it('缺少 testCaseCount 应该验证失败', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const problem = { name: 'A' };
            const result = validateProblem(problem, 0);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('testCaseCount');
        });
    });

    describe('isContestMode', () => {
        it('有 problems 数组时是竞赛模式', () => {
            const { isContestMode } = require('../src/core/configmanager');
            expect(isContestMode({ problems: [{ name: 'A', testCaseCount: 10 }] })).toBe(true);
        });

        it('没有 problems 时不是竞赛模式', () => {
            const { isContestMode } = require('../src/core/configmanager');
            expect(isContestMode({})).toBe(false);
            expect(isContestMode(null)).toBe(false);
            expect(isContestMode(undefined)).toBe(false);
        });

        it('problems 为空数组时不是竞赛模式', () => {
            const { isContestMode } = require('../src/core/configmanager');
            expect(isContestMode({ problems: [] })).toBe(false);
        });
    });

    describe('getProblemConfig', () => {
        it('应该合并题目配置和全局配置', () => {
            const { getProblemConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 5 };
            const result = getProblemConfig(problem, DEFAULT_CONFIG);
            expect(result.name).toBe('A');
            expect(result.testCaseCount).toBe(5);
            expect(result.timeLimitMs).toBe(DEFAULT_CONFIG.timeLimitMs);
            expect(result.memoryLimitKb).toBe(DEFAULT_CONFIG.memoryLimitKb);
            // 默认应继承全局 checker/noipMode
            expect(result.checkerType).toBe(DEFAULT_CONFIG.checkerType);
            expect(result.noipMode).toBe(DEFAULT_CONFIG.noipMode);
        });

        it('题目特定配置应该覆盖全局配置', () => {
            const { getProblemConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 5, timeLimitMs: 500 };
            const result = getProblemConfig(problem, DEFAULT_CONFIG);
            expect(result.timeLimitMs).toBe(500);
        });
    });

    describe('getConfig', () => {
        it('没有任何配置文件时返回默认配置', () => {
            const { getConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const config = getConfig();
            expect(config.language).toBe(DEFAULT_CONFIG.language);
            expect(config.testCaseCount).toBe(DEFAULT_CONFIG.testCaseCount);
        });

        it('应该合并全局和项目配置', () => {
            const { getConfig, writeConfig, saveGlobalConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            saveGlobalConfig({ language: 'python', testCaseCount: 20 });
            writeConfig({ testCaseCount: 30, timeLimitMs: 2000 });
            const config = getConfig();
            expect(config.language).toBe('python');
            expect(config.testCaseCount).toBe(30);
            expect(config.timeLimitMs).toBe(2000);
        });

        it('CLI 选项优先级最高', () => {
            const { getConfig, saveGlobalConfig, writeConfig } = require('../src/core/configmanager');
            saveGlobalConfig({ testCaseCount: 20 });
            writeConfig({ testCaseCount: 30 });
            const config = getConfig({ testCaseCount: 50 });
            expect(config.testCaseCount).toBe(50);
        });

        it('应该解析 players 和 path 选项', () => {
            const { getConfig } = require('../src/core/configmanager');
            const config = getConfig({ players: '5', path: '/custom/path' });
            expect(config.playerCount).toBe(5);
            expect(config.basePath).toBe('/custom/path');
        });
    });

    describe('getConfigWithSources', () => {
        it('应该返回配置及其来源信息', () => {
            const { getConfigWithSources, saveGlobalConfig, writeConfig } = require('../src/core/configmanager');
            saveGlobalConfig({ language: 'python' });
            writeConfig({ testCaseCount: 30 });
            const result = getConfigWithSources({ timeLimitMs: 3000 });

            expect(result.config).toBeDefined();
            expect(result.sources).toBeDefined();
            expect(result.sources.language).toBe('global');
            expect(result.sources.testCaseCount).toBe('project');
            expect(result.sources.timeLimitMs).toBe('cli');
            expect(result.sources.problemPrefix).toBe('default');
        });
    });

    describe('getConfigValue', () => {
        it('应该获取指定配置项的值', () => {
            const { getConfigValue, writeConfig } = require('../src/core/configmanager');
            writeConfig({ problemPrefix: 'custom' });
            expect(getConfigValue('problemPrefix')).toBe('custom');
        });

        it('应该支持嵌套字段', () => {
            const { getConfigValue } = require('../src/core/configmanager');
            expect(getConfigValue('directories.input')).toBe('./data/in');
        });
    });

    describe('setGlobalConfigValue', () => {
        it('应该设置全局配置项', () => {
            const { setGlobalConfigValue, loadGlobalConfig } = require('../src/core/configmanager');
            setGlobalConfigValue('language', 'python');
            const config = loadGlobalConfig();
            expect(config.language).toBe('python');
        });

        it('应该支持嵌套字段', () => {
            const { setGlobalConfigValue, loadGlobalConfig } = require('../src/core/configmanager');
            setGlobalConfigValue('directories.input', './custom/in');
            const config = loadGlobalConfig();
            expect(config.directories.input).toBe('./custom/in');
        });

        it('应该可以删除配置项（设为 undefined）', () => {
            const { setGlobalConfigValue, loadGlobalConfig } = require('../src/core/configmanager');
            setGlobalConfigValue('language', 'python');
            setGlobalConfigValue('language', undefined);
            const config = loadGlobalConfig();
            expect(config.language).toBeUndefined();
        });
    });

    describe('resolveConfig', () => {
        it('cpp 语言应该设置 compilerPath 为 gppPath', () => {
            const { resolveConfig } = require('../src/core/configmanager');
            const config = resolveConfig({ language: 'cpp', gppPath: 'custom-g++' });
            expect(config.compilerPath).toBe('custom-g++');
        });

        it('python 语言应该设置 compilerPath 为 pythonPath', () => {
            const { resolveConfig } = require('../src/core/configmanager');
            const config = resolveConfig({ language: 'python', pythonPath: 'python3' });
            expect(config.compilerPath).toBe('python3');
        });
    });

    describe('resetConfig', () => {
        it('应该将配置重置为默认值', () => {
            const { resetConfig, getConfig, writeConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            writeConfig({ gppPath: 'wrong-path' });
            const resetResult = resetConfig();
            expect(resetResult).toEqual(DEFAULT_CONFIG);
            const currentConfig = getConfig();
            expect(currentConfig.gppPath).toBe(DEFAULT_CONFIG.gppPath);
        });
    });
});
