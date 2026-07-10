const { exec } = require('child_process');
const fs = require('fs');
const BaseLanguageAdapter = require('./base');

class PythonAdapter extends BaseLanguageAdapter {
    constructor() {
        super();
        this.name = 'python';
        this.extensions = ['.py'];
    }

    async compile(sourcePath, outputPath, options = {}) {
        const pythonPath = options.pythonPath || 'python';
        void outputPath;
        
        return new Promise((resolve) => {
            const command = `"${pythonPath}" -m py_compile "${sourcePath}"`;
            
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
        const { spawn } = require('child_process');
        const pythonPath = options.pythonPath || 'python';
        const outputLimitKb = options.outputLimitKb || 1024;

        return new Promise((resolve) => {
            let inputStream = null;
            if (inputFile && fs.existsSync(inputFile)) {
                inputStream = fs.createReadStream(inputFile);
            }

            const child = spawn(pythonPath, [executablePath], {
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
        void executablePath;
        return true;
    }

    async detect() {
        const tryPython = (cmd) => {
            return new Promise((resolve) => {
                exec(`${cmd} --version`, (error, stdout, stderr) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    const output = stdout || stderr;
                    const firstLine = output.split('\n')[0] || '';
                    const versionMatch = firstLine.match(/(\d+\.\d+\.\d+)/);
                    const version = versionMatch ? versionMatch[1] : 'unknown';
                    resolve({
                        available: true,
                        version: version,
                        path: cmd
                    });
                });
            });
        };

        const python3Result = await tryPython('python3');
        if (python3Result) {
            return python3Result;
        }

        const pythonResult = await tryPython('python');
        if (pythonResult) {
            return pythonResult;
        }

        return {
            available: false,
            version: null,
            path: null
        };
    }
}

module.exports = PythonAdapter;
