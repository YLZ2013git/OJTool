const fs = require('fs');
const path = require('path');
const os = require('os');

const {
    validateTestCases,
    getTestCaseStats,
    listTestCases,
    validateContestTestCases
} = require('../src/core/testcasemanager');

let tempDir;

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojtool-testcase-'));
});

afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

function createTestCase(prefix, index, inputContent, outputContent) {
    const inputFile = path.join(tempDir, `${prefix}${index}.in`);
    const outputFile = path.join(tempDir, `${prefix}${index}.ans`);
    
    if (inputContent !== null) {
        fs.writeFileSync(inputFile, inputContent);
    }
    if (outputContent !== null) {
        fs.writeFileSync(outputFile, outputContent);
    }
}

describe('testcasemanager', () => {
    describe('validateTestCases', () => {
        it('完整测试用例应该验证通过', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = validateTestCases(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.stats.total).toBe(3);
            expect(result.stats.valid).toBe(3);
            expect(result.stats.invalid).toBe(0);
        });

        it('缺失 .in 文件应该验证失败', () => {
            createTestCase('sum', 1, null, '3');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = validateTestCases(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('缺少输入文件') && e.includes('1'))).toBe(true);
            expect(result.stats.missingInput).toBe(1);
            expect(result.stats.valid).toBe(2);
            expect(result.stats.invalid).toBe(1);
        });

        it('缺失 .out 文件应该验证失败', () => {
            createTestCase('sum', 1, '1 2', null);
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = validateTestCases(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('缺少输出文件') && e.includes('1'))).toBe(true);
            expect(result.stats.missingOutput).toBe(1);
        });

        it('空输入文件应该验证失败', () => {
            createTestCase('sum', 1, '', '3');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = validateTestCases(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('输入文件为空') && e.includes('1'))).toBe(true);
            expect(result.stats.emptyInput).toBe(1);
        });

        it('空输出文件应该验证失败', () => {
            createTestCase('sum', 1, '1 2', '');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = validateTestCases(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('输出文件为空') && e.includes('1'))).toBe(true);
            expect(result.stats.emptyOutput).toBe(1);
        });

        it('不匹配的数量应该验证失败', () => {
            createTestCase('sum', 1, '1 2', '3');

            const result = validateTestCases(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(false);
            expect(result.stats.valid).toBe(1);
            expect(result.stats.invalid).toBe(2);
            expect(result.stats.missingInput).toBe(2);
            expect(result.stats.missingOutput).toBe(2);
        });

        it('0 个测试用例应该返回 valid=true', () => {
            const result = validateTestCases(tempDir, 'sum', 0);
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.stats.total).toBe(0);
            expect(result.stats.valid).toBe(0);
        });
    });

    describe('getTestCaseStats', () => {
        it('应该正确统计用例数', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = getTestCaseStats(tempDir, 'sum', 3);
            
            expect(result.total).toBe(3);
            expect(result.valid).toBe(3);
            expect(result.invalid).toBe(0);
            expect(result.cases).toHaveLength(3);
        });

        it('应该正确统计文件大小', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('sum', 3, '5 6', '11');

            const result = getTestCaseStats(tempDir, 'sum', 3);
            
            expect(result.totalInputSize).toBeGreaterThan(0);
            expect(result.totalOutputSize).toBeGreaterThan(0);
            expect(result.avgInputSize).toBeGreaterThan(0);
            expect(result.avgOutputSize).toBeGreaterThan(0);
            
            const input1Size = Buffer.byteLength('1 2');
            const output1Size = Buffer.byteLength('3');
            expect(result.cases[0].inputSize).toBe(input1Size);
            expect(result.cases[0].outputSize).toBe(output1Size);
        });

        it('部分用例无效时应该正确统计', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('sum', 2, '', '7');
            createTestCase('sum', 3, '5 6', null);

            const result = getTestCaseStats(tempDir, 'sum', 3);
            
            expect(result.total).toBe(3);
            expect(result.valid).toBe(1);
            expect(result.invalid).toBe(2);
            expect(result.cases[0].valid).toBe(true);
            expect(result.cases[1].valid).toBe(false);
            expect(result.cases[2].valid).toBe(false);
        });

        it('没有有效用例时平均值应该为 0', () => {
            const result = getTestCaseStats(tempDir, 'sum', 3);
            
            expect(result.valid).toBe(0);
            expect(result.avgInputSize).toBe(0);
            expect(result.avgOutputSize).toBe(0);
        });
    });

    describe('listTestCases', () => {
        it('应该列出所有测试用例', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('sum', 2, '3 4', '7');

            const result = listTestCases(tempDir, 'sum', 2);
            
            expect(result).toHaveLength(2);
            expect(result[0].index).toBe(1);
            expect(result[0].input.exists).toBe(true);
            expect(result[0].output.exists).toBe(true);
            expect(result[1].index).toBe(2);
        });

        it('缺失的文件应该正确标记', () => {
            createTestCase('sum', 1, '1 2', null);

            const result = listTestCases(tempDir, 'sum', 2);
            
            expect(result).toHaveLength(2);
            expect(result[0].input.exists).toBe(true);
            expect(result[0].output.exists).toBe(false);
            expect(result[1].input.exists).toBe(false);
            expect(result[1].output.exists).toBe(false);
        });

        it('应该返回正确的文件大小', () => {
            createTestCase('sum', 1, '1 2', '3');

            const result = listTestCases(tempDir, 'sum', 1);
            
            expect(result[0].input.size).toBe(Buffer.byteLength('1 2'));
            expect(result[0].output.size).toBe(Buffer.byteLength('3'));
        });
    });

    describe('validateContestTestCases', () => {
        it('竞赛模式下所有题目都有效时应该返回 valid=true', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('sum', 2, '3 4', '7');
            createTestCase('product', 1, '2 3', '6');
            createTestCase('product', 2, '4 5', '20');

            const problems = [
                { name: 'A', prefix: 'sum', testCaseCount: 2 },
                { name: 'B', prefix: 'product', testCaseCount: 2 }
            ];

            const result = validateContestTestCases(tempDir, problems);
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.results).toHaveLength(2);
            expect(result.results[0].name).toBe('A');
            expect(result.results[1].name).toBe('B');
        });

        it('竞赛模式下有题目无效时应该返回 valid=false', () => {
            createTestCase('sum', 1, '1 2', '3');
            createTestCase('product', 1, '2 3', null);

            const problems = [
                { name: 'A', prefix: 'sum', testCaseCount: 2 },
                { name: 'B', prefix: 'product', testCaseCount: 1 }
            ];

            const result = validateContestTestCases(tempDir, problems);
            
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('[A]'))).toBe(true);
            expect(result.errors.some(e => e.includes('[B]'))).toBe(true);
        });

        it('空 problems 数组应该返回 valid=true', () => {
            const result = validateContestTestCases(tempDir, []);
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.results).toHaveLength(0);
        });
    });
});
