const { exec } = require('child_process');
const fs = require('fs');
const BaseLanguageAdapter = require('./base');

class CppAdapter extends BaseLanguageAdapter {
    constructor() {
        super();
        this.name = 'cpp';
        this.extensions = ['.cpp', '.cc', '.cxx', '.c++'];
    }

    async compile(sourcePath, outputPath, options = {}) {
        const gppPath = options.gppPath || 'g++';
        const cppVersion = options.cppVersion || 17;
        const compileFlags = options.compileFlags || '-O2 -Wall';

        const command = `"${gppPath}" -std=c++${cppVersion} ${compileFlags} -o "${outputPath}" "${sourcePath}"`;

        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        error: stderr || error.message
                    });
                    return;
                }
                resolve({
                    success: true,
                    stdout: stdout,
                    stderr: stderr
                });
            });
        });
    }

    async run(executablePath, inputFile, outputFile, timeLimitMs, options = {}) {
        const fs = require('fs');
        const { spawn } = require('child_process');
        // options 参数保留供未来扩展
        void options;

        return new Promise((resolve) => {
            let inputStream = null;
            if (inputFile && fs.existsSync(inputFile)) {
                inputStream = fs.createReadStream(inputFile);
            }

            const child = spawn(executablePath, [], {
                stdio: [inputStream ? 'pipe' : 'ignore', 'pipe', 'pipe']
            });

            let outputData = '';
            let errorData = '';
            let timedOut = false;
            let startTime = Date.now();

            const timeout = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, timeLimitMs);

            child.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            child.on('close', (code) => {
                clearTimeout(timeout);
                const endTime = Date.now();
                const timeMs = endTime - startTime;

                if (timedOut) {
                    resolve({
                        status: 'TLE',
                        timeMs: timeLimitMs,
                        error: 'Time Limit Exceeded'
                    });
                    return;
                }

                if (code !== 0) {
                    resolve({
                        status: 'RTE',
                        timeMs: timeMs,
                        error: errorData || `Runtime Error (exit code ${code})`
                    });
                    return;
                }

                if (outputFile) {
                    try {
                        fs.writeFileSync(outputFile, outputData);
                    } catch (e) {
                        resolve({
                            status: 'OLE',
                            timeMs: timeMs,
                            error: 'Output Limit Exceeded'
                        });
                        return;
                    }
                }

                resolve({
                    status: 'AC',
                    timeMs: timeMs,
                    output: outputData
                });
            });

            child.on('error', (err) => {
                clearTimeout(timeout);
                resolve({
                    status: 'RTE',
                    timeMs: 0,
                    error: err.message
                });
            });

            if (inputStream) {
                inputStream.pipe(child.stdin);
            }
        });
    }

    cleanup(executablePath) {
        if (executablePath && fs.existsSync(executablePath)) {
            try {
                fs.unlinkSync(executablePath);
                return true;
            } catch (e) {
                return false;
            }
        }
        return true;
    }

    async detect() {
        return new Promise((resolve) => {
            exec('g++ --version', (error, stdout) => {
                if (error) {
                    resolve({
                        available: false,
                        version: null,
                        path: null
                    });
                    return;
                }
                const firstLine = stdout.split('\n')[0] || '';
                const versionMatch = firstLine.match(/(\d+\.\d+\.\d+)/);
                const version = versionMatch ? versionMatch[1] : 'unknown';
                resolve({
                    available: true,
                    version: version,
                    path: 'g++'
                });
            });
        });
    }
}

module.exports = CppAdapter;
