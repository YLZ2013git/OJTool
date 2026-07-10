const BaseLanguageAdapter = require('../src/languages/base');
const PythonAdapter = require('../src/languages/python');
const { getByName, getByExtension, listAll } = require('../src/languages/index');

let pythonAvailable = false;

beforeAll(async () => {
    const adapter = new PythonAdapter();
    const result = await adapter.detect();
    pythonAvailable = result.available;
});

describe('PythonAdapter', () => {
    it('应该有正确的 name 和 extensions', () => {
        const adapter = new PythonAdapter();
        expect(adapter.name).toBe('python');
        expect(adapter.extensions).toEqual(['.py']);
    });

    it('应该继承自 BaseLanguageAdapter', () => {
        const adapter = new PythonAdapter();
        expect(adapter instanceof BaseLanguageAdapter).toBe(true);
    });

    describe('detect', () => {
        it('应该返回 detect 结果对象', async () => {
            const adapter = new PythonAdapter();
            const result = await adapter.detect();
            expect(result).toBeDefined();
            expect(typeof result.available).toBe('boolean');
            expect(result).toHaveProperty('version');
            expect(result).toHaveProperty('path');
        });

        it('检测失败时应该返回 available: false', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('not found'), '', '');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(false);
            expect(result.version).toBeNull();
            expect(result.path).toBeNull();

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('python3 可用时优先返回 python3', async () => {
            jest.mock('child_process', () => {
                const mockExecImpl = (cmd, callback) => {
                    if (cmd.includes('python3')) {
                        callback(null, 'Python 3.10.0\n', '');
                    } else {
                        callback(new Error('not found'), '', '');
                    }
                };
                return {
                    exec: jest.fn(mockExecImpl),
                    spawn: jest.fn()
                };
            });
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.version).toBe('3.10.0');
            expect(result.path).toBe('python3');

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('python3 不可用时回退到 python', async () => {
            jest.mock('child_process', () => {
                const mockExecImpl = (cmd, callback) => {
                    if (cmd.includes('python3')) {
                        callback(new Error('not found'), '', '');
                    } else {
                        callback(null, 'Python 3.9.7\n', '');
                    }
                };
                return {
                    exec: jest.fn(mockExecImpl),
                    spawn: jest.fn()
                };
            });
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.version).toBe('3.9.7');
            expect(result.path).toBe('python');

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('无法提取版本号时返回 unknown', async () => {
            jest.mock('child_process', () => {
                const mockExecImpl = (cmd, callback) => {
                    if (cmd.includes('python3')) {
                        callback(new Error('not found'), '', '');
                    } else {
                        callback(null, 'Python some weird version\n', '');
                    }
                };
                return {
                    exec: jest.fn(mockExecImpl),
                    spawn: jest.fn()
                };
            });
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.version).toBe('unknown');
            expect(result.path).toBe('python');

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('版本号在 stderr 时也能提取', async () => {
            jest.mock('child_process', () => {
                const mockExecImpl = (cmd, callback) => {
                    if (cmd.includes('python3')) {
                        callback(new Error('not found'), '', '');
                    } else {
                        callback(null, '', 'Python 3.8.10\n');
                    }
                };
                return {
                    exec: jest.fn(mockExecImpl),
                    spawn: jest.fn()
                };
            });
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.version).toBe('3.8.10');

            jest.dontMock('child_process');
            jest.resetModules();
        });
    });

    describe('cleanup', () => {
        it('应该总是返回 true', () => {
            const adapter = new PythonAdapter();
            expect(adapter.cleanup('nonexistent.py')).toBe(true);
            expect(adapter.cleanup(null)).toBe(true);
            expect(adapter.cleanup(undefined)).toBe(true);
            expect(adapter.cleanup('')).toBe(true);
        });
    });

    describe('compile', () => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        it('语法错误时应该返回 success: false', async () => {
            if (!pythonAvailable) {
                console.log('跳过: Python 不可用');
                return;
            }
            const adapter = new PythonAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-py-test-'));
            const sourcePath = path.join(tempDir, 'test.py');
            const outputPath = path.join(tempDir, 'test.pyc');

            fs.writeFileSync(sourcePath, 'def foo():\n  invalid syntax');

            const result = await adapter.compile(sourcePath, outputPath);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('语法正确时应该返回 success: true', async () => {
            if (!pythonAvailable) {
                console.log('跳过: Python 不可用');
                return;
            }
            const adapter = new PythonAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-py-test-'));
            const sourcePath = path.join(tempDir, 'test.py');
            const outputPath = path.join(tempDir, 'test.pyc');

            fs.writeFileSync(sourcePath, 'print("hello")');

            const result = await adapter.compile(sourcePath, outputPath);
            expect(result.success).toBe(true);

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('编译失败时应该使用 stderr 作为错误信息', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('compile failed'), '', 'SyntaxError');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.compile('test.py', 'test.pyc');
            expect(result.success).toBe(false);
            expect(result.error).toBe('SyntaxError');

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('编译失败且无 stderr 时使用 error.message', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('command not found'), '', '');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.compile('test.py', 'test.pyc');
            expect(result.success).toBe(false);
            expect(result.error).toBe('command not found');

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('编译成功时应该返回 stdout 和 stderr', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(null, 'compiled', '');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const PythonAdapterMocked = require('../src/languages/python');
            const adapter = new PythonAdapterMocked();

            const result = await adapter.compile('test.py', 'test.pyc');
            expect(result.success).toBe(true);
            expect(result.stdout).toBeDefined();
            expect(result.stderr).toBeDefined();

            jest.dontMock('child_process');
            jest.resetModules();
        });
    });

    describe('run', () => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const childProcess = require('child_process');
        const { EventEmitter } = require('events');

        beforeEach(() => {
            jest.restoreAllMocks();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('Python 不存在时应该返回 RTE', async () => {
            const adapter = new PythonAdapter();
            const result = await adapter.run(
                'test.py',
                null,
                null,
                1000,
                { pythonPath: 'nonexistent_python_xyz' }
            );
            expect(result.status).toBe('RTE');
            expect(result.timeMs).toBe(0);
            expect(result.error).toBeDefined();
        });

        it('进程非0退出应该返回 RTE', async () => {
            const adapter = new PythonAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.py', null, null, 1000);

            mockChild.stderr.emit('data', 'Traceback...');
            mockChild.emit('close', 1);

            const result = await promise;
            expect(result.status).toBe('RTE');
            expect(result.error).toContain('Traceback');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
        });

        it('进程非0退出且无stderr时使用退出码', async () => {
            const adapter = new PythonAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.py', null, null, 1000);

            mockChild.emit('close', 127);

            const result = await promise;
            expect(result.status).toBe('RTE');
            expect(result.error).toContain('127');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
        });

        it('成功运行应该返回 AC', async () => {
            const adapter = new PythonAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.py', null, null, 1000);

            mockChild.stdout.emit('data', 'hello world');
            mockChild.emit('close', 0);

            const result = await promise;
            expect(result.status).toBe('AC');
            expect(result.output).toBe('hello world');
            expect(result.timeMs).toBeGreaterThanOrEqual(0);

            mockSpawn.mockRestore();
            mockExists.mockRestore();
        });

        it('指定 outputFile 时应该写入输出文件', async () => {
            const adapter = new PythonAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-py-run-test-'));
            const outputFile = path.join(tempDir, 'output.txt');
            const fakePy = path.join(tempDir, 'fake.py');
            fs.writeFileSync(fakePy, 'print("test")');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);

            const promise = adapter.run(fakePy, null, outputFile, 1000);

            mockChild.stdout.emit('data', 'test output');
            mockChild.emit('close', 0);

            const result = await promise;
            expect(result.status).toBe('AC');
            expect(fs.existsSync(outputFile)).toBe(true);
            expect(fs.readFileSync(outputFile, 'utf-8')).toBe('test output');

            mockSpawn.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('写入输出文件失败时返回 OLE', async () => {
            const adapter = new PythonAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
                throw new Error('write failed');
            });

            const promise = adapter.run('test.py', null, 'output.txt', 1000);

            mockChild.stdout.emit('data', 'test');
            mockChild.emit('close', 0);

            const result = await promise;
            expect(result.status).toBe('OLE');
            expect(result.error).toBe('Output Limit Exceeded');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            mockWrite.mockRestore();
        });

        it('有输入文件时应该从文件读取输入', async () => {
            const adapter = new PythonAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-py-run-test-'));
            const inputFile = path.join(tempDir, 'input.txt');
            fs.writeFileSync(inputFile, 'test input');

            const mockStream = {
                pipe: jest.fn()
            };
            const mockCreateReadStream = jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream);

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
                if (p === inputFile) return true;
                return false;
            });

            const promise = adapter.run('test.py', inputFile, null, 1000);

            mockChild.stdout.emit('data', 'result');
            mockChild.emit('close', 0);

            const result = await promise;
            expect(result.status).toBe('AC');
            expect(mockCreateReadStream).toHaveBeenCalledWith(inputFile);
            expect(mockStream.pipe).toHaveBeenCalled();

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            mockCreateReadStream.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('超时应该返回 TLE', async () => {
            jest.useFakeTimers();
            const adapter = new PythonAdapter();

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };
            mockChild.kill = jest.fn();

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.py', null, null, 1000);

            jest.advanceTimersByTime(1000);

            mockChild.emit('close', -1);

            const result = await promise;
            expect(result.status).toBe('TLE');
            expect(result.timeMs).toBe(1000);
            expect(result.error).toBe('Time Limit Exceeded');
            expect(mockChild.kill).toHaveBeenCalledWith('SIGKILL');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            jest.useRealTimers();
        });

        it('输出超出限制应该返回 OLE', async () => {
            const adapter = new PythonAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };
            mockChild.kill = jest.fn();

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.py', null, null, 1000, { outputLimitKb: 0.001 });

            mockChild.stdout.emit('data', 'a'.repeat(100));
            mockChild.emit('close', -1);

            const result = await promise;
            expect(result.status).toBe('OLE');
            expect(result.error).toBe('Output Limit Exceeded');
            expect(mockChild.kill).toHaveBeenCalledWith('SIGKILL');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
        });

        it('实际运行 Python 脚本应该成功', async () => {
            if (!pythonAvailable) {
                console.log('跳过: Python 不可用');
                return;
            }
            const adapter = new PythonAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-py-real-test-'));
            const scriptPath = path.join(tempDir, 'hello.py');
            const inputFile = path.join(tempDir, 'input.txt');
            const outputFile = path.join(tempDir, 'output.txt');

            fs.writeFileSync(scriptPath, 'name = input()\nprint(f"Hello, {name}!")');
            fs.writeFileSync(inputFile, 'World');

            const result = await adapter.run(scriptPath, inputFile, outputFile, 5000);
            expect(result.status).toBe('AC');
            expect(result.timeMs).toBeGreaterThanOrEqual(0);
            expect(fs.existsSync(outputFile)).toBe(true);
            expect(fs.readFileSync(outputFile, 'utf-8').trim()).toBe('Hello, World!');

            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });
});

describe('Python 语言注册', () => {
    it('应该能通过名称找到 python 适配器', () => {
        const python = getByName('python');
        expect(python).not.toBeNull();
        expect(python.name).toBe('python');
    });

    it('应该能通过扩展名 .py 找到适配器', () => {
        const python = getByExtension('.py');
        expect(python).not.toBeNull();
        expect(python.name).toBe('python');
    });

    it('应该能通过扩展名 py 找到适配器（不带点）', () => {
        const python = getByExtension('py');
        expect(python).not.toBeNull();
        expect(python.name).toBe('python');
    });

    it('listAll 应该包含 python', () => {
        const all = listAll();
        expect(Array.isArray(all)).toBe(true);
        expect(all.some(a => a.name === 'python')).toBe(true);
    });
});
