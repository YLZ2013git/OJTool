const fs = require('fs');
const path = require('path');
const os = require('os');

const originalCwd = process.cwd();
let tempDir;

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-reporter-test-'));
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

function createMockSingleResults() {
    return {
        player1: {
            player: 1,
            total: 30,
            maxScore: 30,
            cases: [
                { caseNum: 1, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                { caseNum: 2, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                { caseNum: 3, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 }
            ],
            passed: 3,
            failed: 0
        },
        player2: {
            player: 2,
            total: 20,
            maxScore: 30,
            cases: [
                { caseNum: 1, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                { caseNum: 2, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                { caseNum: 3, score: 0, status: 'Wrong Answer', passed: false, memoryKb: 1024 }
            ],
            passed: 2,
            failed: 1
        },
        player3: {
            player: 3,
            total: 0,
            maxScore: 30,
            cases: [
                { caseNum: 1, score: 0, status: 'Wrong Answer', passed: false, memoryKb: 1024 },
                { caseNum: 2, score: 0, status: 'Time Limit Exceeded', passed: false, memoryKb: 2048 },
                { caseNum: 3, score: 0, status: 'Runtime Error', passed: false, memoryKb: 1024 }
            ],
            passed: 0,
            failed: 3
        }
    };
}

function createMockConfig() {
    return {
        language: 'cpp',
        problemPrefix: 'problem',
        testCaseCount: 3,
        timeLimitMs: 1000,
        scorePerCase: 10,
        playerCount: 3,
        basePath: './test'
    };
}

function createMockContestResults() {
    return {
        players: [
            {
                id: 1,
                name: '选手 1',
                totalScore: 80,
                solvedCount: 2,
                problems: [
                    {
                        name: 'sum',
                        prefix: 'sum',
                        score: 30,
                        maxScore: 30,
                        passed: 3,
                        failed: 0,
                        status: 'AC',
                        cases: [
                            { caseNum: 1, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 2, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 3, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 }
                        ]
                    },
                    {
                        name: 'product',
                        prefix: 'product',
                        score: 50,
                        maxScore: 50,
                        passed: 5,
                        failed: 0,
                        status: 'AC',
                        cases: [
                            { caseNum: 1, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 2, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 3, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 4, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 5, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 }
                        ]
                    }
                ]
            },
            {
                id: 2,
                name: '选手 2',
                totalScore: 50,
                solvedCount: 1,
                problems: [
                    {
                        name: 'sum',
                        prefix: 'sum',
                        score: 20,
                        maxScore: 30,
                        passed: 2,
                        failed: 1,
                        status: 'WA',
                        cases: [
                            { caseNum: 1, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 2, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 3, score: 0, status: 'Wrong Answer', passed: false, memoryKb: 1024 }
                        ]
                    },
                    {
                        name: 'product',
                        prefix: 'product',
                        score: 30,
                        maxScore: 50,
                        passed: 3,
                        failed: 2,
                        status: 'WA',
                        cases: [
                            { caseNum: 1, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 2, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 3, score: 10, status: 'Accepted', passed: true, memoryKb: 1024 },
                            { caseNum: 4, score: 0, status: 'Wrong Answer', passed: false, memoryKb: 1024 },
                            { caseNum: 5, score: 0, status: 'Time Limit Exceeded', passed: false, memoryKb: 2048 }
                        ]
                    }
                ]
            }
        ],
        ranking: [
            { rank: 1, id: 1, name: '选手 1', totalScore: 80, solvedCount: 2 },
            { rank: 2, id: 2, name: '选手 2', totalScore: 50, solvedCount: 1 }
        ],
        problems: [
            { name: 'sum', prefix: 'sum', testCaseCount: 3, timeLimitMs: 1000, scorePerCase: 10 },
            { name: 'product', prefix: 'product', testCaseCount: 5, timeLimitMs: 2000, scorePerCase: 10 }
        ]
    };
}

function createMockContestConfig() {
    return {
        language: 'cpp',
        playerCount: 2,
        basePath: './test',
        timeLimitMs: 1000,
        scorePerCase: 10,
        problems: [
            { name: 'sum', testCaseCount: 3, timeLimitMs: 1000 },
            { name: 'product', testCaseCount: 5, timeLimitMs: 2000 }
        ]
    };
}

describe('JSON Reporter', () => {
    const jsonReporter = require('../src/reporters/json');

    describe('generateReport - 单题模式', () => {
        it('应该生成包含完整结构的报告', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config, { mode: 'single' });

            expect(report).toBeDefined();
            expect(report.metadata).toBeDefined();
            expect(report.players).toBeDefined();
            expect(report.ranking).toBeDefined();
            expect(report.problems).toBeDefined();
            expect(report.statistics).toBeDefined();
        });

        it('metadata 应该包含必要信息', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config);

            expect(report.metadata.generatedAt).toBeDefined();
            expect(report.metadata.toolVersion).toBeDefined();
            expect(report.metadata.toolName).toBe('ojtool');
            expect(report.metadata.configSummary.language).toBe('cpp');
            expect(report.metadata.configSummary.playerCount).toBe(3);
            expect(report.metadata.configSummary.testCaseCount).toBe(3);
        });

        it('players 数组应该包含所有选手', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config);

            expect(report.players.length).toBe(3);
            expect(report.players[0].id).toBe(1);
            expect(report.players[1].id).toBe(2);
            expect(report.players[2].id).toBe(3);
            expect(report.players[0].name).toBe('选手 1');
            expect(report.players[0].totalScore).toBe(30);
            expect(report.players[0].solvedCount).toBe(1);
            expect(report.players[0].problems.length).toBe(1);
        });

        it('ranking 应该按分数正确排序', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config);

            expect(report.ranking.length).toBe(3);
            expect(report.ranking[0].rank).toBe(1);
            expect(report.ranking[0].totalScore).toBe(30);
            expect(report.ranking[1].rank).toBe(2);
            expect(report.ranking[1].totalScore).toBe(20);
            expect(report.ranking[2].rank).toBe(3);
            expect(report.ranking[2].totalScore).toBe(0);
        });

        it('statistics 应该包含正确的统计数据', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config);

            expect(report.statistics.totalPlayers).toBe(3);
            expect(report.statistics.totalProblems).toBe(1);
            expect(report.statistics.totalCases).toBe(9);
            expect(report.statistics.totalPassedCases).toBe(5);
            expect(report.statistics.overallPassRate).toBeCloseTo(55.56, 0);
            expect(report.statistics.avgScore).toBeCloseTo(16.67, 0);
            expect(report.statistics.statusCounts['Accepted']).toBe(5);
            expect(report.statistics.statusCounts['Wrong Answer']).toBe(2);
        });
    });

    describe('generateReport - 竞赛模式', () => {
        it('应该正确处理竞赛模式数据', () => {
            const contestResult = createMockContestResults();
            const config = createMockContestConfig();
            const report = jsonReporter.generateReport(contestResult, config, { mode: 'contest' });

            expect(report.players.length).toBe(2);
            expect(report.problems.length).toBe(2);
            expect(report.ranking.length).toBe(2);
            expect(report.players[0].problems.length).toBe(2);
            expect(report.players[0].totalScore).toBe(80);
            expect(report.players[0].solvedCount).toBe(2);
        });
    });

    describe('saveReport', () => {
        it('应该保存报告到文件', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config);
            const outputPath = path.join(tempDir, 'test-report.json');

            const savedPath = jsonReporter.saveReport(report, outputPath);

            expect(savedPath).toBe(outputPath);
            expect(fs.existsSync(outputPath)).toBe(true);

            const content = fs.readFileSync(outputPath, 'utf-8');
            const parsed = JSON.parse(content);
            expect(parsed.metadata).toBeDefined();
            expect(parsed.players).toBeDefined();
        });

        it('生成的 JSON 应该可以被 JSON.parse 解析', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const report = jsonReporter.generateReport(results, config);
            const jsonStr = JSON.stringify(report);

            expect(() => JSON.parse(jsonStr)).not.toThrow();
            const parsed = JSON.parse(jsonStr);
            expect(parsed.players.length).toBe(3);
        });
    });
});

describe('Markdown Reporter', () => {
    const mdReporter = require('../src/reporters/markdown');

    describe('generateReport', () => {
        it('应该生成非空的 Markdown 字符串', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const md = mdReporter.generateReport(results, config);

            expect(md).toBeDefined();
            expect(typeof md).toBe('string');
            expect(md.length).toBeGreaterThan(0);
        });

        it('应该包含标题', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const md = mdReporter.generateReport(results, config);

            expect(md).toContain('# 🏆 评测报告');
        });

        it('应该包含统计概览表格', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const md = mdReporter.generateReport(results, config);

            expect(md).toContain('## 📊 统计概览');
            expect(md).toContain('| 指标 | 数值 |');
            expect(md).toContain('参赛选手');
            expect(md).toContain('题目数量');
            expect(md).toContain('平均得分');
        });

        it('应该包含排行榜表格', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const md = mdReporter.generateReport(results, config);

            expect(md).toContain('## 🏅 排行榜');
            expect(md).toContain('| 排名 | 选手 | 总分 |');
            expect(md).toContain('选手 1');
            expect(md).toContain('选手 2');
            expect(md).toContain('选手 3');
        });

        it('应该包含选手详情', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const md = mdReporter.generateReport(results, config);

            expect(md).toContain('## 👤 选手详情');
            expect(md).toContain('#1 选手 1');
            expect(md).toContain('### #1 选手 1');
        });

        it('竞赛模式也应该生成正确的 Markdown', () => {
            const contestResult = createMockContestResults();
            const config = createMockContestConfig();
            const md = mdReporter.generateReport(contestResult, config, { mode: 'contest' });

            expect(md).toContain('# 🏆 评测报告');
            expect(md).toContain('sum');
            expect(md).toContain('product');
            expect(md).toContain('选手 1');
            expect(md).toContain('选手 2');
        });
    });

    describe('saveReport', () => {
        it('应该保存 Markdown 报告到文件', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const md = mdReporter.generateReport(results, config);
            const outputPath = path.join(tempDir, 'test-report.md');

            const savedPath = mdReporter.saveReport(md, outputPath);

            expect(savedPath).toBe(outputPath);
            expect(fs.existsSync(outputPath)).toBe(true);

            const content = fs.readFileSync(outputPath, 'utf-8');
            expect(content).toContain('# 🏆 评测报告');
        });
    });
});

describe('HTML Reporter', () => {
    const htmlReporter = require('../src/reporters/html');

    describe('generateReport', () => {
        it('应该生成非空的 HTML 字符串', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);

            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        it('应该包含正确的 HTML 结构', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html');
            expect(html).toContain('<head>');
            expect(html).toContain('<body>');
            expect(html).toContain('</html>');
        });

        it('应该包含内嵌的 CSS 样式', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);

            expect(html).toContain('<style>');
            expect(html).toContain('</style>');
            expect(html).toContain('.container');
            expect(html).toContain('.card');
        });

        it('应该包含排行榜表格', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);

            expect(html).toContain('🏅 排行榜');
            expect(html).toContain('<table>');
            expect(html).toContain('</table>');
            expect(html).toContain('选手 1');
            expect(html).toContain('选手 2');
        });

        it('应该包含选手详情区域', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);

            expect(html).toContain('👤 选手详情');
            expect(html).toContain('togglePlayer');
        });

        it('应该包含统计信息', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);

            expect(html).toContain('📊 统计概览');
            expect(html).toContain('参赛选手');
            expect(html).toContain('题目数量');
            expect(html).toContain('平均得分');
        });

        it('竞赛模式也应该生成正确的 HTML', () => {
            const contestResult = createMockContestResults();
            const config = createMockContestConfig();
            const html = htmlReporter.generateReport(contestResult, config, { mode: 'contest' });

            expect(html).toContain('sum');
            expect(html).toContain('product');
            expect(html).toContain('选手 1');
        });
    });

    describe('saveReport', () => {
        it('应该保存 HTML 报告到文件', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const html = htmlReporter.generateReport(results, config);
            const outputPath = path.join(tempDir, 'test-report.html');

            const savedPath = htmlReporter.saveReport(html, outputPath);

            expect(savedPath).toBe(outputPath);
            expect(fs.existsSync(outputPath)).toBe(true);

            const content = fs.readFileSync(outputPath, 'utf-8');
            expect(content).toContain('<!DOCTYPE html>');
        });
    });
});

describe('Reporters Index', () => {
    const reporters = require('../src/reporters');

    describe('getReporter', () => {
        it('应该返回 json 报告生成器', () => {
            const reporter = reporters.getReporter('json');
            expect(reporter).toBeDefined();
            expect(typeof reporter.generateReport).toBe('function');
            expect(typeof reporter.saveReport).toBe('function');
        });

        it('应该返回 html 报告生成器', () => {
            const reporter = reporters.getReporter('html');
            expect(reporter).toBeDefined();
            expect(typeof reporter.generateReport).toBe('function');
        });

        it('应该返回 md 报告生成器', () => {
            const reporter = reporters.getReporter('md');
            expect(reporter).toBeDefined();
            expect(typeof reporter.generateReport).toBe('function');
        });

        it('markdown 格式应该和 md 一样', () => {
            const reporter1 = reporters.getReporter('md');
            const reporter2 = reporters.getReporter('markdown');
            expect(reporter1).toBe(reporter2);
        });

        it('不支持的格式应该抛出错误', () => {
            expect(() => reporters.getReporter('pdf')).toThrow('不支持的报告格式');
        });
    });

    describe('getDefaultExtension', () => {
        it('应该返回正确的扩展名', () => {
            expect(reporters.getDefaultExtension('json')).toBe('.json');
            expect(reporters.getDefaultExtension('html')).toBe('.html');
            expect(reporters.getDefaultExtension('md')).toBe('.md');
            expect(reporters.getDefaultExtension('markdown')).toBe('.md');
        });

        it('默认格式应该返回 .html', () => {
            expect(reporters.getDefaultExtension()).toBe('.html');
        });
    });

    describe('generateAndSaveReport', () => {
        it('应该生成单个格式的报告', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const outputPath = path.join(tempDir, 'my-report.json');

            const outputFiles = reporters.generateAndSaveReport(results, config, {
                format: 'json',
                output: outputPath
            });

            expect(outputFiles.json).toBe(outputPath);
            expect(fs.existsSync(outputPath)).toBe(true);
        });

        it('all 格式应该生成所有三种格式', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();
            const outputPath = path.join(tempDir, 'report.html');

            const outputFiles = reporters.generateAndSaveReport(results, config, {
                format: 'all',
                output: outputPath
            });

            expect(outputFiles.json).toBeDefined();
            expect(outputFiles.html).toBeDefined();
            expect(outputFiles.md).toBeDefined();
            expect(fs.existsSync(outputFiles.json)).toBe(true);
            expect(fs.existsSync(outputFiles.html)).toBe(true);
            expect(fs.existsSync(outputFiles.md)).toBe(true);
        });

        it('没有指定 output 时应该使用默认文件名', () => {
            const results = createMockSingleResults();
            const config = createMockConfig();

            const outputFiles = reporters.generateAndSaveReport(results, config, {
                format: 'html'
            });

            expect(outputFiles.html).toBe('report.html');
            expect(fs.existsSync(path.join(tempDir, 'report.html'))).toBe(true);
        });
    });
});
