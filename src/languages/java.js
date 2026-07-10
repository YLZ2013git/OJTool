const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const BaseLanguageAdapter = require('./base');

class JavaAdapter extends BaseLanguageAdapter {
    constructor() {
        super();
        this.name = 'java';
        this.extensions = ['.java'];
        this.mainClass = 'Main';
    }

    extractMainClass(sourcePath) {
        try {
            const content = fs.readFileSync(sourcePath, 'utf-8');
            const match = content.match(/public\s+class\s+(\w+)/);
            if (match) {
                return match[1];
            }
        } catch (e) {
            // 忽略读取错误，使用默认 Main
        }
        return this.mainClass;
    }

    async compile(sourcePath, outputDir, options = {}) {
        const javacPath = options.javacPath || 'javac';
        const compileFlags = options.compileFlags || '';

        const mainClass = this.extractMainClass(sourcePath);
        const outputDirectory = outputDir || path.dirname(sourcePath);

        if (!fs.existsSync(outputDirectory)) {
            try {
                fs.mkdirSync(outputDirectory, { recursive: true });
            } catch (e) {
                return {
                    success: false,
                    error: `无法创建输出目录: ${e.message}`
                };
            }
        }

        const command = `"${javacPath}" -d "${outputDirectory}" ${compileFlags} "${sourcePath}"`;

        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        error: stderr || error.message,
                        mainClass: mainClass
                    });
                    return;
                }
                resolve({
                    success: true,
                    stdout: stdout,
                    stderr: stderr,
                    mainClass: mainClass,
                    classDir: outputDirectory
                });
            });
        });
    }

    async run(sourcePath, inputFile, outputFile, timeLimitMs, options = {}) {
        const { spawn } = require('child_process');
        const javaPath = options.javaPath || 'java';
        const outputLimitKb = options.outputLimitKb || 1024;
        const classDir = options.classDir || path.dirname(sourcePath);
        const mainClass = options.mainClass || this.extractMainClass(sourcePath);

        return new Promise((resolve) => {
            let inputStream = null;
            if (inputFile && fs.existsSync(inputFile)) {
                inputStream = fs.createReadStream(inputFile);
            }

            const child = spawn(javaPath, ['-cp', classDir, mainClass], {
                stdio: [inputStream ? 'pipe' : 'ignore', 'pipe', 'pipe']
            });

            let outputData = '';
            let errorData = '';
            let timedOut = false;
            let outputExceeded = false;
            let startTime = Date.now();

            const timeout = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, timeLimitMs);

            child.stdout.on('data', (data) => {
                outputData += data.toString();
                if (Buffer.byteLength(outputData, 'utf8') > outputLimitKb * 1024) {
                    outputExceeded = true;
                    child.kill('SIGKILL');
                }
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

                if (outputExceeded) {
                    resolve({
                        status: 'OLE',
                        timeMs: timeMs,
                        error: 'Output Limit Exceeded'
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
        const tryJava = (cmd) => {
            return new Promise((resolve) => {
                exec(`${cmd} -version`, (error, stdout, stderr) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    const output = stderr || stdout;
                    const firstLine = output.split('\n')[0] || '';
                    const versionMatch = firstLine.match(/(\d+\.\d+\.\d+)/) || firstLine.match(/version\s+"?(\d+)/);
                    const version = versionMatch ? versionMatch[1] : 'unknown';
                    resolve({
                        available: true,
                        version: version,
                        path: cmd
                    });
                });
            });
        };

        const javaResult = await tryJava('java');
        if (!javaResult) {
            return {
                available: false,
                version: null,
                path: null,
                javacPath: null
            };
        }

        const javacResult = await new Promise((resolve) => {
            exec('javac -version', (error, stdout, stderr) => {
                if (error) {
                    resolve(null);
                    return;
                }
                const output = stderr || stdout;
                const firstLine = output.split('\n')[0] || '';
                const versionMatch = firstLine.match(/(\d+\.\d+\.\d+)/) || firstLine.match(/version\s+"?(\d+)/);
                const version = versionMatch ? versionMatch[1] : 'unknown';
                resolve({
                    available: true,
                    version: version,
                    path: 'javac'
                });
            });
        });

        return {
            available: true,
            version: javaResult.version,
            path: javaResult.path,
            javacPath: javacResult ? javacResult.path : null,
            javacVersion: javacResult ? javacResult.version : null
        };
    }
}

module.exports = JavaAdapter;
