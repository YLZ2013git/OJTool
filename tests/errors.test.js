const {
    ErrorCode,
    OJToolError,
    ConfigError,
    JudgeError,
    ValidationError,
    PathError
} = require('../src/utils/errors');

describe('ErrorCode', () => {
    it('应该包含所有预定义的错误码', () => {
        expect(ErrorCode.CONFIG_NOT_FOUND).toBe('CONFIG_NOT_FOUND');
        expect(ErrorCode.CONFIG_INVALID).toBe('CONFIG_INVALID');
        expect(ErrorCode.JUDGER_NOT_FOUND).toBe('JUDGER_NOT_FOUND');
        expect(ErrorCode.PATH_UNSAFE).toBe('PATH_UNSAFE');
        expect(ErrorCode.PLAYER_COUNT_INVALID).toBe('PLAYER_COUNT_INVALID');
        expect(ErrorCode.BASE_PATH_INVALID).toBe('BASE_PATH_INVALID');
        expect(ErrorCode.JUDGE_TIMEOUT).toBe('JUDGE_TIMEOUT');
        expect(ErrorCode.JUDGE_FAILED).toBe('JUDGE_FAILED');
        expect(ErrorCode.RESULT_PARSE_FAILED).toBe('RESULT_PARSE_FAILED');
    });

    it('所有错误码的值应该是唯一的', () => {
        const values = Object.values(ErrorCode);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(values.length);
    });

    it('错误码的数量应该正确', () => {
        expect(Object.keys(ErrorCode).length).toBe(9);
    });
});

describe('OJToolError', () => {
    it('应该是 Error 的实例', () => {
        const err = new OJToolError(ErrorCode.CONFIG_INVALID, 'test error');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(OJToolError);
    });

    it('应该有正确的 name 属性', () => {
        const err = new OJToolError(ErrorCode.CONFIG_INVALID, 'test error');
        expect(err.name).toBe('OJToolError');
    });

    it('应该有正确的 code 属性', () => {
        const err = new OJToolError(ErrorCode.CONFIG_INVALID, 'test error');
        expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
    });

    it('应该有正确的 message 属性', () => {
        const err = new OJToolError(ErrorCode.CONFIG_INVALID, 'test error message');
        expect(err.message).toBe('test error message');
    });

    it('应该有 stack 属性', () => {
        const err = new OJToolError(ErrorCode.CONFIG_INVALID, 'test error');
        expect(err.stack).toBeDefined();
    });
});

describe('ConfigError', () => {
    it('应该是 OJToolError 和 Error 的实例', () => {
        const err = new ConfigError();
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(OJToolError);
        expect(err).toBeInstanceOf(ConfigError);
    });

    it('应该有正确的 name 属性', () => {
        const err = new ConfigError();
        expect(err.name).toBe('ConfigError');
    });

    it('应该有默认的错误码和消息', () => {
        const err = new ConfigError();
        expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
        expect(err.message).toBe('配置错误');
    });

    it('支持自定义消息覆盖默认消息', () => {
        const err = new ConfigError('自定义配置错误消息');
        expect(err.message).toBe('自定义配置错误消息');
        expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
    });
});

describe('JudgeError', () => {
    it('应该是 OJToolError 和 Error 的实例', () => {
        const err = new JudgeError();
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(OJToolError);
        expect(err).toBeInstanceOf(JudgeError);
    });

    it('应该有正确的 name 属性', () => {
        const err = new JudgeError();
        expect(err.name).toBe('JudgeError');
    });

    it('应该有默认的错误码和消息', () => {
        const err = new JudgeError();
        expect(err.code).toBe(ErrorCode.JUDGE_FAILED);
        expect(err.message).toBe('评测失败');
    });

    it('支持自定义消息覆盖默认消息', () => {
        const err = new JudgeError('自定义评测错误消息');
        expect(err.message).toBe('自定义评测错误消息');
        expect(err.code).toBe(ErrorCode.JUDGE_FAILED);
    });
});

describe('ValidationError', () => {
    it('应该是 OJToolError 和 Error 的实例', () => {
        const err = new ValidationError();
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(OJToolError);
        expect(err).toBeInstanceOf(ValidationError);
    });

    it('应该有正确的 name 属性', () => {
        const err = new ValidationError();
        expect(err.name).toBe('ValidationError');
    });

    it('应该有默认的错误码和消息', () => {
        const err = new ValidationError();
        expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
        expect(err.message).toBe('验证失败');
    });

    it('支持自定义消息覆盖默认消息', () => {
        const err = new ValidationError('自定义验证错误消息');
        expect(err.message).toBe('自定义验证错误消息');
        expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
    });
});

describe('PathError', () => {
    it('应该是 OJToolError 和 Error 的实例', () => {
        const err = new PathError();
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(OJToolError);
        expect(err).toBeInstanceOf(PathError);
    });

    it('应该有正确的 name 属性', () => {
        const err = new PathError();
        expect(err.name).toBe('PathError');
    });

    it('应该有默认的错误码和消息', () => {
        const err = new PathError();
        expect(err.code).toBe(ErrorCode.PATH_UNSAFE);
        expect(err.message).toBe('路径不安全');
    });

    it('支持自定义消息覆盖默认消息', () => {
        const err = new PathError('自定义路径错误消息');
        expect(err.message).toBe('自定义路径错误消息');
        expect(err.code).toBe(ErrorCode.PATH_UNSAFE);
    });
});

describe('错误类层次结构', () => {
    it('所有子类都应该能被 OJToolError 的 catch 捕获', () => {
        const errors = [
            new ConfigError(),
            new JudgeError(),
            new ValidationError(),
            new PathError()
        ];

        for (const err of errors) {
            expect(err instanceof OJToolError).toBe(true);
        }
    });

    it('所有子类都应该能被 Error 的 catch 捕获', () => {
        const errors = [
            new ConfigError(),
            new JudgeError(),
            new ValidationError(),
            new PathError()
        ];

        for (const err of errors) {
            expect(err instanceof Error).toBe(true);
        }
    });

    it('不同子类之间不应该混淆', () => {
        const configErr = new ConfigError();
        const judgeErr = new JudgeError();

        expect(configErr instanceof JudgeError).toBe(false);
        expect(judgeErr instanceof ConfigError).toBe(false);
    });
});

describe('向后兼容性', () => {
    it('抛出 OJToolError 可以用 try-catch 像普通 Error 一样捕获', () => {
        let caught = null;
        try {
            throw new ConfigError('测试错误');
        } catch (e) {
            caught = e;
        }
        expect(caught).not.toBeNull();
        expect(caught.message).toBe('测试错误');
    });

    it('可以通过 code 字段区分不同类型的错误', () => {
        const err1 = new ConfigError();
        const err2 = new PathError();

        expect(err1.code).not.toBe(err2.code);
    });
});
