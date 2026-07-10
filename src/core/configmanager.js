const fs = require('fs');
const path = require('path');
const os = require('os');
const { ConfigError } = require('../utils/errors');

function getDesktopPath() {
    return path.join(os.homedir(), 'Desktop');
}

const DEFAULT_CONFIG = {
    version: '1.0.0',
    language: 'cpp',
    gppPath: 'g++',
    pythonPath: 'python',
    javaPath: 'java',
    javacPath: 'javac',
    compilerPath: 'g++',
    problemPrefix: 'problem',
    testCaseCount: 10,
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    scorePerCase: 10,
    cppVersion: 17,
    compileFlags: '-O2 -Wall',
    outputLimitKb: 1024,
    playerCount: 1,
    basePath: getDesktopPath(),
    scoreMode: 'sum',
    judgeProgram: '',
    checkerType: 'default',
    customCheckerPath: '',
    noipMode: true,
    problems: undefined,
    directories: {
        input: './data/in',
        output: './data/out',
        answer: './data/ans',
        temp: './temp'
    }
};

const CONFIG_SCHEMA = {
    language: {
        type: 'string',
        default: 'cpp',
        description: '编程语言 (cpp, python, java)',
        enum: ['cpp', 'python', 'java']
    },
    gppPath: {
        type: 'string',
        default: 'g++',
        description: 'g++ 编译器路径'
    },
    pythonPath: {
        type: 'string',
        default: 'python',
        description: 'Python 解释器路径'
    },
    javaPath: {
        type: 'string',
        default: 'java',
        description: 'Java 运行时路径'
    },
    javacPath: {
        type: 'string',
        default: 'javac',
        description: 'Java 编译器路径'
    },
    compilerPath: {
        type: 'string',
        default: 'g++',
        description: '编译器路径'
    },
    problemPrefix: {
        type: 'string',
        default: 'problem',
        description: '题目前缀'
    },
    testCaseCount: {
        type: 'number',
        default: 10,
        description: '测试用例数量',
        min: 1
    },
    timeLimitMs: {
        type: 'number',
        default: 1000,
        description: '时间限制（毫秒）',
        min: 1
    },
    memoryLimitKb: {
        type: 'number',
        default: 262144,
        description: '内存限制（KB）',
        min: 1
    },
    scorePerCase: {
        type: 'number',
        default: 10,
        description: '每题分值',
        min: 0
    },
    cppVersion: {
        type: 'number',
        default: 17,
        description: 'C++ 版本'
    },
    compileFlags: {
        type: 'string',
        default: '-O2 -Wall',
        description: '编译选项'
    },
    outputLimitKb: {
        type: 'number',
        default: 1024,
        description: '输出限制（KB）',
        min: 1
    },
    playerCount: {
        type: 'number',
        default: 1,
        description: '选手数量',
        min: 1
    },
    basePath: {
        type: 'string',
        default: '<桌面路径>',
        description: '基础路径'
    },
    scoreMode: {
        type: 'string',
        default: 'sum',
        description: '计分模式',
        enum: ['sum', 'average']
    },
    judgeProgram: {
        type: 'string',
        default: '',
        description: '评测机程序路径'
    },
    checkerType: {
        type: 'string',
        default: 'default',
        description: 'SPJ checker 类型 (default: 普通文本比对 / ncmp: 无序整数比对 / fcmp: 忽略空白 / rcmp4: 浮点数 1e-4 误差 / custom: 自定义 checker)',
        enum: ['default', 'ncmp', 'fcmp', 'rcmp4', 'custom']
    },
    customCheckerPath: {
        type: 'string',
        default: '',
        description: '自定义 checker 程序路径（仅在 checkerType=custom 时使用）'
    },
    noipMode: {
        type: 'boolean',
        default: true,
        description: 'NOIP 模式（开启时使用 NOIP 标准编译选项 + 源码检查，#pragma/Windows 头文件会触发 UKE）'
    },
    problems: {
        type: 'array',
        default: undefined,
        description: '竞赛模式题目配置'
    },
    directories: {
        type: 'object',
        default: { input: './data/in', output: './data/out', answer: './data/ans', temp: './temp' },
        description: '目录配置'
    }
};

function getGlobalConfigDir() {
    return path.join(os.homedir(), '.ojtool');
}

function getGlobalConfigPath() {
    return path.join(getGlobalConfigDir(), 'config.json');
}

function getProjectConfigPath(customPath) {
    const base = customPath || process.cwd();
    return path.join(base, 'ojtool.json');
}

function getConfigPath() {
    return getProjectConfigPath();
}

function ensureGlobalConfigDir() {
    const dir = getGlobalConfigDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readConfigFile(configPath) {
    if (!fs.existsSync(configPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        throw new ConfigError(`配置文件格式错误 (${configPath}): ${error.message}`);
    }
}

function loadGlobalConfig() {
    const configPath = getGlobalConfigPath();
    try {
        return readConfigFile(configPath) || {};
    } catch (error) {
        console.error(`❌ ${error.message}`);
        return {};
    }
}

function loadGlobalConfigStrict() {
    const configPath = getGlobalConfigPath();
    return readConfigFile(configPath) || {};
}

function saveGlobalConfig(config) {
    ensureGlobalConfigDir();
    const configPath = getGlobalConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
}

function readConfig(customPath) {
    const configPath = getProjectConfigPath(customPath);
    try {
        return readConfigFile(configPath);
    } catch (error) {
        console.error(`❌ ${error.message}`);
        return null;
    }
}

function readConfigStrict(customPath) {
    const configPath = getProjectConfigPath(customPath);
    if (!fs.existsSync(configPath)) {
        throw new ConfigError('配置文件不存在');
    }
    return readConfigFile(configPath);
}

function writeConfig(config, customPath) {
    const configPath = getProjectConfigPath(customPath);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
}

function deepMerge(target, source) {
    const result = { ...target };
    if (!source) return result;
    for (const key of Object.keys(source)) {
        if (source[key] !== undefined && source[key] !== null) {
            if (
                typeof source[key] === 'object' &&
                !Array.isArray(source[key]) &&
                typeof result[key] === 'object' &&
                !Array.isArray(result[key])
            ) {
                result[key] = deepMerge(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    return result;
}

function mergeConfig(defaultConfig, globalConfig, projectConfig, cliConfig) {
    let result = { ...defaultConfig };
    result = deepMerge(result, globalConfig || {});
    result = deepMerge(result, projectConfig || {});
    result = deepMerge(result, cliConfig || {});
    return result;
}

function getConfigSchema() {
    return JSON.parse(JSON.stringify(CONFIG_SCHEMA));
}

function validateType(value, expectedType) {
    if (expectedType === 'array') return Array.isArray(value);
    if (expectedType === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    return typeof value === expectedType;
}

function validateConfig(config) {
    const errors = [];

    for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
        if (config[key] === undefined || config[key] === null) {
            continue;
        }

        const value = config[key];

        if (!validateType(value, schema.type)) {
            errors.push({
                field: key,
                message: `字段 '${key}' 类型错误，期望 ${schema.type}，实际 ${Array.isArray(value) ? 'array' : typeof value}`
            });
            continue;
        }

        if (schema.enum && !schema.enum.includes(value)) {
            errors.push({
                field: key,
                message: `字段 '${key}' 值无效，可选值: ${schema.enum.join(', ')}`
            });
            continue;
        }

        if (schema.type === 'number' && schema.min !== undefined && value < schema.min) {
            errors.push({
                field: key,
                message: `字段 '${key}' 值不能小于 ${schema.min}`
            });
        }
    }

    // checkerType=custom 时要求 customCheckerPath 非空
    const checkerType = config.checkerType;
    if (checkerType === 'custom' && !config.customCheckerPath) {
        errors.push({
            field: 'customCheckerPath',
            message: "checkerType 为 'custom' 时必须指定 customCheckerPath"
        });
    }

    if (config.problems && Array.isArray(config.problems)) {
        for (let i = 0; i < config.problems.length; i++) {
            const problemValidation = validateProblem(config.problems[i], i);
            if (!problemValidation.valid) {
                errors.push({
                    field: problemValidation.missing,
                    message: `题目配置缺少必填字段: ${problemValidation.missing}`
                });
            }
            // 校验题目级 checker 配置
            const p = config.problems[i];
            if (p && p.checkerType === 'custom' && !p.customCheckerPath) {
                errors.push({
                    field: `problems[${i}].customCheckerPath`,
                    message: `题目 ${i} 的 checkerType 为 'custom' 时必须指定 customCheckerPath`
                });
            }
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors,
            message: errors.map(e => e.message).join('; ')
        };
    }

    return { valid: true };
}

function validateProblem(problem, index) {
    if (!problem || typeof problem !== 'object') {
        return { valid: false, missing: `problems[${index}]` };
    }
    if (!problem.name) {
        return { valid: false, missing: `problems[${index}].name` };
    }
    if (problem.testCaseCount === undefined || problem.testCaseCount === null) {
        return { valid: false, missing: `problems[${index}].testCaseCount` };
    }
    return { valid: true };
}

function isContestMode(config) {
    if (!config) return false;
    if (!config.problems) return false;
    if (!Array.isArray(config.problems)) return false;
    return config.problems.length > 0;
}

function getProblemConfig(problem, globalConfig) {
    return {
        name: problem.name,
        prefix: problem.prefix || problem.name,
        testCaseCount: problem.testCaseCount,
        timeLimitMs: problem.timeLimitMs !== undefined ? problem.timeLimitMs : globalConfig.timeLimitMs,
        memoryLimitKb: problem.memoryLimitKb !== undefined ? problem.memoryLimitKb : globalConfig.memoryLimitKb,
        scorePerCase: problem.scorePerCase !== undefined ? problem.scorePerCase : globalConfig.scorePerCase,
        checkerType: problem.checkerType !== undefined ? problem.checkerType : (globalConfig.checkerType || 'default'),
        customCheckerPath: problem.customCheckerPath !== undefined ? problem.customCheckerPath : (globalConfig.customCheckerPath || ''),
        noipMode: problem.noipMode !== undefined ? problem.noipMode : (globalConfig.noipMode !== undefined ? globalConfig.noipMode : true)
    };
}

function resolveConfig(config, options) {
    const resolved = { ...config };

    if (options) {
        if (options.players) resolved.playerCount = parseInt(options.players);
        if (options.path) resolved.basePath = options.path;
        if (options.prefix) resolved.problemPrefix = options.prefix;
        if (options.count) resolved.testCaseCount = parseInt(options.count);
        // CLI 选项：checker 类型
        if (options.checker) resolved.checkerType = options.checker;
        // CLI 选项：NOIP 模式开关
        if (options.noip === true) {
            resolved.noipMode = true;
        } else if (options.noip === false) {
            resolved.noipMode = false;
        } else if (options.noip !== undefined) {
            // 字符串形式 'true'/'false'
            const v = String(options.noip).toLowerCase();
            if (v === 'true' || v === '1') resolved.noipMode = true;
            else if (v === 'false' || v === '0') resolved.noipMode = false;
        }
    }

    // 向后兼容：旧配置文件使用 'checker' 字段（C++ 评测机读取该字段）
    if (!resolved.checkerType || resolved.checkerType === 'default') {
        if (resolved.checker && typeof resolved.checker === 'string' && resolved.checker.length > 0) {
            resolved.checkerType = resolved.checker;
        }
    }

    if (resolved.language === 'cpp') {
        resolved.compilerPath = resolved.compilerPath || resolved.gppPath || 'g++';
    } else if (resolved.language === 'python') {
        resolved.compilerPath = resolved.compilerPath || resolved.pythonPath || 'python';
    } else if (resolved.language === 'java') {
        resolved.compilerPath = resolved.compilerPath || resolved.javacPath || 'javac';
    }

    return resolved;
}

function getConfig(options) {
    const globalConfig = loadGlobalConfig();
    const projectConfig = readConfig() || {};
    const cliConfig = options || {};
    const merged = mergeConfig(DEFAULT_CONFIG, globalConfig, projectConfig, cliConfig);
    const validation = validateConfig(merged);
    if (!validation.valid) {
        console.warn(`⚠️  配置验证警告: ${validation.message}`);
    }
    return resolveConfig(merged, options);
}

function getConfigWithSources(options) {
    const globalConfig = loadGlobalConfig();
    const projectConfig = readConfig() || {};
    const cliConfig = options || {};
    const merged = mergeConfig(DEFAULT_CONFIG, globalConfig, projectConfig, cliConfig);

    const sources = {};
    for (const key of Object.keys(DEFAULT_CONFIG)) {
        if (cliConfig[key] !== undefined && cliConfig[key] !== null) {
            sources[key] = 'cli';
        } else if (projectConfig[key] !== undefined && projectConfig[key] !== null) {
            sources[key] = 'project';
        } else if (globalConfig[key] !== undefined && globalConfig[key] !== null) {
            sources[key] = 'global';
        } else {
            sources[key] = 'default';
        }
    }

    return {
        config: resolveConfig(merged, options),
        sources,
        globalConfig,
        projectConfig,
        cliConfig
    };
}

function resetConfig(customPath) {
    writeConfig(DEFAULT_CONFIG, customPath);
    return DEFAULT_CONFIG;
}

function getConfigValue(key, options) {
    const config = getConfig(options);
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
        if (value === undefined || value === null) return undefined;
        value = value[k];
    }
    return value;
}

function setGlobalConfigValue(key, value) {
    const config = loadGlobalConfig();
    const keys = key.split('.');

    if (keys.length === 1) {
        if (value === undefined || value === null) {
            delete config[key];
        } else {
            config[key] = value;
        }
    } else {
        let current = config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        if (value === undefined || value === null) {
            delete current[keys[keys.length - 1]];
        } else {
            current[keys[keys.length - 1]] = value;
        }
    }

    saveGlobalConfig(config);
    return config;
}

module.exports = {
    DEFAULT_CONFIG,
    CONFIG_SCHEMA,
    getConfigSchema,
    getGlobalConfigDir,
    getGlobalConfigPath,
    getProjectConfigPath,
    getConfigPath,
    ensureGlobalConfigDir,
    loadGlobalConfig,
    loadGlobalConfigStrict,
    saveGlobalConfig,
    readConfig,
    readConfigStrict,
    writeConfig,
    mergeConfig,
    deepMerge,
    validateConfig,
    validateProblem,
    isContestMode,
    getProblemConfig,
    resolveConfig,
    getConfig,
    getConfigWithSources,
    getConfigValue,
    setGlobalConfigValue,
    resetConfig
};
