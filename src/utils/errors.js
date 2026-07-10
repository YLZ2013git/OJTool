const ErrorCode = {
    CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
    CONFIG_INVALID: 'CONFIG_INVALID',
    JUDGER_NOT_FOUND: 'JUDGER_NOT_FOUND',
    PATH_UNSAFE: 'PATH_UNSAFE',
    PLAYER_COUNT_INVALID: 'PLAYER_COUNT_INVALID',
    BASE_PATH_INVALID: 'BASE_PATH_INVALID',
    JUDGE_TIMEOUT: 'JUDGE_TIMEOUT',
    JUDGE_FAILED: 'JUDGE_FAILED',
    RESULT_PARSE_FAILED: 'RESULT_PARSE_FAILED'
};

class OJToolError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'OJToolError';
        this.code = code;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

class ConfigError extends OJToolError {
    constructor(message) {
        super(ErrorCode.CONFIG_INVALID, message || '配置错误');
        this.name = 'ConfigError';
    }
}

class JudgeError extends OJToolError {
    constructor(message) {
        super(ErrorCode.JUDGE_FAILED, message || '评测失败');
        this.name = 'JudgeError';
    }
}

class ValidationError extends OJToolError {
    constructor(message) {
        super(ErrorCode.CONFIG_INVALID, message || '验证失败');
        this.name = 'ValidationError';
    }
}

class PathError extends OJToolError {
    constructor(message) {
        super(ErrorCode.PATH_UNSAFE, message || '路径不安全');
        this.name = 'PathError';
    }
}

module.exports = {
    ErrorCode,
    OJToolError,
    ConfigError,
    JudgeError,
    ValidationError,
    PathError
};
