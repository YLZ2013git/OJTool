class BaseLanguageAdapter {
    constructor() {
        this.name = '';
        this.extensions = [];
    }

    async compile(sourcePath, outputPath, options) {
        // 接口方法，参数保留供子类实现
        void sourcePath;
        void outputPath;
        void options;
        throw new Error('not implemented');
    }

    async run(executablePath, inputFile, outputFile, timeLimitMs, options) {
        // 接口方法，参数保留供子类实现
        void executablePath;
        void inputFile;
        void outputFile;
        void timeLimitMs;
        void options;
        throw new Error('not implemented');
    }

    cleanup(executablePath) {
        // 接口方法，参数保留供子类实现
        void executablePath;
        throw new Error('not implemented');
    }

    async detect() {
        throw new Error('not implemented');
    }
}

module.exports = BaseLanguageAdapter;
