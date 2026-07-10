const fs = require('fs');
const path = require('path');
const os = require('os');

const originalCwd = process.cwd();
let tempDir;

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-test-'));
    process.chdir(tempDir);
    jest.clearAllMocks();
    jest.resetModules();
});

afterEach(() => {
    process.chdir(originalCwd);
    if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

console.error = jest.fn();
console.warn = jest.fn();

describe('judgeengine', () => {
    describe('shortStatusToFull', () => {
        it('应该将短状态码转换为完整状态字符串', () => {
            const { shortStatusToFull } = require('../src/core/judgeengine');
            expect(shortStatusToFull('AC')).toBe('Accepted');
            expect(shortStatusToFull('WA')).toBe('Wrong Answer');
            expect(shortStatusToFull('TLE')).toBe('Time Limit Exceeded');
            expect(shortStatusToFull('RTE')).toBe('Runtime Error');
            expect(shortStatusToFull('CE')).toBe('Compile Error');
            expect(shortStatusToFull('OLE')).toBe('Output Limit Exceeded');
            expect(shortStatusToFull('MLE')).toBe('Memory Limit Exceeded');
            expect(shortStatusToFull('UKE')).toBe('Unknown Error');
        });

        it('未知状态码应该原样返回', () => {
            const { shortStatusToFull } = require('../src/core/judgeengine');
            expect(shortStatusToFull('UNKNOWN')).toBe('UNKNOWN');
        });
    });

    describe('getStatusColor', () => {
        it('应该为每种状态返回对应的颜色函数', () => {
            const { getStatusColor } = require('../src/core/judgeengine');
            // 每个返回值应是 chalk 链式函数
            expect(typeof getStatusColor('Accepted')).toBe('function');
            expect(typeof getStatusColor('Wrong Answer')).toBe('function');
            expect(typeof getStatusColor('Time Limit Exceeded')).toBe('function');
            expect(typeof getStatusColor('Runtime Error')).toBe('function');
            expect(typeof getStatusColor('Compile Error')).toBe('function');
            expect(typeof getStatusColor('Memory Limit Exceeded')).toBe('function');
            expect(typeof getStatusColor('Output Limit Exceeded')).toBe('function');
            expect(typeof getStatusColor('Unknown Error')).toBe('function');
        });

        it('UKE 状态应返回 magentaBright（紫色违规标识）', () => {
            const { getStatusColor } = require('../src/core/judgeengine');
            const chalk = require('chalk');
            const expectedFn = chalk.magentaBright;
            const actualFn = getStatusColor('Unknown Error');
            // 在非 TTY 环境（如 CI/测试）下 chalk 可能不应用颜色，
            // 这里只校验返回的着色函数与预期的 chalk 函数一致
            expect(actualFn).toBe(expectedFn);
        });

        it('空状态应返回默认白色', () => {
            const { getStatusColor } = require('../src/core/judgeengine');
            expect(typeof getStatusColor('')).toBe('function');
            expect(typeof getStatusColor(null)).toBe('function');
            expect(typeof getStatusColor(undefined)).toBe('function');
        });
    });

    describe('createJsonLineParser', () => {
        it('应该创建初始状态正确的解析器', () => {
            const { createJsonLineParser } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            expect(state.buffer).toBe('');
            expect(state.results).toEqual({});
            expect(state.totalPlayers).toBe(0);
            expect(state.totalCases).toBe(0);
            expect(state.done).toBe(false);
            expect(state.errors).toEqual([]);
        });
    });

    describe('extractJsonLines', () => {
        it('应该从文本中提取 JSON 行', () => {
            const { extractJsonLines } = require('../src/core/judgeengine');
            const text = 'hello world\n{"type":"player_start","player":1}\nfoo bar\n{"type":"result","player":1,"case":1,"status":"AC","score":10}\n';
            const result = extractJsonLines(text);
            expect(result.length).toBe(2);
            expect(result[0].type).toBe('player_start');
            expect(result[0].player).toBe(1);
            expect(result[1].type).toBe('result');
            expect(result[1].case).toBe(1);
        });

        it('应该忽略无效的 JSON 行', () => {
            const { extractJsonLines } = require('../src/core/judgeengine');
            const text = '{"type":"valid"}\n{"type":"invalid json\n{"type":"also valid"}';
            const result = extractJsonLines(text);
            expect(result.length).toBe(2);
        });

        it('应该忽略非 JSON 行', () => {
            const { extractJsonLines } = require('../src/core/judgeengine');
            const text = '普通文本行\n另一个普通行\n{"type":"result"}\n';
            const result = extractJsonLines(text);
            expect(result.length).toBe(1);
            expect(result[0].type).toBe('result');
        });

        it('空文本应该返回空数组', () => {
            const { extractJsonLines } = require('../src/core/judgeengine');
            const result = extractJsonLines('');
            expect(result).toEqual([]);
        });
    });

    describe('processJsonObject - player_start', () => {
        it('应该处理 player_start 事件', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'player_start', player: 1 });
            expect(state.results.player1).toBeDefined();
            expect(state.results.player1.player).toBe(1);
            expect(state.results.player1.cases).toEqual([]);
        });

        it('重复的 player_start 不应该覆盖已有结果', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'player_start', player: 1 });
            state.results.player1.total = 100;
            processJsonObject(state, { type: 'player_start', player: 1 });
            expect(state.results.player1.total).toBe(100);
        });
    });

    describe('processJsonObject - result', () => {
        it('应该处理 result 事件并更新统计', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'result', player: 1, case: 1, status: 'AC', score: 10, timeMs: 50 });
            expect(state.results.player1.cases.length).toBe(1);
            expect(state.results.player1.cases[0].caseNum).toBe(1);
            expect(state.results.player1.cases[0].status).toBe('Accepted');
            expect(state.results.player1.cases[0].score).toBe(10);
            expect(state.results.player1.cases[0].passed).toBe(true);
            expect(state.results.player1.passed).toBe(1);
            expect(state.results.player1.failed).toBe(0);
            expect(state.results.player1.total).toBe(10);
        });

        it('应该正确处理未通过的测试用例', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'result', player: 1, case: 1, status: 'WA', score: 0, timeMs: 50 });
            expect(state.results.player1.cases[0].passed).toBe(false);
            expect(state.results.player1.passed).toBe(0);
            expect(state.results.player1.failed).toBe(1);
        });

        it('应该正确处理 UKE 状态（得 0 分，未通过）', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'result', player: 1, case: 1, status: 'UKE', score: 0, timeMs: 0 });
            expect(state.results.player1.cases[0].status).toBe('Unknown Error');
            expect(state.results.player1.cases[0].passed).toBe(false);
            expect(state.results.player1.cases[0].score).toBe(0);
            expect(state.results.player1.passed).toBe(0);
            expect(state.results.player1.failed).toBe(1);
            expect(state.results.player1.total).toBe(0);
        });

        it('UKE 状态应触发 onProgress 回调且 passed 为 false', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            state.totalCases = 1;
            state.totalPlayers = 1;
            const onProgress = jest.fn();
            processJsonObject(state, { type: 'result', player: 1, case: 1, status: 'UKE', score: 0 }, onProgress);
            expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
                status: 'Unknown Error',
                score: 0,
                passed: false
            }));
        });

        it('应该在没有 player_start 的情况下自动创建选手', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'result', player: 2, case: 1, status: 'AC', score: 10 });
            expect(state.results.player2).toBeDefined();
        });

        it('应该调用 onProgress 回调', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            state.totalCases = 3;
            state.totalPlayers = 2;
            const onProgress = jest.fn();
            processJsonObject(state, { type: 'result', player: 1, case: 2, status: 'TLE', score: 0 }, onProgress);
            expect(onProgress).toHaveBeenCalledWith({
                player: 1,
                case: 2,
                status: 'Time Limit Exceeded',
                score: 0,
                memoryKb: 0,
                totalCases: 3,
                totalPlayers: 2,
                totalSteps: 6,
                currentStep: 1,
                passed: false
            });
        });

        it('onProgress 回调异常不应该影响解析', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            const onProgress = jest.fn(() => { throw new Error('callback error'); });
            expect(() => {
                processJsonObject(state, { type: 'result', player: 1, case: 1, status: 'AC', score: 10 }, onProgress);
            }).not.toThrow();
            expect(state.results.player1.cases.length).toBe(1);
        });
    });

    describe('processJsonObject - player_end', () => {
        it('应该处理 player_end 事件', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'player_start', player: 1 });
            processJsonObject(state, { type: 'player_end', player: 1, totalScore: 30, maxScore: 50 });
            expect(state.results.player1.total).toBe(30);
            expect(state.results.player1.maxScore).toBe(50);
        });

        it('应该在没有 player_start 的情况下自动创建选手', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'player_end', player: 3, totalScore: 20, maxScore: 40 });
            expect(state.results.player3).toBeDefined();
            expect(state.results.player3.total).toBe(20);
        });
    });

    describe('processJsonObject - done', () => {
        it('应该处理 done 事件', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            processJsonObject(state, { type: 'done', playerCount: 5 });
            expect(state.done).toBe(true);
            expect(state.totalPlayers).toBe(5);
        });
    });

    describe('processJsonObject - 未知类型', () => {
        it('应该忽略未知类型的 JSON', () => {
            const { createJsonLineParser, processJsonObject } = require('../src/core/judgeengine');
            const state = createJsonLineParser();
            expect(() => {
                processJsonObject(state, { type: 'unknown', data: 'test' });
            }).not.toThrow();
            expect(Object.keys(state.results).length).toBe(0);
        });
    });

    describe('parseJsonLines', () => {
        it('应该解析完整的评测输出', () => {
            const { parseJsonLines } = require('../src/core/judgeengine');
            const stdout = `
一些无关输出
{"type":"player_start","player":1}
{"type":"result","player":1,"case":1,"status":"AC","score":10,"timeMs":50}
{"type":"result","player":1,"case":2,"status":"WA","score":0,"timeMs":30}
{"type":"result","player":1,"case":3,"status":"AC","score":10,"timeMs":40}
{"type":"player_end","player":1,"totalScore":20,"maxScore":30}
{"type":"player_start","player":2}
{"type":"result","player":2,"case":1,"status":"CE","score":0,"timeMs":0}
{"type":"result","player":2,"case":2,"status":"CE","score":0,"timeMs":0}
{"type":"result","player":2,"case":3,"status":"CE","score":0,"timeMs":0}
{"type":"player_end","player":2,"totalScore":0,"maxScore":30}
{"type":"done","playerCount":2}
更多无关输出
`;
            const result = parseJsonLines(stdout, { testCaseCount: 3, playerCount: 2 });

            expect(result.done).toBe(true);
            expect(result.totalPlayers).toBe(2);
            expect(result.results.player1).toBeDefined();
            expect(result.results.player2).toBeDefined();

            const p1 = result.results.player1;
            expect(p1.player).toBe(1);
            expect(p1.total).toBe(20);
            expect(p1.maxScore).toBe(30);
            expect(p1.cases.length).toBe(3);
            expect(p1.passed).toBe(2);
            expect(p1.failed).toBe(1);

            const p2 = result.results.player2;
            expect(p2.player).toBe(2);
            expect(p2.total).toBe(0);
            expect(p2.maxScore).toBe(30);
            expect(p2.cases.length).toBe(3);
            expect(p2.passed).toBe(0);
            expect(p2.failed).toBe(3);
        });

        it('应该正确解析 UKE 状态（含违规源码）', () => {
            const { parseJsonLines } = require('../src/core/judgeengine');
            const stdout = `
{"type":"player_start","player":1}
{"type":"result","player":1,"case":1,"status":"UKE","score":0,"timeMs":0}
{"type":"result","player":1,"case":2,"status":"UKE","score":0,"timeMs":0}
{"type":"player_end","player":1,"totalScore":0,"maxScore":20}
{"type":"done","playerCount":1}
`;
            const result = parseJsonLines(stdout, { testCaseCount: 2, playerCount: 1 });

            expect(result.done).toBe(true);
            const p1 = result.results.player1;
            expect(p1.cases.length).toBe(2);
            expect(p1.cases[0].status).toBe('Unknown Error');
            expect(p1.cases[1].status).toBe('Unknown Error');
            expect(p1.cases[0].passed).toBe(false);
            expect(p1.passed).toBe(0);
            expect(p1.failed).toBe(2);
            expect(p1.total).toBe(0);
        });

        it('应该在没有 player_end 时计算 maxScore', () => {
            const { parseJsonLines } = require('../src/core/judgeengine');
            const stdout = `
{"type":"result","player":1,"case":1,"status":"AC","score":10}
{"type":"result","player":1,"case":2,"status":"AC","score":10}
`;
            const result = parseJsonLines(stdout);
            expect(result.results.player1.maxScore).toBe(20);
        });

        it('应该调用 onProgress 回调', () => {
            const { parseJsonLines } = require('../src/core/judgeengine');
            const stdout = `
{"type":"result","player":1,"case":1,"status":"AC","score":10}
{"type":"result","player":1,"case":2,"status":"WA","score":0}
`;
            const onProgress = jest.fn();
            parseJsonLines(stdout, { onProgress, testCaseCount: 2, playerCount: 1 });
            expect(onProgress).toHaveBeenCalledTimes(2);
        });

        it('空输出应该返回空结果', () => {
            const { parseJsonLines } = require('../src/core/judgeengine');
            const result = parseJsonLines('');
            expect(result.results).toEqual({});
            expect(result.done).toBe(false);
        });
    });

    describe('createStreamingJsonParser', () => {
        it('应该支持流式输入和分块数据', () => {
            const { createStreamingJsonParser } = require('../src/core/judgeengine');
            const parser = createStreamingJsonParser();

            const chunk1 = '{"type":"player_start","player":1}\n{"type":"result","play';
            const chunk2 = 'er":1,"case":1,"status":"AC","score":10}\n{"type":"don';
            const chunk3 = 'e","playerCount":1}\n';

            parser.feed(chunk1);
            parser.feed(chunk2);
            parser.feed(chunk3);
            parser.finalize();

            const results = parser.getResults();
            expect(results.player1).toBeDefined();
            expect(results.player1.cases.length).toBe(1);
            expect(parser.isDone()).toBe(true);
        });

        it('应该正确处理被截断的行', () => {
            const { createStreamingJsonParser } = require('../src/core/judgeengine');
            const parser = createStreamingJsonParser();

            parser.feed('{"type":"player_start","player":1}\n{"type":"result"');
            parser.feed(',"player":1,"case":1,"status":"AC","score":10}\n');
            parser.finalize();

            const results = parser.getResults();
            expect(results.player1.cases.length).toBe(1);
        });

        it('finalize 应该处理最后一行没有换行符的情况', () => {
            const { createStreamingJsonParser } = require('../src/core/judgeengine');
            const parser = createStreamingJsonParser();

            parser.feed('{"type":"player_start","player":1}\n{"type":"done","playerCount":1}');
            parser.finalize();

            expect(parser.isDone()).toBe(true);
        });

        it('应该支持 onProgress 回调', () => {
            const { createStreamingJsonParser } = require('../src/core/judgeengine');
            const onProgress = jest.fn();
            const parser = createStreamingJsonParser({
                onProgress,
                testCaseCount: 2,
                playerCount: 1
            });

            parser.feed('{"type":"result","player":1,"case":1,"status":"AC","score":10}\n');
            parser.finalize();

            expect(onProgress).toHaveBeenCalledTimes(1);
            expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
                player: 1,
                case: 1,
                totalCases: 2,
                totalPlayers: 1
            }));
        });
    });

    describe('parseResultFile (向后兼容)', () => {
        it('应该正确解析旧格式的结果文件', () => {
            const { parseResultFile } = require('../src/core/judgeengine');
            const content = `Player 1
1 10 Accepted
2 0 Wrong Answer
3 10 Accepted
20`;
            const result = parseResultFile(content, 1);
            expect(result.player).toBe(1);
            expect(result.total).toBe(20);
            expect(result.cases.length).toBe(3);
            expect(result.passed).toBe(2);
            expect(result.failed).toBe(1);
        });

        it('没有总分行时应该自动计算总分', () => {
            const { parseResultFile } = require('../src/core/judgeengine');
            const content = `Player 1
1 10 Accepted
2 10 Accepted`;
            const result = parseResultFile(content, 1);
            expect(result.total).toBe(20);
        });
    });

    describe('结果对象结构一致性', () => {
        it('JSON 解析和文件解析应该产生相同结构的结果', () => {
            const { parseJsonLines, parseResultFile } = require('../src/core/judgeengine');

            const jsonStdout = `
{"type":"player_start","player":1}
{"type":"result","player":1,"case":1,"status":"AC","score":10}
{"type":"result","player":1,"case":2,"status":"WA","score":0}
{"type":"player_end","player":1,"totalScore":10,"maxScore":20}
`;
            const jsonResult = parseJsonLines(jsonStdout).results.player1;

            const fileContent = `Player 1
1 10 Accepted
2 0 Wrong Answer
10`;
            const fileResult = parseResultFile(fileContent, 1);

            expect(Object.keys(jsonResult)).toEqual(expect.arrayContaining(Object.keys(fileResult)));
            expect(jsonResult.player).toBe(fileResult.player);
            expect(jsonResult.total).toBe(fileResult.total);
            expect(jsonResult.maxScore).toBe(fileResult.maxScore);
            expect(jsonResult.passed).toBe(fileResult.passed);
            expect(jsonResult.failed).toBe(fileResult.failed);
            expect(jsonResult.cases.length).toBe(fileResult.cases.length);

            for (let i = 0; i < jsonResult.cases.length; i++) {
                expect(Object.keys(jsonResult.cases[i])).toEqual(expect.arrayContaining(Object.keys(fileResult.cases[i])));
                expect(jsonResult.cases[i].caseNum).toBe(fileResult.cases[i].caseNum);
                expect(jsonResult.cases[i].score).toBe(fileResult.cases[i].score);
                expect(jsonResult.cases[i].passed).toBe(fileResult.cases[i].passed);
            }
        });
    });

    describe('parseResults (向后兼容)', () => {
        it('应该解析所有选手的结果文件', () => {
            const { parseResults } = require('../src/core/judgeengine');
            const config = { problemPrefix: 'problem' };

            for (let i = 1; i <= 2; i++) {
                const playerDir = path.join(tempDir, String(i));
                fs.mkdirSync(playerDir, { recursive: true });
                const resultFile = path.join(playerDir, 'problem_out.txt');
                fs.writeFileSync(resultFile, `Player ${i}\n1 10 Accepted\n2 0 Wrong Answer\n10\n`);
            }

            const results = parseResults(config, 2, tempDir);
            expect(results.player1).toBeDefined();
            expect(results.player2).toBeDefined();
            expect(results.player1.total).toBe(10);
            expect(results.player2.total).toBe(10);
        });

        it('结果文件不存在时应该返回错误对象', () => {
            const { parseResults } = require('../src/core/judgeengine');
            const config = { problemPrefix: 'problem' };

            const results = parseResults(config, 1, tempDir);
            expect(results.player1).toBeDefined();
            expect(results.player1.error).toBeDefined();
        });

        it('结果文件读取失败时应该返回错误对象', () => {
            const { parseResults } = require('../src/core/judgeengine');
            const config = { problemPrefix: 'problem' };

            const playerDir = path.join(tempDir, '1');
            fs.mkdirSync(playerDir, { recursive: true });
            const resultFile = path.join(playerDir, 'problem_out.txt');
            fs.writeFileSync(resultFile, 'test content');

            const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
                throw new Error('read error');
            });

            const results = parseResults(config, 1, tempDir);
            expect(results.player1.error).toBeDefined();

            readFileSyncSpy.mockRestore();
        });
    });

    describe('cleanupTempFiles (向后兼容)', () => {
        it('应该清理临时文件', () => {
            const { cleanupTempFiles } = require('../src/core/judgeengine');
            const config = { problemPrefix: 'problem' };

            for (let i = 1; i <= 2; i++) {
                const playerDir = path.join(tempDir, String(i));
                fs.mkdirSync(playerDir, { recursive: true });
                const exeFile = path.join(playerDir, 'problem.exe');
                const outFile = path.join(playerDir, 'problem.out');
                fs.writeFileSync(exeFile, 'fake exe');
                fs.writeFileSync(outFile, 'fake out');
            }

            cleanupTempFiles(config, 2, tempDir);

            for (let i = 1; i <= 2; i++) {
                const playerDir = path.join(tempDir, String(i));
                const exeFile = path.join(playerDir, 'problem.exe');
                const outFile = path.join(playerDir, 'problem.out');
                expect(fs.existsSync(exeFile)).toBe(false);
                expect(fs.existsSync(outFile)).toBe(false);
            }
        });

        it('文件不存在时不应该报错', () => {
            const { cleanupTempFiles } = require('../src/core/judgeengine');
            const config = { problemPrefix: 'problem' };

            expect(() => {
                cleanupTempFiles(config, 1, tempDir);
            }).not.toThrow();
        });
    });

    describe('getJudgerPath', () => {
        it('应该返回评测机路径', () => {
            const { getJudgerPath } = require('../src/core/judgeengine');
            const judgerPath = getJudgerPath();
            expect(typeof judgerPath).toBe('string');
            expect(judgerPath.endsWith('judger.exe')).toBe(true);
        });
    });

    describe('isPathSafe (通过 runJudge 间接测试)', () => {
        it('应该拒绝包含 .. 的路径', async () => {
            const { runJudge } = require('../src/core/judgeengine');
            const config = { playerCount: 1, testCaseCount: 1, timeLimitMs: 1000 };

            await expect(runJudge(config, {
                basePath: '../unsafe',
                verbose: false
            })).rejects.toThrow();
        });
    });

    describe('printResultSummary', () => {
        it('应该打印结果摘要', () => {
            const { printResultSummary } = require('../src/core/judgeengine');
            const results = {
                player1: {
                    player: 1,
                    total: 20,
                    maxScore: 30,
                    cases: [
                        { caseNum: 1, score: 10, status: 'Accepted', passed: true },
                        { caseNum: 2, score: 10, status: 'Accepted', passed: true },
                        { caseNum: 3, score: 0, status: 'Wrong Answer', passed: false }
                    ],
                    passed: 2,
                    failed: 1
                },
                player2: {
                    player: 2,
                    total: 0,
                    maxScore: 30,
                    cases: [
                        { caseNum: 1, score: 0, status: 'Compile Error', passed: false },
                        { caseNum: 2, score: 0, status: 'Compile Error', passed: false },
                        { caseNum: 3, score: 0, status: 'Compile Error', passed: false }
                    ],
                    passed: 0,
                    failed: 3
                },
                player3: {
                    player: 3,
                    error: '结果文件不存在'
                }
            };

            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            printResultSummary(results);
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        it('含 UKE 状态的选手应该正常打印（不抛异常）', () => {
            const { printResultSummary } = require('../src/core/judgeengine');
            const results = {
                player1: {
                    player: 1,
                    total: 0,
                    maxScore: 20,
                    cases: [
                        { caseNum: 1, score: 0, status: 'Unknown Error', passed: false },
                        { caseNum: 2, score: 0, status: 'Unknown Error', passed: false }
                    ],
                    passed: 0,
                    failed: 2
                }
            };

            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            expect(() => printResultSummary(results)).not.toThrow();
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });
    });

    describe('getDetailedResult', () => {
        it('应该返回详细结果字符串', () => {
            const { getDetailedResult } = require('../src/core/judgeengine');
            const playerResult = {
                player: 1,
                total: 20,
                maxScore: 30,
                cases: [
                    { caseNum: 1, score: 10, status: 'Accepted', passed: true },
                    { caseNum: 2, score: 0, status: 'Wrong Answer', passed: false }
                ],
                passed: 1,
                failed: 1
            };

            const result = getDetailedResult(playerResult);
            expect(result).toContain('Player 1');
            expect(result).toContain('测试点 1');
            expect(result).toContain('测试点 2');
            expect(result).toContain('Accepted');
            expect(result).toContain('Wrong Answer');
            expect(result).toContain('20/30');
        });

        it('有错误时应该返回错误信息', () => {
            const { getDetailedResult } = require('../src/core/judgeengine');
            const playerResult = {
                player: 1,
                error: '结果文件不存在'
            };

            const result = getDetailedResult(playerResult);
            expect(result).toContain('错误');
            expect(result).toContain('结果文件不存在');
        });
    });
});
