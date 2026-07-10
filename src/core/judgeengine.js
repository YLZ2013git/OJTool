const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const logger = require('../utils/logger');
const { PathError, JudgeError } = require('../utils/errors');

const SHORT_STATUS_MAP = {
    AC: 'Accepted',
    CE: 'Compile Error',
    RTE: 'Runtime Error',
    TLE: 'Time Limit Exceeded',
    OLE: 'Output Limit Exceeded',
    MLE: 'Memory Limit Exceeded',
    WA: 'Wrong Answer',
    UKE: 'Unknown Error'
};

/**
 * 根据完整状态字符串返回对应的 chalk 颜色函数
 * UKE 用紫色（违规/源码不规范），与 RTE 区分
 * @param {string} statusFull - 完整状态字符串
 * @returns {Function} - chalk 颜色函数
 */
function getStatusColor(statusFull) {
    const s = (statusFull || '').toLowerCase();
    if (s === 'accepted') return chalk.green;
    if (s === 'wrong answer') return chalk.red;
    if (s === 'time limit exceeded') return chalk.yellow;
    if (s === 'runtime error') return chalk.magenta;
    if (s === 'compile error') return chalk.gray;
    if (s === 'memory limit exceeded') return chalk.cyan;
    if (s === 'output limit exceeded') return chalk.yellowBright;
    if (s === 'unknown error') return chalk.magentaBright;
    return chalk.white;
}

/**
 * 获取评测机路径
 * @returns {string} - 评测机可执行文件路径
 */
function getJudgerPath() {
    return path.join(__dirname, '../../bin/judger.exe');
}

/**
 * 短状态码转换为完整状态字符串
 * @param {string} shortStatus - 短状态码 (AC, WA, TLE, etc.)
 * @returns {string} - 完整状态字符串
 */
function shortStatusToFull(shortStatus) {
    return SHORT_STATUS_MAP[shortStatus] || shortStatus;
}

/**
 * 创建 JSON 行解析器状态对象
 * @returns {Object} - 解析器状态
 */
function createJsonLineParser() {
    return {
        buffer: '',
        results: {},
        totalPlayers: 0,
        totalCases: 0,
        currentStep: 0,
        done: false,
        errors: []
    };
}

/**
 * 从文本中提取并解析 JSON 行
 * @param {string} text - 输入文本
 * @returns {Array} - 解析出的 JSON 对象数组
 */
function extractJsonLines(text) {
    const lines = text.split('\n');
    const jsonObjects = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('{"type":')) {
            try {
                const obj = JSON.parse(trimmed);
                if (obj && typeof obj.type === 'string') {
                    jsonObjects.push(obj);
                }
            } catch (e) {
                // 忽略无效的 JSON 行
            }
        }
    }

    return jsonObjects;
}

/**
 * 处理单个 JSON 对象，更新结果状态
 * @param {Object} state - 解析器状态
 * @param {Object} jsonObj - JSON 对象
 * @param {Function} onProgress - 进度回调函数
 */
function processJsonObject(state, jsonObj, onProgress) {
    switch (jsonObj.type) {
        case 'player_start':
            handlePlayerStart(state, jsonObj);
            break;
        case 'result':
            handleResult(state, jsonObj, onProgress);
            break;
        case 'player_end':
            handlePlayerEnd(state, jsonObj);
            break;
        case 'done':
            handleDone(state, jsonObj);
            break;
        default:
            // 忽略未知类型
            break;
    }
}

/**
 * 处理 player_start 事件
 * @param {Object} state - 解析器状态
 * @param {Object} jsonObj - JSON 对象
 */
function handlePlayerStart(state, jsonObj) {
    const playerNum = jsonObj.player;
    if (!state.results[`player${playerNum}`]) {
        state.results[`player${playerNum}`] = {
            player: playerNum,
            total: 0,
            maxScore: 0,
            cases: [],
            passed: 0,
            failed: 0
        };
    }
}

/**
 * 处理 result 事件
 * @param {Object} state - 解析器状态
 * @param {Object} jsonObj - JSON 对象
 * @param {Function} onProgress - 进度回调函数
 */
function handleResult(state, jsonObj, onProgress) {
    const playerNum = jsonObj.player;
    const playerKey = `player${playerNum}`;

    if (!state.results[playerKey]) {
        handlePlayerStart(state, jsonObj);
    }

    const playerResult = state.results[playerKey];
    const statusFull = shortStatusToFull(jsonObj.status);
    const passed = statusFull.toLowerCase() === 'accepted';

    const caseObj = {
        caseNum: jsonObj.case,
        score: jsonObj.score,
        status: statusFull,
        passed: passed,
        memoryKb: jsonObj.memoryKb !== undefined ? jsonObj.memoryKb : 0
    };

    playerResult.cases.push(caseObj);

    if (passed) {
        playerResult.passed++;
    } else {
        playerResult.failed++;
    }

    playerResult.total = playerResult.cases.reduce((sum, c) => sum + c.score, 0);

    state.currentStep++;
    const totalSteps = state.totalPlayers * state.totalCases;

    if (onProgress && typeof onProgress === 'function') {
        try {
            onProgress({
                player: playerNum,
                case: jsonObj.case,
                status: statusFull,
                score: jsonObj.score,
                memoryKb: jsonObj.memoryKb !== undefined ? jsonObj.memoryKb : 0,
                totalCases: state.totalCases,
                totalPlayers: state.totalPlayers,
                totalSteps: totalSteps,
                currentStep: state.currentStep,
                passed: passed
            });
        } catch (e) {
            // 忽略回调错误
        }
    }
}

/**
 * 处理 player_end 事件
 * @param {Object} state - 解析器状态
 * @param {Object} jsonObj - JSON 对象
 */
function handlePlayerEnd(state, jsonObj) {
    const playerNum = jsonObj.player;
    const playerKey = `player${playerNum}`;

    if (!state.results[playerKey]) {
        handlePlayerStart(state, jsonObj);
    }

    const playerResult = state.results[playerKey];
    playerResult.total = jsonObj.totalScore;
    playerResult.maxScore = jsonObj.maxScore;
}

/**
 * 处理 done 事件
 * @param {Object} state - 解析器状态
 * @param {Object} jsonObj - JSON 对象
 */
function handleDone(state, jsonObj) {
    state.done = true;
    state.totalPlayers = jsonObj.playerCount;
}

/**
 * 解析 JSON 行并构建结果对象
 * @param {string} stdoutContent - stdout 内容
 * @param {Object} options - 选项
 * @param {Function} options.onProgress - 进度回调
 * @param {number} options.testCaseCount - 测试用例数量
 * @param {number} options.playerCount - 选手数量
 * @returns {Object} - 解析结果
 */
function parseJsonLines(stdoutContent, options = {}) {
    const state = createJsonLineParser();
    state.totalCases = options.testCaseCount || 0;
    state.totalPlayers = options.playerCount || 0;

    const jsonObjects = extractJsonLines(stdoutContent);

    for (const obj of jsonObjects) {
        processJsonObject(state, obj, options.onProgress);
    }

    // 补充计算 maxScore（如果 player_end 中没有提供）
    for (const key of Object.keys(state.results)) {
        const playerResult = state.results[key];
        if (playerResult.maxScore === 0 && playerResult.cases.length > 0) {
            const maxPerCase = Math.max(...playerResult.cases.map(c => c.score));
            playerResult.maxScore = maxPerCase * playerResult.cases.length;
        }
    }

    return {
        results: state.results,
        done: state.done,
        totalPlayers: state.totalPlayers
    };
}

/**
 * 验证路径是否安全（在工作目录范围内）
 * @param {string} basePath - 要验证的基础路径
 * @returns {boolean} - 路径是否安全
 */
function isPathSafe(basePath) {
    try {
        const absolutePath = path.resolve(basePath);
        const normalized = path.normalize(absolutePath);
        if (normalized.includes('..')) {
            return false;
        }
        
        if (process.platform === 'win32') {
            if (absolutePath.includes('~')) {
                return false;
            }
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 创建流式 JSON 行解析器
 * @param {Object} options - 选项
 * @param {Function} options.onProgress - 进度回调
 * @param {number} options.testCaseCount - 测试用例数量
 * @param {number} options.playerCount - 选手数量
 * @returns {Object} - 流式解析器
 */
function createStreamingJsonParser(options = {}) {
    const state = createJsonLineParser();
    state.totalCases = options.testCaseCount || 0;
    state.totalPlayers = options.playerCount || 0;
    let lineBuffer = '';
    const onProgress = options.onProgress;

    function feed(data) {
        lineBuffer += data;
        let newlineIndex;

        while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
            const line = lineBuffer.slice(0, newlineIndex);
            lineBuffer = lineBuffer.slice(newlineIndex + 1);

            const trimmed = line.trim();
            if (trimmed.startsWith('{"type":')) {
                try {
                    const obj = JSON.parse(trimmed);
                    if (obj && typeof obj.type === 'string') {
                        processJsonObject(state, obj, onProgress);
                    }
                } catch (e) {
                    // 忽略无效的 JSON 行
                }
            }
        }
    }

    function finalize() {
        if (lineBuffer.trim().startsWith('{"type":')) {
            try {
                const obj = JSON.parse(lineBuffer.trim());
                if (obj && typeof obj.type === 'string') {
                    processJsonObject(state, obj, onProgress);
                }
            } catch (e) {
                // 忽略无效的 JSON 行
            }
        }
        lineBuffer = '';

        for (const key of Object.keys(state.results)) {
            const playerResult = state.results[key];
            if (playerResult.maxScore === 0 && playerResult.cases.length > 0) {
                const maxPerCase = Math.max(...playerResult.cases.map(c => c.score));
                playerResult.maxScore = maxPerCase * playerResult.cases.length;
            }
        }
    }

    function getResults() {
        return state.results;
    }

    function isDone() {
        return state.done;
    }

    return {
        feed,
        finalize,
        getResults,
        isDone
    };
}

/**
 * 执行评测
 * @param {Object} config - 配置对象
 * @param {Object} options - 额外选项
 * @param {number} options.playerCount - 选手数量
 * @param {string} options.basePath - 基础路径
 * @param {boolean} options.verbose - 是否详细输出
 * @param {Function} options.onProgress - 实时进度回调
 * @returns {Promise<Object>} - 评测结果
 */
async function runJudge(config, options = {}) {
    logger.setVerbose(options.verbose || false);

    const judgerPath = getJudgerPath();
    const configPath = path.join(process.cwd(), 'ojtool.json');

    // 检查judger.exe是否存在
    if (!fs.existsSync(judgerPath)) {
        logger.error('评测机不存在，请先编译 judger.exe');
        throw new Error('judger.exe not found');
    }

    // 检查配置文件是否存在
    if (!fs.existsSync(configPath)) {
        logger.error('配置文件 ojtool.json 不存在，请先运行 ojtool init 初始化');
        throw new Error('ojtool.json not found');
    }

    // 获取评测所需参数
    const playerCount = options.playerCount || config.playerCount;
    const basePath = options.basePath || config.basePath;
    const testCaseCount = config.testCaseCount || 1;
    const timeLimitMs = config.timeLimitMs || 1000;

    if (!playerCount) {
        logger.error('缺少选手数量配置，请在 ojtool.json 中配置 playerCount 或通过参数指定');
        throw new Error('playerCount is required');
    }

    if (!basePath) {
        logger.error('缺少基础路径配置，请在 ojtool.json 中配置 basePath 或通过参数指定');
        throw new Error('basePath is required');
    }

    // 验证basePath安全性
    if (!isPathSafe(basePath)) {
        logger.error('路径遍历检测: basePath 不允许包含 ".." 或其他危险路径组件');
        throw new PathError('Invalid basePath: path traversal detected');
    }

    // 动态计算超时时间：每个选手每个测试点的超时 * 测试点数量 * 选手数量 + 编译时间(每个选手10秒) + 额外缓冲(60秒)
    const compileTimePerPlayer = 10000;
    const bufferTime = 60000;
    const timeoutMs = playerCount * (testCaseCount * timeLimitMs + compileTimePerPlayer) + bufferTime;
    const maxTimeoutMs = 30 * 60 * 1000;
    const finalTimeoutMs = Math.min(timeoutMs, maxTimeoutMs);

    logger.info('开始评测...');
    logger.debug(`评测机路径: ${judgerPath}`);
    logger.debug(`配置文件路径: ${configPath}`);
    logger.debug(`选手数量: ${playerCount}`);
    logger.debug(`基础路径: ${basePath}`);
    logger.debug(`超时时间: ${finalTimeoutMs}ms`);

    const jsonParser = createStreamingJsonParser({
        onProgress: options.onProgress,
        testCaseCount: testCaseCount,
        playerCount: playerCount
    });

    return new Promise((resolve, reject) => {
        // 调用judger.exe（使用管道进行交互）
        const judger = spawn(judgerPath, [], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });

        let stdoutData = '';
        let stderrData = '';
        let isReadyForConfigPath = false;
        let configPathSent = false;

        let isCompleted = false;

        // 捕获标准输出
        judger.stdout.on('data', (data) => {
            const output = data.toString();
            stdoutData += output;
            logger.debug(`[评测机输出] ${output.trim()}`);

            // 流式解析 JSON 行
            jsonParser.feed(output);

            // 检测是否询问是否读取配置文件
            if (output.includes('是否读取配置文件') && !isReadyForConfigPath) {
                logger.debug('检测到配置文件询问，自动输入 y');
                judger.stdin.write('y\n');
                isReadyForConfigPath = true;
            }

            // 检测是否询问配置文件路径
            if (output.includes('输入配置文件路径') && isReadyForConfigPath && !configPathSent) {
                logger.debug(`发送配置文件路径: ${configPath}`);
                judger.stdin.write(configPath + '\n');
                configPathSent = true;
            }

            // 实时输出评测进度（可选）
            if (output.includes('选手') || output.includes(': Accepted') ||
                output.includes(': Wrong Answer') || output.includes(': Time Limit Exceeded') ||
                output.includes(': Runtime Error') || output.includes(': Compile Error') ||
                output.includes(': Unknown Error') || output.includes(': Memory Limit Exceeded') ||
                output.includes(': Output Limit Exceeded')) {
                process.stdout.write(output);
            }

            // 检测评测是否完成
            if ((output.includes('全部完成') || jsonParser.isDone()) && !isCompleted) {
                logger.debug('检测到评测完成信号');
                isCompleted = true;
                // 给一点时间让输出缓冲完成，然后结束进程
                setTimeout(() => {
                    if (!judger.killed) {
                        logger.debug('评测已完成，关闭评测机进程');
                        judger.kill();
                    }
                }, 500);
            }
        });

        // 捕获错误输出
        judger.stderr.on('data', (data) => {
            const error = data.toString();
            stderrData += error;
            logger.error(`[评测机错误] ${error.trim()}`);
        });

        // 处理进程关闭
        judger.on('close', (code) => {
            // 如果是正常完成评测后被kill，code可能为null或非0，这是正常的
            if (code !== 0 && code !== null && !isCompleted) {
                logger.error(`评测机异常退出，退出代码: ${code}`);
                logger.debug(`标准输出: ${stdoutData}`);
                logger.debug(`错误输出: ${stderrData}`);
                reject(new Error(`judger exited with code ${code}`));
                return;
            }

            logger.success('评测完成');
            logger.debug('开始解析评测结果...');

            // 完成流式解析
            jsonParser.finalize();

            // 清理临时文件
            cleanupTempFiles(config, playerCount, basePath);

            try {
                // 优先使用 JSON 行解析结果
                let results = jsonParser.getResults();
                const jsonResultCount = Object.keys(results).length;

                // 如果 JSON 解析结果为空或不完整，回退到文件解析
                if (jsonResultCount < playerCount) {
                    logger.debug('JSON 解析结果不完整，回退到文件解析');
                    results = parseResults(config, playerCount, basePath);
                }

                resolve({
                    success: true,
                    results: results,
                    stdout: stdoutData,
                    stderr: stderrData
                });
            } catch (parseError) {
                logger.error(`解析结果失败: ${parseError.message}`);
                reject(parseError);
            }
        });

        // 处理进程错误
        judger.on('error', (error) => {
            logger.error(`启动评测机失败: ${error.message}`);
            reject(error);
        });

        // 设置动态超时
        setTimeout(() => {
            if (!judger.killed) {
                logger.warn('评测超时，正在终止评测机...');
                judger.kill();
                reject(new JudgeError('评测超时'));
            }
        }, finalTimeoutMs);
    });
}

/**
 * 解析所有选手的评测结果文件
 * @param {Object} config - 配置对象
 * @param {number} playerCount - 选手数量
 * @param {string} basePath - 基础路径
 * @returns {Object} - 解析后的结果
 */
function parseResults(config, playerCount, basePath) {
    const results = {};
    const problemPrefix = config.problemPrefix || 'problem';

    logger.debug(`解析评测结果，选手数: ${playerCount}, 路径: ${basePath}`);

    // 遍历选手目录，读取结果文件
    for (let i = 1; i <= playerCount; i++) {
        const playerDir = path.join(basePath, String(i));
        const resultFile = path.join(playerDir, `${problemPrefix}_out.txt`);

        logger.debug(`检查选手 ${i} 结果文件: ${resultFile}`);

        if (fs.existsSync(resultFile)) {
            try {
                const content = fs.readFileSync(resultFile, 'utf-8');
                results[`player${i}`] = parseResultFile(content, i);
                logger.debug(`选手 ${i} 结果解析成功`);
            } catch (error) {
                logger.warn(`读取选手 ${i} 结果文件失败: ${error.message}`);
                results[`player${i}`] = {
                    error: '无法读取结果文件',
                    player: i
                };
            }
        } else {
            logger.warn(`选手 ${i} 结果文件不存在: ${resultFile}`);
            results[`player${i}`] = {
                error: '结果文件不存在',
                player: i
            };
        }
    }

    return results;
}

/**
 * 解析单个结果文件
 * @param {string} content - 结果文件内容
 * @param {number} playerNum - 选手编号
 * @returns {Object} - 解析后的结果对象
 */
function parseResultFile(content, playerNum) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
        player: playerNum,
        total: 0,
        maxScore: 0,
        cases: [],
        passed: 0,
        failed: 0
    };

    let foundTotal = false;

    for (const line of lines) {
        // 解析格式：Player N
        if (line.startsWith('Player')) {
            continue;
        }

        // 新格式：编号 分值 状态 时间ms 内存KB
        const newCaseMatch = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(\d+)ms\s+(\d+)KB$/);
        if (newCaseMatch) {
            const caseNum = parseInt(newCaseMatch[1]);
            const score = parseInt(newCaseMatch[2]);
            const status = newCaseMatch[3].trim();
            const memoryKb = parseInt(newCaseMatch[5]);

            result.cases.push({
                caseNum: caseNum,
                score: score,
                status: status,
                passed: status.toLowerCase() === 'accepted',
                memoryKb: memoryKb
            });

            if (status.toLowerCase() === 'accepted') {
                result.passed++;
            } else {
                result.failed++;
            }
            continue;
        }

        // 旧格式：编号 分值 状态
        const caseMatch = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
        if (caseMatch) {
            const caseNum = parseInt(caseMatch[1]);
            const score = parseInt(caseMatch[2]);
            const status = caseMatch[3].trim();

            result.cases.push({
                caseNum: caseNum,
                score: score,
                status: status,
                passed: status.toLowerCase() === 'accepted',
                memoryKb: 0
            });

            if (status.toLowerCase() === 'accepted') {
                result.passed++;
            } else {
                result.failed++;
            }
            continue;
        }

        // 解析最后一行：总分
        const totalMatch = line.match(/^(\d+)$/);
        if (totalMatch && !foundTotal) {
            result.total = parseInt(totalMatch[1]);
            foundTotal = true;
        }
    }

    // 计算总分（如果文件中没有总分行）
    if (!foundTotal) {
        result.total = result.cases.reduce((sum, c) => sum + c.score, 0);
    }

    // 计算满分
    result.maxScore = result.cases.length > 0 ?
        Math.max(...result.cases.map(c => c.score)) * result.cases.length : 0;

    return result;
}

/**
 * 评测完成后清理临时文件
 * @param {Object} config - 配置对象
 * @param {number} playerCount - 选手数量
 * @param {string} basePath - 基础路径
 */
function cleanupTempFiles(config, playerCount, basePath) {
    const problemPrefix = config.problemPrefix || 'problem';

    for (let i = 1; i <= playerCount; i++) {
        const playerDir = path.join(basePath, String(i));
        const exeFile = path.join(playerDir, `${problemPrefix}.exe`);
        const outFile = path.join(playerDir, `${problemPrefix}.out`);

        // 删除exe文件
        if (fs.existsSync(exeFile)) {
            try {
                fs.unlinkSync(exeFile);
                logger.debug(`已清理: ${exeFile}`);
            } catch (e) {
                logger.warn(`清理失败: ${exeFile}`);
            }
        }

        // 也清理.out文件（程序原始输出）
        if (fs.existsSync(outFile)) {
            try {
                fs.unlinkSync(outFile);
            } catch (e) {
                // 忽略
            }
        }
    }
}

/**
 * 打印评测结果摘要
 * @param {Object} results - 评测结果对象
 */
function printResultSummary(results) {
    logger.divider('=', 60);
    logger.title('评测结果摘要');
    logger.divider('-', 60);

    const players = Object.keys(results);
    let totalPassed = 0;
    let totalFailed = 0;

    for (const playerKey of players) {
        const player = results[playerKey];

        if (player.error) {
            console.log(`${playerKey}: ❌ ${player.error}`);
            totalFailed++;
            continue;
        }

        // 检测是否含 UKE 状态（源码违规）
        const hasUke = player.cases.some(c => c.status && c.status.toLowerCase() === 'unknown error');
        const allPassed = player.passed === player.cases.length;
        const status = allPassed ? '✅' :
                      hasUke ? '⛔' :
                      player.passed > 0 ? '⚠️' : '❌';

        const scoreColor = hasUke ? chalk.magentaBright : chalk.white;
        console.log(`${playerKey}: ${status} ${scoreColor(`得分 ${player.total}/${player.maxScore}`)} ` +
                   `(通过 ${player.passed}/${player.cases.length})`);

        if (allPassed) {
            totalPassed++;
        } else {
            totalFailed++;
        }
    }

    logger.divider('-', 60);
    console.log(`\n总计: ${players.length} 名选手`);
    console.log(`  完全通过: ${totalPassed} 人`);
    console.log(`  部分通过/未通过: ${totalFailed} 人`);
    logger.divider('=', 60);
}

/**
 * 获取详细的评测结果字符串
 * @param {Object} playerResult - 单个选手的评测结果
 * @returns {string} - 格式化的结果字符串
 */
function getDetailedResult(playerResult) {
    if (playerResult.error) {
        return `错误: ${playerResult.error}`;
    }

    const lines = [`Player ${playerResult.player}`];
    for (const c of playerResult.cases) {
        const status = c.passed ? '✓' : '✗';
        const statusStr = c.passed ? c.status : getStatusColor(c.status)(c.status);
        lines.push(`  测试点 ${c.caseNum}: ${status} ${statusStr} (${c.score}分)`);
    }
    lines.push(`总分: ${playerResult.total}/${playerResult.maxScore}`);

    return lines.join('\n');
}

const languages = require('../languages');

/**
 * 比较输出和答案是否一致
 * @param {string} output - 程序输出
 * @param {string} answer - 正确答案
 * @returns {boolean} - 是否一致
 */
function compareOutput(output, answer) {
    const normalize = (str) => str.replace(/\r\n/g, '\n').trim();
    return normalize(output) === normalize(answer);
}

/**
 * 使用语言适配器评测单个选手
 * @param {Object} adapter - 语言适配器实例
 * @param {number} playerNum - 选手编号
 * @param {Object} config - 配置对象
 * @param {Object} options - 选项
 * @param {Function} options.onCaseProgress - 单个测试点进度回调
 * @returns {Promise<Object>} - 评测结果
 */
async function judgePlayerWithAdapter(adapter, playerNum, config, options = {}) {
    const problemPrefix = config.problemPrefix || 'problem';
    const testCaseCount = config.testCaseCount || 1;
    const timeLimitMs = config.timeLimitMs || 1000;
    const scorePerCase = config.scorePerCase || 10;
    const basePath = options.basePath || config.basePath || '.';
    const outputLimitKb = config.outputLimitKb || 1024;

    const playerDir = path.join(basePath, String(playerNum));
    const sourceExt = adapter.extensions[0];
    const sourceFile = path.join(playerDir, `${problemPrefix}${sourceExt}`);
    const outputFile = path.join(playerDir, `${problemPrefix}_out.txt`);

    const result = {
        player: playerNum,
        total: 0,
        maxScore: 0,
        cases: [],
        passed: 0,
        failed: 0
    };

    if (!fs.existsSync(sourceFile)) {
        result.error = `源文件不存在: ${sourceFile}`;
        return result;
    }

    const compileOptions = {
        gppPath: config.gppPath,
        cppVersion: config.cppVersion,
        compileFlags: config.compileFlags,
        pythonPath: config.pythonPath,
        javacPath: config.javacPath,
        javaPath: config.javaPath
    };

    const compileResult = await adapter.compile(sourceFile, outputFile, compileOptions);
    if (!compileResult.success) {
        for (let i = 1; i <= testCaseCount; i++) {
            result.cases.push({
                caseNum: i,
                score: 0,
                status: 'Compile Error',
                passed: false
            });
            result.failed++;
        }
        result.maxScore = testCaseCount * scorePerCase;
        result.error = compileResult.error;
        return result;
    }

    const runOptions = {
        gppPath: config.gppPath,
        pythonPath: config.pythonPath,
        javaPath: config.javaPath,
        outputLimitKb: outputLimitKb,
        classDir: compileResult.classDir,
        mainClass: compileResult.mainClass
    };

    for (let caseNum = 1; caseNum <= testCaseCount; caseNum++) {
        const inputFile = path.join(basePath, `${problemPrefix}${caseNum}.in`);
        const answerFile = path.join(basePath, `${problemPrefix}${caseNum}.ans`);

        let caseResult;

        if (!fs.existsSync(inputFile)) {
            caseResult = {
                caseNum: caseNum,
                score: 0,
                status: 'Input File Not Found',
                passed: false,
                memoryKb: 0
            };
        } else {
            const runResult = await adapter.run(
                sourceFile,
                inputFile,
                null,
                timeLimitMs,
                runOptions
            );

            let status = runResult.status;
            let score = 0;
            let passed = false;

            if (status === 'AC') {
                if (fs.existsSync(answerFile)) {
                    const answer = fs.readFileSync(answerFile, 'utf-8');
                    if (compareOutput(runResult.output, answer)) {
                        status = 'Accepted';
                        score = scorePerCase;
                        passed = true;
                    } else {
                        status = 'Wrong Answer';
                    }
                } else {
                    status = 'Accepted';
                    score = scorePerCase;
                    passed = true;
                }
            } else if (status === 'TLE') {
                status = 'Time Limit Exceeded';
            } else if (status === 'RTE') {
                status = 'Runtime Error';
            } else if (status === 'OLE') {
                status = 'Output Limit Exceeded';
            } else if (status === 'MLE') {
                status = 'Memory Limit Exceeded';
            } else if (status === 'UKE') {
                status = 'Unknown Error';
            }

            caseResult = {
                caseNum: caseNum,
                score: score,
                status: status,
                passed: passed,
                memoryKb: runResult.memoryKb !== undefined ? runResult.memoryKb : 0
            };
        }

        result.cases.push(caseResult);

        if (caseResult.passed) {
            result.passed++;
        } else {
            result.failed++;
        }

        result.total += caseResult.score;

        if (options.onCaseProgress && typeof options.onCaseProgress === 'function') {
            try {
                options.onCaseProgress({
                    player: playerNum,
                    case: caseNum,
                    totalCases: testCaseCount,
                    status: caseResult.status,
                    score: caseResult.score,
                    passed: caseResult.passed,
                    memoryKb: caseResult.memoryKb
                });
            } catch (e) {
                // 忽略回调错误
            }
        }
    }

    result.maxScore = testCaseCount * scorePerCase;

    adapter.cleanup(outputFile);

    return result;
}

/**
 * 使用语言适配器执行评测
 * @param {Object} config - 配置对象
 * @param {Object} options - 额外选项
 * @param {number} options.playerCount - 选手数量
 * @param {string} options.basePath - 基础路径
 * @param {boolean} options.verbose - 是否详细输出
 * @param {Function} options.onProgress - 实时进度回调（每个测试点调用）
 * @returns {Promise<Object>} - 评测结果
 */
async function runJudgeWithAdapter(config, options = {}) {
    logger.setVerbose(options.verbose || false);

    const configPath = path.join(process.cwd(), 'ojtool.json');
    if (!fs.existsSync(configPath)) {
        logger.error('配置文件 ojtool.json 不存在，请先运行 ojtool init 初始化');
        throw new Error('ojtool.json not found');
    }

    const playerCount = options.playerCount || config.playerCount;
    const basePath = options.basePath || config.basePath;
    const language = config.language || 'cpp';
    const testCaseCount = config.testCaseCount || 1;

    if (!playerCount) {
        logger.error('缺少选手数量配置，请在 ojtool.json 中配置 playerCount 或通过参数指定');
        throw new Error('playerCount is required');
    }

    if (!basePath) {
        logger.error('缺少基础路径配置，请在 ojtool.json 中配置 basePath 或通过参数指定');
        throw new Error('basePath is required');
    }

    if (!isPathSafe(basePath)) {
        logger.error('路径遍历检测: basePath 不允许包含 ".." 或其他危险路径组件');
        throw new PathError('Invalid basePath: path traversal detected');
    }

    const adapter = languages.getByName(language);
    if (!adapter) {
        logger.error(`不支持的语言: ${language}`);
        throw new Error(`Unsupported language: ${language}`);
    }

    logger.info('开始评测...');
    logger.debug(`编程语言: ${language}`);
    logger.debug(`选手数量: ${playerCount}`);
    logger.debug(`基础路径: ${basePath}`);

    const results = {};
    const totalSteps = playerCount * testCaseCount;
    let currentStep = 0;

    const caseProgressOptions = {
        ...options,
        onCaseProgress: (caseInfo) => {
            currentStep++;
            if (options.onProgress && typeof options.onProgress === 'function') {
                try {
                    options.onProgress({
                        ...caseInfo,
                        player: caseInfo.player,
                        case: caseInfo.case,
                        totalPlayers: playerCount,
                        totalCases: testCaseCount,
                        totalSteps: totalSteps,
                        currentStep: currentStep
                    });
                } catch (e) {
                    // 忽略回调错误
                }
            }
        }
    };

    for (let i = 1; i <= playerCount; i++) {
        logger.debug(`正在评测选手 ${i}...`);
        const playerResult = await judgePlayerWithAdapter(adapter, i, config, caseProgressOptions);
        results[`player${i}`] = playerResult;

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

        const status = playerResult.passed === playerResult.cases.length ? '✅' :
                      playerResult.passed > 0 ? '⚠️' : '❌';
        console.log(`选手 ${i}: ${status} 得分 ${playerResult.total}/${playerResult.maxScore} ` +
                   `(通过 ${playerResult.passed}/${playerResult.cases.length})`);
    }

    logger.success('评测完成');

    return {
        success: true,
        results: results
    };
}

module.exports = {
    getJudgerPath,
    runJudge,
    runJudgeWithAdapter,
    parseResults,
    parseResultFile,
    cleanupTempFiles,
    printResultSummary,
    getDetailedResult,
    parseJsonLines,
    extractJsonLines,
    createStreamingJsonParser,
    shortStatusToFull,
    getStatusColor,
    createJsonLineParser,
    processJsonObject,
    compareOutput,
    judgePlayerWithAdapter
};