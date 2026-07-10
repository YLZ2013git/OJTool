const fs = require('fs');
const path = require('path');
const os = require('os');

const originalCwd = process.cwd();
let tempDir;

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-contest-test-'));
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
console.log = jest.fn();

describe('contest - configmanager', () => {
    describe('validateProblem', () => {
        it('应该验证正确的题目配置', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 10 };
            const result = validateProblem(problem, 0);
            expect(result.valid).toBe(true);
        });

        it('应该检测缺少 name 的题目', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const problem = { testCaseCount: 10 };
            const result = validateProblem(problem, 0);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('name');
        });

        it('应该检测缺少 testCaseCount 的题目', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const problem = { name: 'A' };
            const result = validateProblem(problem, 0);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('testCaseCount');
        });

        it('应该检测无效的题目对象', () => {
            const { validateProblem } = require('../src/core/configmanager');
            const result = validateProblem(null, 0);
            expect(result.valid).toBe(false);
        });
    });

    describe('isContestMode', () => {
        it('有 problems 数组时应该返回 true', () => {
            const { isContestMode } = require('../src/core/configmanager');
            const config = { problems: [{ name: 'A', testCaseCount: 10 }] };
            expect(isContestMode(config)).toBe(true);
        });

        it('没有 problems 时应该返回 false', () => {
            const { isContestMode } = require('../src/core/configmanager');
            const config = {};
            expect(isContestMode(config)).toBe(false);
        });

        it('problems 为空数组时应该返回 false', () => {
            const { isContestMode } = require('../src/core/configmanager');
            const config = { problems: [] };
            expect(isContestMode(config)).toBe(false);
        });

        it('problems 不是数组时应该返回 false', () => {
            const { isContestMode } = require('../src/core/configmanager');
            const config = { problems: 'not-an-array' };
            expect(isContestMode(config)).toBe(false);
        });

        it('config 为 null/undefined 时应该返回 false', () => {
            const { isContestMode } = require('../src/core/configmanager');
            expect(isContestMode(null)).toBe(false);
            expect(isContestMode(undefined)).toBe(false);
        });
    });

    describe('getProblemConfig', () => {
        it('应该合并全局默认值', () => {
            const { getProblemConfig } = require('../src/core/configmanager');
            const problem = { name: 'A', testCaseCount: 5 };
            const globalConfig = {
                timeLimitMs: 2000,
                scorePerCase: 20
            };
            const result = getProblemConfig(problem, globalConfig);
            expect(result.name).toBe('A');
            expect(result.prefix).toBe('A');
            expect(result.testCaseCount).toBe(5);
            expect(result.timeLimitMs).toBe(2000);
            expect(result.scorePerCase).toBe(20);
        });

        it('题目自定义值应该覆盖全局值', () => {
            const { getProblemConfig } = require('../src/core/configmanager');
            const problem = {
                name: 'B',
                prefix: 'prob_b',
                testCaseCount: 3,
                timeLimitMs: 5000,
                scorePerCase: 50
            };
            const globalConfig = {
                timeLimitMs: 2000,
                scorePerCase: 20
            };
            const result = getProblemConfig(problem, globalConfig);
            expect(result.name).toBe('B');
            expect(result.prefix).toBe('prob_b');
            expect(result.testCaseCount).toBe(3);
            expect(result.timeLimitMs).toBe(5000);
            expect(result.scorePerCase).toBe(50);
        });
    });

    describe('validateConfig with problems', () => {
        it('应该验证包含 problems 的配置', () => {
            const { validateConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const config = {
                ...DEFAULT_CONFIG,
                problems: [
                    { name: 'A', testCaseCount: 10 },
                    { name: 'B', testCaseCount: 5 }
                ]
            };
            const result = validateConfig(config);
            expect(result.valid).toBe(true);
        });

        it('应该检测 problems 中无效的题目', () => {
            const { validateConfig, DEFAULT_CONFIG } = require('../src/core/configmanager');
            const config = {
                ...DEFAULT_CONFIG,
                problems: [
                    { name: 'A', testCaseCount: 10 },
                    { name: 'B' }
                ]
            };
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('testCaseCount');
        });
    });
});

describe('contest - contestengine', () => {
    describe('isProblemSolved', () => {
        it('所有测试点通过时应该返回 true', () => {
            const { isProblemSolved } = require('../src/core/contestengine');
            const result = {
                cases: [
                    { passed: true },
                    { passed: true },
                    { passed: true }
                ]
            };
            expect(isProblemSolved(result)).toBe(true);
        });

        it('有测试点未通过时应该返回 false', () => {
            const { isProblemSolved } = require('../src/core/contestengine');
            const result = {
                cases: [
                    { passed: true },
                    { passed: false },
                    { passed: true }
                ]
            };
            expect(isProblemSolved(result)).toBe(false);
        });

        it('没有测试点时应该返回 false', () => {
            const { isProblemSolved } = require('../src/core/contestengine');
            expect(isProblemSolved({ cases: [] })).toBe(false);
            expect(isProblemSolved({})).toBe(false);
            expect(isProblemSolved(null)).toBe(false);
        });
    });

    describe('getProblemStatus', () => {
        it('全部通过时应该返回 AC', () => {
            const { getProblemStatus } = require('../src/core/contestengine');
            const result = {
                cases: [
                    { passed: true },
                    { passed: true }
                ]
            };
            expect(getProblemStatus(result)).toBe('AC');
        });

        it('未全部通过时应该返回 WA', () => {
            const { getProblemStatus } = require('../src/core/contestengine');
            const result = {
                cases: [
                    { passed: true },
                    { passed: false }
                ]
            };
            expect(getProblemStatus(result)).toBe('WA');
        });

        it('未提交时应该返回 NS', () => {
            const { getProblemStatus } = require('../src/core/contestengine');
            expect(getProblemStatus(null, false)).toBe('NS');
        });
    });

    describe('calculateRanking', () => {
        it('应该按总分降序排列', () => {
            const { calculateRanking } = require('../src/core/contestengine');
            const players = [
                { id: 1, totalScore: 100, solvedCount: 3, problems: [] },
                { id: 2, totalScore: 200, solvedCount: 4, problems: [] },
                { id: 3, totalScore: 150, solvedCount: 3, problems: [] }
            ];
            const ranking = calculateRanking(players);
            expect(ranking[0].id).toBe(2);
            expect(ranking[0].rank).toBe(1);
            expect(ranking[1].id).toBe(3);
            expect(ranking[1].rank).toBe(2);
            expect(ranking[2].id).toBe(1);
            expect(ranking[2].rank).toBe(3);
        });

        it('总分相同时应该按通过题数降序排列', () => {
            const { calculateRanking } = require('../src/core/contestengine');
            const players = [
                { id: 1, totalScore: 100, solvedCount: 2, problems: [] },
                { id: 2, totalScore: 100, solvedCount: 3, problems: [] }
            ];
            const ranking = calculateRanking(players);
            expect(ranking[0].id).toBe(2);
            expect(ranking[0].rank).toBe(1);
            expect(ranking[1].id).toBe(1);
            expect(ranking[1].rank).toBe(2);
        });

        it('总分和通过题数都相同时应该按 id 升序排列', () => {
            const { calculateRanking } = require('../src/core/contestengine');
            const players = [
                { id: 3, totalScore: 100, solvedCount: 2, problems: [] },
                { id: 1, totalScore: 100, solvedCount: 2, problems: [] },
                { id: 2, totalScore: 100, solvedCount: 2, problems: [] }
            ];
            const ranking = calculateRanking(players);
            expect(ranking[0].id).toBe(1);
            expect(ranking[1].id).toBe(2);
            expect(ranking[2].id).toBe(3);
        });

        it('应该为每个选手分配正确的排名', () => {
            const { calculateRanking } = require('../src/core/contestengine');
            const players = [
                { id: 1, totalScore: 50, solvedCount: 1, problems: [] },
                { id: 2, totalScore: 200, solvedCount: 4, problems: [] },
                { id: 3, totalScore: 150, solvedCount: 3, problems: [] }
            ];
            const ranking = calculateRanking(players);
            expect(ranking.length).toBe(3);
            for (let i = 0; i < ranking.length; i++) {
                expect(ranking[i].rank).toBe(i + 1);
            }
        });

        it('空数组应该返回空数组', () => {
            const { calculateRanking } = require('../src/core/contestengine');
            const ranking = calculateRanking([]);
            expect(ranking).toEqual([]);
        });
    });

    describe('printRanking', () => {
        it('应该打印排行榜而不报错', () => {
            const { printRanking } = require('../src/core/contestengine');
            const problemConfigs = [
                { name: 'A' },
                { name: 'B' }
            ];
            const ranking = [
                {
                    rank: 1,
                    id: 1,
                    totalScore: 60,
                    solvedCount: 2,
                    problems: [
                        { name: 'A', status: 'AC', score: 30, maxScore: 30 },
                        { name: 'B', status: 'AC', score: 30, maxScore: 30 }
                    ]
                },
                {
                    rank: 2,
                    id: 2,
                    totalScore: 30,
                    solvedCount: 1,
                    problems: [
                        { name: 'A', status: 'AC', score: 30, maxScore: 30 },
                        { name: 'B', status: 'WA', score: 0, maxScore: 30 }
                    ]
                }
            ];

            expect(() => {
                printRanking(ranking, problemConfigs);
            }).not.toThrow();
        });
    });

    describe('printDetailedResults', () => {
        it('应该打印详细结果而不报错', () => {
            const { printDetailedResults } = require('../src/core/contestengine');
            const problemConfigs = [
                { name: 'A' },
                { name: 'B' }
            ];
            const players = [
                {
                    id: 1,
                    totalScore: 60,
                    solvedCount: 2,
                    problems: [
                        {
                            name: 'A',
                            status: 'AC',
                            score: 30,
                            maxScore: 30,
                            cases: [
                                { caseNum: 1, status: 'Accepted', passed: true, score: 10 }
                            ]
                        },
                        {
                            name: 'B',
                            status: 'Error',
                            score: 0,
                            maxScore: 30,
                            error: '编译错误',
                            cases: []
                        }
                    ]
                }
            ];

            expect(() => {
                printDetailedResults(players, problemConfigs);
            }).not.toThrow();
        });
    });

    describe('数据结构验证', () => {
        it('选手数据结构应该包含必需字段', () => {
            const { calculateRanking } = require('../src/core/contestengine');
            const players = [
                {
                    id: 1,
                    name: '选手 1',
                    totalScore: 100,
                    solvedCount: 2,
                    problems: [
                        {
                            name: 'A',
                            score: 50,
                            maxScore: 50,
                            cases: [],
                            passed: 5,
                            failed: 0,
                            status: 'AC'
                        }
                    ]
                }
            ];
            const ranking = calculateRanking(players);
            expect(ranking[0]).toHaveProperty('rank');
            expect(ranking[0]).toHaveProperty('id');
            expect(ranking[0]).toHaveProperty('name');
            expect(ranking[0]).toHaveProperty('totalScore');
            expect(ranking[0]).toHaveProperty('solvedCount');
            expect(ranking[0]).toHaveProperty('problems');
            expect(Array.isArray(ranking[0].problems)).toBe(true);
        });

        it('题目结果数据结构应该包含必需字段', () => {
            const problemResult = {
                name: 'A',
                prefix: 'sum',
                score: 30,
                maxScore: 30,
                cases: [],
                passed: 3,
                failed: 0,
                status: 'AC',
                error: null
            };

            expect(problemResult).toHaveProperty('name');
            expect(problemResult).toHaveProperty('score');
            expect(problemResult).toHaveProperty('maxScore');
            expect(problemResult).toHaveProperty('cases');
            expect(problemResult).toHaveProperty('status');
        });
    });
});

describe('contest - runContest 验证', () => {
    it('没有配置文件时应该抛出错误', async () => {
        const { runContest } = require('../src/core/contestengine');
        const config = {
            problems: [{ name: 'A', testCaseCount: 3 }],
            playerCount: 1,
            basePath: tempDir,
            language: 'python'
        };
        await expect(runContest(config)).rejects.toThrow('ojtool.json not found');
    });

    it('没有 problems 数组时应该抛出错误', async () => {
        fs.writeFileSync(path.join(tempDir, 'ojtool.json'), JSON.stringify({}));
        const { runContest } = require('../src/core/contestengine');
        const config = {
            playerCount: 1,
            basePath: tempDir,
            language: 'python'
        };
        await expect(runContest(config)).rejects.toThrow('problems array is required');
    });

    it('problems 为空数组时应该抛出错误', async () => {
        fs.writeFileSync(path.join(tempDir, 'ojtool.json'), JSON.stringify({}));
        const { runContest } = require('../src/core/contestengine');
        const config = {
            problems: [],
            playerCount: 1,
            basePath: tempDir,
            language: 'python'
        };
        await expect(runContest(config)).rejects.toThrow('problems array is required');
    });

    it('不支持的语言应该抛出错误', async () => {
        fs.writeFileSync(path.join(tempDir, 'ojtool.json'), JSON.stringify({}));
        const { runContest } = require('../src/core/contestengine');
        const config = {
            problems: [{ name: 'A', testCaseCount: 3 }],
            playerCount: 1,
            basePath: tempDir,
            language: 'unsupported-lang'
        };
        await expect(runContest(config)).rejects.toThrow('Unsupported language');
    });

    it('缺少 playerCount 时应该抛出错误', async () => {
        fs.writeFileSync(path.join(tempDir, 'ojtool.json'), JSON.stringify({}));
        const { runContest } = require('../src/core/contestengine');
        const config = {
            problems: [{ name: 'A', testCaseCount: 3 }],
            basePath: tempDir,
            language: 'python',
            playerCount: 0
        };
        await expect(runContest(config)).rejects.toThrow('playerCount is required');
    });

    it('缺少 basePath 时应该抛出错误', async () => {
        fs.writeFileSync(path.join(tempDir, 'ojtool.json'), JSON.stringify({}));
        const { runContest } = require('../src/core/contestengine');
        const config = {
            problems: [{ name: 'A', testCaseCount: 3 }],
            playerCount: 1,
            language: 'python',
            basePath: ''
        };
        await expect(runContest(config)).rejects.toThrow('basePath is required');
    });
});
