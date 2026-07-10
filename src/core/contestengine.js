const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const logger = require('../utils/logger');
const { getProblemConfig } = require('./configmanager');
const { judgePlayerWithAdapter } = require('./judgeengine');
const languages = require('../languages');

/**
 * 判断题目是否通过（所有测试点都AC）
 * @param {Object} problemResult - 单题评测结果
 * @returns {boolean}
 */
function isProblemSolved(problemResult) {
    if (!problemResult || !problemResult.cases || problemResult.cases.length === 0) {
        return false;
    }
    return problemResult.cases.every(c => c.passed);
}

/**
 * 获取题目状态
 * @param {Object} problemResult - 单题评测结果
 * @param {boolean} hasSubmission - 是否有提交
 * @returns {string} - 'AC' | 'WA' | 'NS'
 */
function getProblemStatus(problemResult, hasSubmission = true) {
    if (!hasSubmission) {
        return 'NS';
    }
    if (isProblemSolved(problemResult)) {
        return 'AC';
    }
    return 'WA';
}

/**
 * 计算竞赛排行榜（按总分降序，同分按通过题数降序）
 * @param {Array} players - 选手数组
 * @returns {Array} - 排序后的排行榜
 */
function calculateRanking(players) {
    const ranking = [...players];
    ranking.sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
        }
        if (b.solvedCount !== a.solvedCount) {
            return b.solvedCount - a.solvedCount;
        }
        return a.id - b.id;
    });

    return ranking.map((player, index) => ({
        rank: index + 1,
        ...player
    }));
}

/**
 * 评测单个选手的单个题目
 * @param {Object} adapter - 语言适配器
 * @param {number} playerNum - 选手编号
 * @param {Object} problemConfig - 题目配置
 * @param {Object} globalConfig - 全局配置
 * @param {Object} options - 选项
 * @returns {Promise<Object>}
 */
async function judgeProblem(adapter, playerNum, problemConfig, globalConfig, options = {}) {
    const problemJudgeConfig = {
        ...globalConfig,
        problemPrefix: problemConfig.prefix,
        testCaseCount: problemConfig.testCaseCount,
        timeLimitMs: problemConfig.timeLimitMs,
        scorePerCase: problemConfig.scorePerCase,
        checkerType: problemConfig.checkerType !== undefined ? problemConfig.checkerType : globalConfig.checkerType,
        customCheckerPath: problemConfig.customCheckerPath !== undefined ? problemConfig.customCheckerPath : globalConfig.customCheckerPath,
        noipMode: problemConfig.noipMode !== undefined ? problemConfig.noipMode : globalConfig.noipMode
    };

    const result = await judgePlayerWithAdapter(adapter, playerNum, problemJudgeConfig, options);
    return {
        name: problemConfig.name,
        prefix: problemConfig.prefix,
        score: result.total,
        maxScore: result.maxScore,
        cases: result.cases,
        passed: result.passed,
        failed: result.failed,
        status: result.error ? 'Error' : (isProblemSolved(result) ? 'AC' : 'WA'),
        error: result.error || null
    };
}

/**
 * 执行竞赛评测
 * @param {Object} config - 配置对象
 * @param {Object} options - 选项
 * @param {number} options.playerCount - 选手数量
 * @param {string} options.basePath - 基础路径
 * @param {boolean} options.verbose - 详细输出
 * @param {Function} options.onProgress - 进度回调（每个测试点调用）
 * @returns {Promise<Object>}
 */
async function runContest(config, options = {}) {
    logger.setVerbose(options.verbose || false);

    const configPath = path.join(process.cwd(), 'ojtool.json');
    if (!fs.existsSync(configPath)) {
        logger.error('配置文件 ojtool.json 不存在，请先运行 ojtool init 初始化');
        throw new Error('ojtool.json not found');
    }

    const playerCount = options.playerCount || config.playerCount;
    const basePath = options.basePath || config.basePath;
    const language = config.language || 'cpp';

    if (!playerCount) {
        logger.error('缺少选手数量配置，请在 ojtool.json 中配置 playerCount 或通过参数指定');
        throw new Error('playerCount is required');
    }

    if (!basePath) {
        logger.error('缺少基础路径配置，请在 ojtool.json 中配置 basePath 或通过参数指定');
        throw new Error('basePath is required');
    }

    if (!config.problems || !Array.isArray(config.problems) || config.problems.length === 0) {
        logger.error('竞赛模式需要配置 problems 数组');
        throw new Error('problems array is required for contest mode');
    }

    const adapter = languages.getByName(language);
    if (!adapter) {
        logger.error(`不支持的语言: ${language}`);
        throw new Error(`Unsupported language: ${language}`);
    }

    const problemConfigs = config.problems.map(p => getProblemConfig(p, config));

    let totalSteps = 0;
    for (const problemConfig of problemConfigs) {
        totalSteps += problemConfig.testCaseCount;
    }
    totalSteps *= playerCount;

    let currentStep = 0;
    let currentProblemIndex = 0;

    logger.info('开始竞赛评测...');
    logger.debug(`编程语言: ${language}`);
    logger.debug(`选手数量: ${playerCount}`);
    logger.debug(`题目数量: ${problemConfigs.length}`);
    logger.debug(`基础路径: ${basePath}`);

    const players = [];

    for (let i = 1; i <= playerCount; i++) {
        logger.debug(`正在评测选手 ${i}...`);
        const playerProblems = [];
        let totalScore = 0;
        let solvedCount = 0;
        currentProblemIndex = 0;

        for (const problemConfig of problemConfigs) {
            logger.debug(`  题目 ${problemConfig.name}...`);
            currentProblemIndex++;

            const contestOptions = {
                ...options,
                onCaseProgress: (caseInfo) => {
                    currentStep++;
                    if (options.onProgress && typeof options.onProgress === 'function') {
                        try {
                            options.onProgress({
                                player: i,
                                problem: problemConfig.name,
                                problemIndex: currentProblemIndex,
                                totalPlayers: playerCount,
                                totalProblems: problemConfigs.length,
                                case: caseInfo.case,
                                totalCases: caseInfo.totalCases,
                                totalSteps: totalSteps,
                                currentStep: currentStep,
                                status: caseInfo.status,
                                score: caseInfo.score,
                                passed: caseInfo.passed
                            });
                        } catch (e) {
                            // 忽略回调错误
                        }
                    }
                }
            };

            const problemResult = await judgeProblem(adapter, i, problemConfig, config, contestOptions);
            playerProblems.push(problemResult);

            totalScore += problemResult.score;
            if (problemResult.status === 'AC') {
                solvedCount++;
            }

            if (options.onProblemComplete && typeof options.onProblemComplete === 'function') {
                try {
                    options.onProblemComplete({
                        player: i,
                        problem: problemConfig.name,
                        totalPlayers: playerCount,
                        totalProblems: problemConfigs.length,
                        result: problemResult
                    });
                } catch (e) {
                    // 忽略回调错误
                }
            }
        }

        const playerResult = {
            id: i,
            name: `选手 ${i}`,
            totalScore,
            solvedCount,
            problems: playerProblems
        };

        players.push(playerResult);

        if (options.onPlayerComplete && typeof options.onPlayerComplete === 'function') {
            try {
                options.onPlayerComplete({
                    player: i,
                    totalPlayers: playerCount,
                    result: playerResult
                });
            } catch (e) {
                // 忽略回调错误
            }
        }

        const statusEmoji = solvedCount === problemConfigs.length ? '🏆' :
                           solvedCount > 0 ? '✅' : '❌';
        console.log(`选手 ${i}: ${statusEmoji} 总分 ${totalScore} (通过 ${solvedCount}/${problemConfigs.length} 题)`);
    }

    const ranking = calculateRanking(players);

    logger.success('竞赛评测完成');

    return {
        success: true,
        players,
        ranking,
        problems: problemConfigs
    };
}

/**
 * 打印排行榜
 * @param {Array} ranking - 排行榜数组
 * @param {Array} problemConfigs - 题目配置数组
 */
function printRanking(ranking, problemConfigs) {
    logger.divider('=', 80);
    logger.title('🏆 竞赛排行榜');
    logger.divider('-', 80);

    const problemNames = problemConfigs.map(p => p.name);
    const header = `排名  选手    总分  通过  ${problemNames.map(n => n.padEnd(6)).join('  ')}`;
    console.log(chalk.bold(header));
    logger.divider('-', 80);

    for (const player of ranking) {
        const rankStr = String(player.rank).padEnd(4);
        const playerStr = `选手${player.id}`.padEnd(6);
        const scoreStr = String(player.totalScore).padEnd(4);
        const solvedStr = `${player.solvedCount}/${problemConfigs.length}`.padEnd(4);

        const problemStatuses = player.problems.map(p => {
            let statusStr;
            if (p.status === 'AC') {
                statusStr = chalk.green('AC'.padEnd(6));
            } else if (p.status === 'Error') {
                statusStr = chalk.red('ERR'.padEnd(6));
            } else if (p.score > 0) {
                statusStr = chalk.yellow(String(p.score).padEnd(6));
            } else {
                statusStr = chalk.red('WA'.padEnd(6));
            }
            return statusStr;
        }).join('  ');

        console.log(`${rankStr}  ${playerStr}  ${scoreStr}  ${solvedStr}  ${problemStatuses}`);
    }

    logger.divider('=', 80);
}

/**
 * 打印详细结果
 * @param {Array} players - 选手数组
 * @param {Array} problemConfigs - 题目配置数组
 */
function printDetailedResults(players, problemConfigs) {
    logger.divider('=', 80);
    logger.title('📊 详细结果');
    logger.divider('-', 80);

    for (const player of players) {
        console.log();
        console.log(chalk.bold.cyan(`选手 ${player.id} - 总分: ${player.totalScore} (通过 ${player.solvedCount}/${problemConfigs.length} 题)`));
        console.log();

        for (const problem of player.problems) {
            const statusColor = problem.status === 'AC' ? chalk.green :
                               problem.status === 'Error' ? chalk.red : chalk.yellow;
            console.log(`  ${chalk.bold(problem.name)}: ${statusColor(problem.status)} (${problem.score}/${problem.maxScore}分)`);

            if (problem.error) {
                console.log(`    错误: ${problem.error}`);
            }

            for (const c of problem.cases) {
                const caseStatus = c.passed ? chalk.green('✓') : chalk.red('✗');
                console.log(`    测试点 ${c.caseNum}: ${caseStatus} ${c.status} (${c.score}分)`);
            }
            console.log();
        }
    }

    logger.divider('=', 80);
}

module.exports = {
    runContest,
    calculateRanking,
    isProblemSolved,
    getProblemStatus,
    judgeProblem,
    printRanking,
    printDetailedResults
};
