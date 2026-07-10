const BaseLanguageAdapter = require('../src/languages/base');
const JavaAdapter = require('../src/languages/java');
const { getByName, getByExtension, listAll } = require('../src/languages/index');
const fs = require('fs');
const path = require('path');
const os = require('os');

let javaAvailable = false;

beforeAll(async () => {
    const adapter = new JavaAdapter();
    const result = await adapter.detect();
    javaAvailable = result.available && result.javacPath;
});

describe('JavaAdapter', () => {
    it('应该有正确的 name 和 extensions', () => {
        const adapter = new JavaAdapter();
        expect(adapter.name).toBe('java');
        expect(adapter.extensions).toEqual(['.java']);
    });

    it('应该继承自 BaseLanguageAdapter', () => {
        const adapter = new JavaAdapter();
        expect(adapter instanceof BaseLanguageAdapter).toBe(true);
    });

    describe('extractMainClass', () => {
        it('应该从 public class 提取类名', () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-test-'));
            const sourcePath = path.join(tempDir, 'Test.java');
            fs.writeFileSync(sourcePath, 'public class Test { public static void main(String[] args) {} }');

            const className = adapter.extractMainClass(sourcePath);
            expect(className).toBe('Test');

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('没有 public class 时返回 Main', () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-test-'));
            const sourcePath = path.join(tempDir, 'Test.java');
            fs.writeFileSync(sourcePath, 'class Foo { public static void main(String[] args) {} }');

            const className = adapter.extractMainClass(sourcePath);
            expect(className).toBe('Main');

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('文件不存在时返回 Main', () => {
            const adapter = new JavaAdapter();
            const className = adapter.extractMainClass('/nonexistent/path/Test.java');
            expect(className).toBe('Main');
        });
    });

    describe('detect', () => {
        it('应该返回 detect 结果对象', async () => {
            const adapter = new JavaAdapter();
            const result = await adapter.detect();
            expect(result).toBeDefined();
            expect(typeof result.available).toBe('boolean');
            expect(result).toHaveProperty('version');
            expect(result).toHaveProperty('path');
            expect(result).toHaveProperty('javacPath');
        });

        it('检测失败时应该返回 available: false', async () => {
            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('not found'), '', '');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const JavaAdapterMocked = require('../src/languages/java');
            const adapter = new JavaAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(false);
            expect(result.version).toBeNull();
            expect(result.path).toBeNull();
            expect(result.javacPath).toBeNull();

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('java 可用但 javac 不可用时仍返回 available: true', async () => {
            jest.mock('child_process', () => {
                const mockExecImpl = (cmd, callback) => {
                    if (cmd.includes('java') && !cmd.includes('javac')) {
                        callback(null, '', 'java version "11.0.12"');
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
            const JavaAdapterMocked = require('../src/languages/java');
            const adapter = new JavaAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.javacPath).toBeNull();

            jest.dontMock('child_process');
            jest.resetModules();
        });

        it('无法提取版本号时返回 unknown', async () => {
            jest.mock('child_process', () => {
                const mockExecImpl = (cmd, callback) => {
                    callback(null, '', 'some weird output');
                };
                return {
                    exec: jest.fn(mockExecImpl),
                    spawn: jest.fn()
                };
            });
            jest.resetModules();
            const JavaAdapterMocked = require('../src/languages/java');
            const adapter = new JavaAdapterMocked();

            const result = await adapter.detect();
            expect(result.available).toBe(true);
            expect(result.version).toBe('unknown');

            jest.dontMock('child_process');
            jest.resetModules();
        });
    });

    describe('cleanup', () => {
        it('文件不存在时应该返回 true', () => {
            const adapter = new JavaAdapter();
            expect(adapter.cleanup('nonexistent.class')).toBe(true);
            expect(adapter.cleanup(null)).toBe(true);
            expect(adapter.cleanup(undefined)).toBe(true);
            expect(adapter.cleanup('')).toBe(true);
        });

        it('文件存在时应该删除并返回 true', () => {
            const adapter = new JavaAdapter();

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-cleanup-'));
            const testFile = path.join(tempDir, 'test.class');
            fs.writeFileSync(testFile, 'test');

            expect(fs.existsSync(testFile)).toBe(true);
            const result = adapter.cleanup(testFile);
            expect(result).toBe(true);
            expect(fs.existsSync(testFile)).toBe(false);

            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });

    describe('compile', () => {
        it('语法错误时应该返回 success: false', async () => {
            if (!javaAvailable) {
                console.log('跳过: Java 不可用');
                return;
            }
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-compile-test-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            const outputDir = path.join(tempDir, 'out');

            fs.writeFileSync(sourcePath, 'public class Main { invalid syntax }');

            const result = await adapter.compile(sourcePath, outputDir);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('语法正确时应该返回 success: true', async () => {
            if (!javaAvailable) {
                console.log('跳过: Java 不可用');
                return;
            }
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-compile-test-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            const outputDir = path.join(tempDir, 'out');

            fs.writeFileSync(sourcePath, 'public class Main { public static void main(String[] args) { System.out.println("hello"); } }');

            const result = await adapter.compile(sourcePath, outputDir);
            expect(result.success).toBe(true);
            expect(result.mainClass).toBe('Main');
            expect(fs.existsSync(path.join(outputDir, 'Main.class'))).toBe(true);

            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('编译失败时应该使用 stderr 作为错误信息', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-mock-test-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            const outputDir = path.join(tempDir, 'out');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('compile failed'), '', 'SyntaxError: expected');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const JavaAdapterMocked = require('../src/languages/java');
            const adapter = new JavaAdapterMocked();

            const result = await adapter.compile(sourcePath, outputDir);
            expect(result.success).toBe(false);
            expect(result.error).toBe('SyntaxError: expected');

            jest.dontMock('child_process');
            jest.resetModules();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('编译失败且无 stderr 时使用 error.message', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-mock-test-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            const outputDir = path.join(tempDir, 'out');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(new Error('command not found'), '', '');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const JavaAdapterMocked = require('../src/languages/java');
            const adapter = new JavaAdapterMocked();

            const result = await adapter.compile(sourcePath, outputDir);
            expect(result.success).toBe(false);
            expect(result.error).toBe('command not found');

            jest.dontMock('child_process');
            jest.resetModules();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('编译成功时应该返回 stdout 和 stderr', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-mock-test-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            const outputDir = path.join(tempDir, 'out');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            jest.mock('child_process', () => ({
                exec: jest.fn((cmd, callback) => {
                    callback(null, 'compiled', 'warning');
                }),
                spawn: jest.fn()
            }));
            jest.resetModules();
            const JavaAdapterMocked = require('../src/languages/java');
            const adapter = new JavaAdapterMocked();

            const result = await adapter.compile(sourcePath, outputDir);
            expect(result.success).toBe(true);
            expect(result.stdout).toBeDefined();
            expect(result.stderr).toBeDefined();

            jest.dontMock('child_process');
            jest.resetModules();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });

    describe('run', () => {
        const childProcess = require('child_process');
        const { EventEmitter } = require('events');

        beforeEach(() => {
            jest.restoreAllMocks();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('Java 不存在时应该返回 RTE', async () => {
            const adapter = new JavaAdapter();
            const result = await adapter.run(
                'Main.java',
                null,
                null,
                1000,
                { javaPath: 'nonexistent_java_xyz', classDir: '/tmp', mainClass: 'Main' }
            );
            expect(result.status).toBe('RTE');
            expect(result.timeMs).toBe(0);
            expect(result.error).toBeDefined();
        });

        it('进程非0退出应该返回 RTE', async () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-mock-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run(sourcePath, null, null, 1000, { classDir: tempDir, mainClass: 'Main' });

            mockChild.stderr.emit('data', 'Exception in thread "main"');
            mockChild.emit('close', 1);

            const result = await promise;
            expect(result.status).toBe('RTE');
            expect(result.error).toContain('Exception');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('进程非0退出且无stderr时使用退出码', async () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-mock-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run(sourcePath, null, null, 1000, { classDir: tempDir, mainClass: 'Main' });

            mockChild.emit('close', 127);

            const result = await promise;
            expect(result.status).toBe('RTE');
            expect(result.error).toContain('127');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('成功运行应该返回 AC', async () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-mock-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run(sourcePath, null, null, 1000, { classDir: tempDir, mainClass: 'Main' });

            mockChild.stdout.emit('data', 'hello world');
            mockChild.emit('close', 0);

            const result = await promise;
            expect(result.status).toBe('AC');
            expect(result.output).toBe('hello world');
            expect(result.timeMs).toBeGreaterThanOrEqual(0);

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('指定 outputFile 时应该写入输出文件', async () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-test-'));
            const outputFile = path.join(tempDir, 'output.txt');
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);

            const promise = adapter.run(sourcePath, null, outputFile, 1000, { classDir: tempDir, mainClass: 'Main' });

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
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-mock-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
                throw new Error('write failed');
            });

            const promise = adapter.run(sourcePath, null, 'output.txt', 1000, { classDir: tempDir, mainClass: 'Main' });

            mockChild.stdout.emit('data', 'test');
            mockChild.emit('close', 0);

            const result = await promise;
            expect(result.status).toBe('OLE');
            expect(result.error).toBe('Output Limit Exceeded');

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            mockWrite.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('有输入文件时应该从文件读取输入', async () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-test-'));
            const inputFile = path.join(tempDir, 'input.txt');
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');
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

            const promise = adapter.run(sourcePath, inputFile, null, 1000, { classDir: tempDir, mainClass: 'Main' });

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
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-mock-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };
            mockChild.kill = jest.fn();

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run(sourcePath, null, null, 1000, { classDir: tempDir, mainClass: 'Main' });

            jest.advanceTimersByTime(1000);

            mockChild.emit('close', -1);

            const result = await promise;
            expect(result.status).toBe('TLE');
            expect(result.timeMs).toBe(1000);
            expect(result.error).toBe('Time Limit Exceeded');
            expect(mockChild.kill).toHaveBeenCalled();

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            jest.useRealTimers();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('输出超出限制应该返回 OLE', async () => {
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-run-mock-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            fs.writeFileSync(sourcePath, 'public class Main {}');

            const mockChild = new EventEmitter();
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.stdin = { write: jest.fn(), end: jest.fn() };
            mockChild.kill = jest.fn();

            const mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
            const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const promise = adapter.run(sourcePath, null, null, 1000, { classDir: tempDir, mainClass: 'Main', outputLimitKb: 0.001 });

            mockChild.stdout.emit('data', 'a'.repeat(100));
            mockChild.emit('close', -1);

            const result = await promise;
            expect(result.status).toBe('OLE');
            expect(result.error).toBe('Output Limit Exceeded');
            expect(mockChild.kill).toHaveBeenCalled();

            mockSpawn.mockRestore();
            mockExists.mockRestore();
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('实际运行 Java 程序应该成功', async () => {
            if (!javaAvailable) {
                console.log('跳过: Java 不可用');
                return;
            }
            const adapter = new JavaAdapter();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-java-real-test-'));
            const sourcePath = path.join(tempDir, 'Main.java');
            const classDir = tempDir;
            const inputFile = path.join(tempDir, 'input.txt');
            const outputFile = path.join(tempDir, 'output.txt');

            fs.writeFileSync(sourcePath, `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.next();
        System.out.println("Hello, " + name + "!");
        sc.close();
    }
}
            `);
            fs.writeFileSync(inputFile, 'World');

            const compileResult = await adapter.compile(sourcePath, classDir);
            expect(compileResult.success).toBe(true);

            const result = await adapter.run(sourcePath, inputFile, outputFile, 5000, {
                classDir: classDir,
                mainClass: 'Main'
            });
            expect(result.status).toBe('AC');
            expect(result.timeMs).toBeGreaterThanOrEqual(0);
            expect(fs.existsSync(outputFile)).toBe(true);
            expect(fs.readFileSync(outputFile, 'utf-8').trim()).toBe('Hello, World!');

            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });
});

describe('Java 语言注册', () => {
    it('应该能通过名称找到 java 适配器', () => {
        const java = getByName('java');
        expect(java).not.toBeNull();
        expect(java.name).toBe('java');
    });

    it('应该能通过扩展名 .java 找到适配器', () => {
        const java = getByExtension('.java');
        expect(java).not.toBeNull();
        expect(java.name).toBe('java');
    });

    it('应该能通过扩展名 java 找到适配器（不带点）', () => {
        const java = getByExtension('java');
        expect(java).not.toBeNull();
        expect(java.name).toBe('java');
    });

    it('listAll 应该包含 java', () => {
        const all = listAll();
        expect(Array.isArray(all)).toBe(true);
        expect(all.some(a => a.name === 'java')).toBe(true);
    });
});
