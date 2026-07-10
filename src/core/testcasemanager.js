const fs = require('fs');
const path = require('path');
const configManager = require('./configmanager');

function validateTestCases(basePath, prefix, count) {
    const errors = [];
    const stats = {
        total: count,
        valid: 0,
        invalid: 0,
        missingInput: 0,
        missingOutput: 0,
        emptyInput: 0,
        emptyOutput: 0
    };

    for (let i = 1; i <= count; i++) {
        const inputFile = path.join(basePath, `${prefix}${i}.in`);
        const outputFile = path.join(basePath, `${prefix}${i}.ans`);

        let caseValid = true;

        if (!fs.existsSync(inputFile)) {
            errors.push(`测试用例 ${i}: 缺少输入文件 ${prefix}${i}.in`);
            stats.missingInput++;
            caseValid = false;
        } else {
            const inputStat = fs.statSync(inputFile);
            if (inputStat.size === 0) {
                errors.push(`测试用例 ${i}: 输入文件为空 ${prefix}${i}.in`);
                stats.emptyInput++;
                caseValid = false;
            }
        }

        if (!fs.existsSync(outputFile)) {
            errors.push(`测试用例 ${i}: 缺少输出文件 ${prefix}${i}.ans`);
            stats.missingOutput++;
            caseValid = false;
        } else {
            const outputStat = fs.statSync(outputFile);
            if (outputStat.size === 0) {
                errors.push(`测试用例 ${i}: 输出文件为空 ${prefix}${i}.ans`);
                stats.emptyOutput++;
                caseValid = false;
            }
        }

        if (caseValid) {
            stats.valid++;
        } else {
            stats.invalid++;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        stats
    };
}

function getTestCaseStats(basePath, prefix, count) {
    const cases = [];
    let totalInputSize = 0;
    let totalOutputSize = 0;
    let validCount = 0;

    for (let i = 1; i <= count; i++) {
        const inputFile = path.join(basePath, `${prefix}${i}.in`);
        const outputFile = path.join(basePath, `${prefix}${i}.ans`);

        const caseInfo = {
            index: i,
            inputFile: `${prefix}${i}.in`,
            outputFile: `${prefix}${i}.ans`,
            inputSize: 0,
            outputSize: 0,
            valid: true
        };

        if (fs.existsSync(inputFile)) {
            const stat = fs.statSync(inputFile);
            caseInfo.inputSize = stat.size;
            if (stat.size === 0) {
                caseInfo.valid = false;
            }
        } else {
            caseInfo.valid = false;
        }

        if (fs.existsSync(outputFile)) {
            const stat = fs.statSync(outputFile);
            caseInfo.outputSize = stat.size;
            if (stat.size === 0) {
                caseInfo.valid = false;
            }
        } else {
            caseInfo.valid = false;
        }

        if (caseInfo.valid) {
            totalInputSize += caseInfo.inputSize;
            totalOutputSize += caseInfo.outputSize;
            validCount++;
        }

        cases.push(caseInfo);
    }

    return {
        total: count,
        valid: validCount,
        invalid: count - validCount,
        cases,
        totalInputSize,
        totalOutputSize,
        avgInputSize: validCount > 0 ? Math.round(totalInputSize / validCount) : 0,
        avgOutputSize: validCount > 0 ? Math.round(totalOutputSize / validCount) : 0
    };
}

function listTestCases(basePath, prefix, count) {
    const result = [];

    for (let i = 1; i <= count; i++) {
        const inputFile = path.join(basePath, `${prefix}${i}.in`);
        const outputFile = path.join(basePath, `${prefix}${i}.ans`);

        result.push({
            index: i,
            input: {
                exists: fs.existsSync(inputFile),
                path: inputFile,
                size: fs.existsSync(inputFile) ? fs.statSync(inputFile).size : 0
            },
            output: {
                exists: fs.existsSync(outputFile),
                path: outputFile,
                size: fs.existsSync(outputFile) ? fs.statSync(outputFile).size : 0
            }
        });
    }

    return result;
}

function validateContestTestCases(basePath, problems) {
    const results = [];
    let allValid = true;
    let totalErrors = [];

    for (const problem of problems) {
        const problemConfig = configManager.getProblemConfig(problem, {});
        const result = validateTestCases(basePath, problemConfig.prefix, problemConfig.testCaseCount);
        
        results.push({
            name: problemConfig.name,
            prefix: problemConfig.prefix,
            ...result
        });

        if (!result.valid) {
            allValid = false;
            totalErrors = totalErrors.concat(
                result.errors.map(e => `[${problemConfig.name}] ${e}`)
            );
        }
    }

    return {
        valid: allValid,
        errors: totalErrors,
        results
    };
}

module.exports = {
    validateTestCases,
    getTestCaseStats,
    listTestCases,
    validateContestTestCases
};
