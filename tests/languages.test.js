const BaseLanguageAdapter = require('../src/languages/base');
const CppAdapter = require('../src/languages/cpp');
const {
    LanguageRegistry,
    registry,
    register,
    getByName,
    getByExtension,
    listAll
} = require('../src/languages/index');

describe('BaseLanguageAdapter', () => {
    it('应该有 name 和 extensions 属性', () => {
        const adapter = new BaseLanguageAdapter();
        expect(adapter.name).toBe('');
        expect(Array.isArray(adapter.extensions)).toBe(true);
        expect(adapter.extensions.length).toBe(0);
    });

    it('compile 方法应该抛出 "not implemented"', async () => {
        const adapter = new BaseLanguageAdapter();
        await expect(adapter.compile('test.cpp', 'test.exe')).rejects.toThrow('not implemented');
    });

    it('run 方法应该抛出 "not implemented"', async () => {
        const adapter = new BaseLanguageAdapter();
        await expect(adapter.run('test.exe', 'in.txt', 'out.txt', 1000)).rejects.toThrow('not implemented');
    });

    it('cleanup 方法应该抛出 "not implemented"', () => {
        const adapter = new BaseLanguageAdapter();
        expect(() => adapter.cleanup('test.exe')).toThrow('not implemented');
    });

    it('detect 方法应该抛出 "not implemented"', async () => {
        const adapter = new BaseLanguageAdapter();
        await expect(adapter.detect()).rejects.toThrow('not implemented');
    });
});

describe('CppAdapter', () => {
    it('应该有正确的 name 和 extensions', () => {
        const adapter = new CppAdapter();
        expect(adapter.name).toBe('cpp');
        expect(adapter.extensions).toEqual(['.cpp', '.cc', '.cxx', '.c++']);
    });

    it('应该继承自 BaseLanguageAdapter', () => {
        const adapter = new CppAdapter();
        expect(adapter instanceof BaseLanguageAdapter).toBe(true);
    });

    describe('detect', () => {
        it('应该返回 detect 结果对象', async () => {
            const adapter = new CppAdapter();
            const result = await adapter.detect();
            expect(result).toBeDefined();
            expect(typeof result.available).toBe('boolean');
            expect(result).toHaveProperty('version');
            expect(result).toHaveProperty('path');
        });
    });

    describe('cleanup', () => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        it('文件不存在时应该返回 true', () => {
            const adapter = new CppAdapter();
            const result = adapter.cleanup('nonexistent-file.exe');
            expect(result).toBe(true);
        });

        it('应该成功删除存在的文件', () => {
            const adapter = new CppAdapter();
            const tempFile = path.join(os.tmpdir(), `ojtool-test-${Date.now()}.tmp`);
            fs.writeFileSync(tempFile, 'test');
            expect(fs.existsSync(tempFile)).toBe(true);
            const result = adapter.cleanup(tempFile);
            expect(result).toBe(true);
            expect(fs.existsSync(tempFile)).toBe(false);
        });

        it('executablePath 为空时应该返回 true', () => {
            const adapter = new CppAdapter();
            expect(adapter.cleanup(null)).toBe(true);
            expect(adapter.cleanup(undefined)).toBe(true);
            expect(adapter.cleanup('')).toBe(true);
        });

        it('删除失败时应该返回 false', () => {
            const adapter = new CppAdapter();
            const mockUnlink = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
                throw new Error('delete failed');
            });
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const result = adapter.cleanup('test.exe');
            expect(result).toBe(false);
            mockUnlink.mockRestore();
            mockExists.mockRestore();
        });
    });

    describe('compile', () => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        it('编译失败时应该返回 success: false', async () => {
            const adapter = new CppAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-cpp-test-'));
            const sourcePath = path.join(tempDir, 'test.cpp');
            const outputPath = path.join(tempDir, 'test.exe');

            fs.writeFileSync(sourcePath, 'int main() { invalid code }');

            const result = await adapter.compile(sourcePath, outputPath);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('编译成功时应该返回 success: true', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(null, 'compiled successfully', '');
                })
            }));
            jest.resetModules();
            const CppAdapterMocked = require('../src/languages/cpp');
            const adapter = new CppAdapterMocked();

            const result = await adapter.compile('test.cpp', 'test.exe', {
                gppPath: 'g++',
                cppVersion: 17,
                compileFlags: '-O2'
            });
            expect(result.success).toBe(true);
            expect(result.stdout).toBeDefined();
            expect(result.stderr).toBeDefined();

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('编译失败应该使用 stderr 作为错误信息', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('compile failed'), '', 'syntax error');
                })
            }));
            jest.resetModules();
            const CppAdapterMocked = require('../src/languages/cpp');
            const adapter = new CppAdapterMocked();

            const result = await adapter.compile('test.cpp', 'test.exe');
            expect(result.success).toBe(false);
            expect(result.error).toBe('syntax error');

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('编译失败且无 stderr 时使用 error.message', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('command not found'), '', '');
                })
            }));
            jest.resetModules();
            const CppAdapterMocked = require('../src/languages/cpp');
            const adapter = new CppAdapterMocked();

            const result = await adapter.compile('test.cpp', 'test.exe');
            expect(result.success).toBe(false);
            expect(result.error).toBe('command not found');

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

        it('可执行文件不存在时应该返回 RTE', async () => {
            const adapter = new CppAdapter();
            const result = await adapter.run(
                'nonexistent.exe',
                null,
                null,
                1000
            );
            expect(result.status).toBe('RTE');
            expect(result.timeMs).toBe(0);
            expect(result.error).toBeDefined();
        });

        it('进程非0退出应该返回 RTE', async () => {
            const adapter = new CppAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.exe', null, null, 1000);

            mockChild.stderr.emit('data', 'segmentation fault');
            mockChild.emit('close', 1);

            const result = await promise;
            expect(result.status).toBe('RTE');
            expect(result.error).toContain('segmentation fault');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
        });

        it('进程非0退出且无stderr时使用退出码', async () => {
            const adapter = new CppAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.exe', null, null, 1000);

            mockChild.emit('close', 127);

            const result = await promise;
            expect(result.status).toBe('RTE');
            expect(result.error).toContain('127');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
        });

        it('成功运行应该返回 AC', async () => {
            const adapter = new CppAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.exe', null, null, 1000);

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
            const adapter = new CppAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-run-test-'));
            const outputFile = path.join(tempDir, 'output.txt');
            const fakeExe = path.join(tempDir, 'fake.exe');
            fs.writeFileSync(fakeExe, 'fake');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);

            const promise = adapter.run(fakeExe, null, outputFile, 1000);

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
            const adapter = new CppAdapter();
            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
                throw new Error('write failed');
            });

            const promise = adapter.run('test.exe', null, 'output.txt', 1000);

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
            const adapter = new CppAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-run-test-'));
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

            const promise = adapter.run('test.exe', inputFile, null, 1000);

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
            const adapter = new CppAdapter();

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };
            mockChild.kill = jest.fn();

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run('test.exe', null, null, 1000);

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
    });

    describe('detect', () => {
        it('检测失败时应该返回 available: false', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('not found'), '', '');
                })
            }));
            jest.resetModules();
            const CppAdapterMocked = require('../src/languages/cpp');
            const adapter = new CppAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(false);
            expect(result.version).toBeNull();
            expect(result.path).toBeNull();

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('无法提取版本号时返回 unknown', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(null, 'g++ some weird version string\n', '');
                })
            }));
            jest.resetModules();
            const CppAdapterMocked = require('../src/languages/cpp');
            const adapter = new CppAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.version).toBe('unknown');
            expect(result.path).toBe('g++');

            jest.dontMock('child_process');
            jest.resetModules();
        });
    });
});

describe('LanguageRegistry', () => {
    describe('构造函数', () => {
        it('应该自动注册 CppAdapter', () => {
            const reg = new LanguageRegistry();
            const cppAdapter = reg.getByName('cpp');
            expect(cppAdapter).not.toBeNull();
            expect(cppAdapter.name).toBe('cpp');
        });
    });

    describe('register', () => {
        it('应该成功注册适配器', () => {
            const reg = new LanguageRegistry();
            const mockAdapter = { name: 'test', extensions: ['.test'] };
            reg.register(mockAdapter);
            const found = reg.getByName('test');
            expect(found).toBe(mockAdapter);
        });

        it('注册无效适配器应该抛出错误', () => {
            const reg = new LanguageRegistry();
            expect(() => reg.register(null)).toThrow();
            expect(() => reg.register({})).toThrow();
        });
    });

    describe('getByName', () => {
        it('应该按名称找到适配器', () => {
            const reg = new LanguageRegistry();
            const cpp = reg.getByName('cpp');
            expect(cpp).not.toBeNull();
            expect(cpp.name).toBe('cpp');
        });

        it('找不到时应该返回 null', () => {
            const reg = new LanguageRegistry();
            const result = reg.getByName('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('getByExtension', () => {
        it('应该按扩展名找到适配器（带点）', () => {
            const reg = new LanguageRegistry();
            const cpp = reg.getByExtension('.cpp');
            expect(cpp).not.toBeNull();
            expect(cpp.name).toBe('cpp');
        });

        it('应该按扩展名找到适配器（不带点）', () => {
            const reg = new LanguageRegistry();
            const cpp = reg.getByExtension('cpp');
            expect(cpp).not.toBeNull();
            expect(cpp.name).toBe('cpp');
        });

        it('应该支持 .cc 扩展名', () => {
            const reg = new LanguageRegistry();
            const cpp = reg.getByExtension('.cc');
            expect(cpp).not.toBeNull();
            expect(cpp.name).toBe('cpp');
        });

        it('应该支持 .cxx 扩展名', () => {
            const reg = new LanguageRegistry();
            const cpp = reg.getByExtension('.cxx');
            expect(cpp).not.toBeNull();
            expect(cpp.name).toBe('cpp');
        });

        it('找不到时应该返回 null', () => {
            const reg = new LanguageRegistry();
            const result = reg.getByExtension('.xyz');
            expect(result).toBeNull();
        });
    });

    describe('listAll', () => {
        it('应该返回所有已注册的适配器', () => {
            const reg = new LanguageRegistry();
            const all = reg.listAll();
            expect(Array.isArray(all)).toBe(true);
            expect(all.length).toBeGreaterThanOrEqual(2);
            expect(all.some(a => a.name === 'cpp')).toBe(true);
            expect(all.some(a => a.name === 'python')).toBe(true);
        });
    });
});

describe('导出的单例函数', () => {
    it('getByName 应该能找到 cpp', () => {
        const cpp = getByName('cpp');
        expect(cpp).not.toBeNull();
        expect(cpp.name).toBe('cpp');
    });

    it('getByExtension 应该能找到 cpp', () => {
        const cpp = getByExtension('.cpp');
        expect(cpp).not.toBeNull();
        expect(cpp.name).toBe('cpp');
    });

    it('listAll 应该返回数组', () => {
        const all = listAll();
        expect(Array.isArray(all)).toBe(true);
        expect(all.length).toBeGreaterThanOrEqual(1);
    });

    it('register 应该能注册新适配器', () => {
        const mockAdapter = { name: 'testlang', extensions: ['.tl'] };
        register(mockAdapter);
        const found = getByName('testlang');
        expect(found).toBe(mockAdapter);
    });

    it('registry 应该是 LanguageRegistry 实例', () => {
        expect(registry instanceof LanguageRegistry).toBe(true);
    });
});
