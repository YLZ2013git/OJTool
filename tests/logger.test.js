beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
});

console.log = jest.fn();
console.clear = jest.fn();

describe('logger', () => {
    describe('setVerbose / getVerbose', () => {
        it('默认 verbose 为 false', () => {
            const logger = require('../src/utils/logger');
            expect(logger.getVerbose()).toBe(false);
        });

        it('setVerbose 可以设置 verbose 状态', () => {
            const logger = require('../src/utils/logger');
            logger.setVerbose(true);
            expect(logger.getVerbose()).toBe(true);
            logger.setVerbose(false);
            expect(logger.getVerbose()).toBe(false);
        });
    });

    describe('debug', () => {
        it('verbose 关闭时不输出', () => {
            const logger = require('../src/utils/logger');
            logger.setVerbose(false);
            logger.debug('test debug message');
            expect(console.log).not.toHaveBeenCalled();
        });

        it('verbose 开启时输出 debug 日志', () => {
            const logger = require('../src/utils/logger');
            logger.setVerbose(true);
            logger.debug('test debug message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('DEBUG');
            expect(output).toContain('test debug message');
        });
    });

    describe('info', () => {
        it('输出 info 级别日志', () => {
            const logger = require('../src/utils/logger');
            logger.info('test info message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('INFO');
            expect(output).toContain('test info message');
        });
    });

    describe('warn', () => {
        it('输出 warn 级别日志', () => {
            const logger = require('../src/utils/logger');
            logger.warn('test warn message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('WARN');
            expect(output).toContain('test warn message');
        });
    });

    describe('error', () => {
        it('输出 error 级别日志', () => {
            const logger = require('../src/utils/logger');
            logger.error('test error message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('ERROR');
            expect(output).toContain('test error message');
        });
    });

    describe('success', () => {
        it('输出 success 级别日志', () => {
            const logger = require('../src/utils/logger');
            logger.success('test success message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('SUCCESS');
            expect(output).toContain('test success message');
        });
    });

    describe('fail', () => {
        it('输出 fail 级别日志', () => {
            const logger = require('../src/utils/logger');
            logger.fail('test fail message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('FAIL');
            expect(output).toContain('test fail message');
        });
    });

    describe('log', () => {
        it('输出普通日志（无格式）', () => {
            const logger = require('../src/utils/logger');
            logger.log('plain message');
            expect(console.log).toHaveBeenCalledWith('plain message');
        });
    });

    describe('clear', () => {
        it('调用 console.clear', () => {
            const logger = require('../src/utils/logger');
            logger.clear();
            expect(console.clear).toHaveBeenCalled();
        });
    });

    describe('divider', () => {
        it('输出默认分隔线', () => {
            const logger = require('../src/utils/logger');
            logger.divider();
            expect(console.log).toHaveBeenCalled();
        });

        it('支持自定义分隔符和长度', () => {
            const logger = require('../src/utils/logger');
            logger.divider('=', 30);
            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('title', () => {
        it('输出标题格式', () => {
            const logger = require('../src/utils/logger');
            logger.title('Test Title');
            expect(console.log).toHaveBeenCalled();
            const calls = console.log.mock.calls;
            expect(calls.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('LEVELS', () => {
        it('定义了日志级别常量', () => {
            const logger = require('../src/utils/logger');
            expect(logger.LEVELS).toBeDefined();
            expect(logger.LEVELS.debug).toBe(0);
            expect(logger.LEVELS.info).toBe(1);
            expect(logger.LEVELS.warn).toBe(2);
            expect(logger.LEVELS.error).toBe(3);
        });
    });

    describe('Logger 类', () => {
        it('可以通过 Logger 类创建新实例', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger();
            expect(logger).toBeInstanceOf(Logger);
            expect(typeof logger.setVerbose).toBe('function');
            expect(typeof logger.getVerbose).toBe('function');
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.success).toBe('function');
            expect(typeof logger.fail).toBe('function');
            expect(typeof logger.log).toBe('function');
            expect(typeof logger.clear).toBe('function');
            expect(typeof logger.divider).toBe('function');
            expect(typeof logger.title).toBe('function');
        });

        it('新实例默认 verbose 为 false', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger();
            expect(logger.getVerbose()).toBe(false);
        });
    });

    describe('多实例独立性', () => {
        it('两个 Logger 实例的 verbose 状态互不干扰', () => {
            const { Logger } = require('../src/utils/logger');
            const logger1 = new Logger();
            const logger2 = new Logger();

            logger1.setVerbose(true);
            expect(logger1.getVerbose()).toBe(true);
            expect(logger2.getVerbose()).toBe(false);

            logger2.setVerbose(true);
            expect(logger1.getVerbose()).toBe(true);
            expect(logger2.getVerbose()).toBe(true);

            logger1.setVerbose(false);
            expect(logger1.getVerbose()).toBe(false);
            expect(logger2.getVerbose()).toBe(true);
        });

        it('单例与新实例的 verbose 状态互不干扰', () => {
            const defaultLogger = require('../src/utils/logger');
            const { Logger } = require('../src/utils/logger');
            const newLogger = new Logger();

            defaultLogger.setVerbose(true);
            expect(defaultLogger.getVerbose()).toBe(true);
            expect(newLogger.getVerbose()).toBe(false);

            newLogger.setVerbose(true);
            defaultLogger.setVerbose(false);
            expect(defaultLogger.getVerbose()).toBe(false);
            expect(newLogger.getVerbose()).toBe(true);
        });

        it('两个实例的 debug 输出独立', () => {
            const { Logger } = require('../src/utils/logger');
            const logger1 = new Logger();
            const logger2 = new Logger();

            logger1.setVerbose(true);
            logger2.setVerbose(false);

            logger1.debug('logger1 debug');
            logger2.debug('logger2 debug');

            expect(console.log).toHaveBeenCalledTimes(1);
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('logger1 debug');
        });
    });

    describe('name 参数', () => {
        it('Logger 构造函数接受 name 参数', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('TestLogger');
            expect(logger.name).toBe('TestLogger');
        });

        it('默认 name 为空字符串', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger();
            expect(logger.name).toBe('');
        });

        it('有 name 时日志前缀包含 name', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('MyApp');
            logger.setVerbose(true);

            logger.info('test message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('[MyApp]');
            expect(output).toContain('test message');
        });

        it('无 name 时日志前缀不包含 name', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger();
            logger.info('test message');
            expect(console.log).toHaveBeenCalled();
            const output = console.log.mock.calls[0][0];
            expect(output).not.toContain('[ ]');
        });

        it('debug 日志也包含 name 前缀', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('DebugLogger');
            logger.setVerbose(true);
            logger.debug('debug message');
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('[DebugLogger]');
            expect(output).toContain('debug message');
        });

        it('warn 日志包含 name 前缀', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('WarnLogger');
            logger.warn('warn message');
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('[WarnLogger]');
        });

        it('error 日志包含 name 前缀', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('ErrorLogger');
            logger.error('error message');
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('[ErrorLogger]');
        });

        it('success 日志包含 name 前缀', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('SuccessLogger');
            logger.success('success message');
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('[SuccessLogger]');
        });

        it('fail 日志包含 name 前缀', () => {
            const { Logger } = require('../src/utils/logger');
            const logger = new Logger('FailLogger');
            logger.fail('fail message');
            const output = console.log.mock.calls[0][0];
            expect(output).toContain('[FailLogger]');
        });
    });
});
