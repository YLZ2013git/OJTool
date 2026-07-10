const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

function buildMetadata(config) {
    return {
        generatedAt: new Date().toISOString(),
        toolVersion: pkg.version,
        toolName: pkg.name,
        configSummary: {
            language: config.language || 'cpp',
            playerCount: config.playerCount || 0,
            testCaseCount: config.testCaseCount || 0,
            timeLimitMs: config.timeLimitMs || 1000,
            scorePerCase: config.scorePerCase || 10,
            isContestMode: !!(config.problems && Array.isArray(config.problems) && config.problems.length > 0)
        }
    };
}

function normalizeSingleProblemResults(results, config) {
    const players = [];
    const problemName = config.problemPrefix || 'problem';
    const problems = [{
        id: 1,
        name: problemName,
        prefix: problemName,
        testCaseCount: config.testCaseCount || 0,
        maxScore: (config.testCaseCount || 0) * (config.scorePerCase || 10),
        timeLimitMs: config.timeLimitMs || 1000
    }];

    const playerKeys = Object.keys(results).sort((a, b) => {
        const numA = parseInt(a.replace('player', ''));
        const numB = parseInt(b.replace('player', ''));
        return numA - numB;
    });

    for (const key of playerKeys) {
        const r = results[key];
        const playerId = r.player !== undefined ? r.player : parseInt(key.replace('player', ''));
        const playerProblems = [];

        if (!r.error) {
            playerProblems.push({
                problemId: 1,
                problemName: problemName,
                score: r.total || 0,
                maxScore: r.maxScore || 0,
                passed: r.passed || 0,
                failed: r.failed || 0,
                status: r.passed === r.cases.length ? 'AC' : (r.passed > 0 ? 'PA' : 'WA'),
                cases: r.cases || []
            });
        } else {
            playerProblems.push({
                problemId: 1,
                problemName: problemName,
                score: 0,
                maxScore: r.maxScore || 0,
                passed: 0,
                failed: r.cases ? r.cases.length : 0,
                status: 'Error',
                error: r.error,
                cases: r.cases || []
            });
        }

        players.push({
            id: playerId,
            name: `选手 ${playerId}`,
            totalScore: r.total || 0,
            maxScore: r.maxScore || 0,
            solvedCount: r.passed === r.cases.length && r.cases.length > 0 ? 1 : 0,
            problems: playerProblems,
            error: r.error || null
        });
    }

    const ranking = buildRanking(players);
    const statistics = buildStatistics(players, problems);

    return { players, ranking, problems, statistics };
}

function normalizeContestResults(contestResult, config) {
    const players = contestResult.players.map(p => ({
        id: p.id,
        name: p.name || `选手 ${p.id}`,
        totalScore: p.totalScore || 0,
        maxScore: (p.problems || []).reduce((sum, pr) => sum + (pr.maxScore || 0), 0),
        solvedCount: p.solvedCount || 0,
        problems: (p.problems || []).map((pr, idx) => ({
            problemId: idx + 1,
            problemName: pr.name,
            score: pr.score || 0,
            maxScore: pr.maxScore || 0,
            passed: pr.passed || 0,
            failed: pr.failed || 0,
            status: pr.status || 'WA',
            error: pr.error || null,
            cases: pr.cases || []
        })),
        error: null
    }));

    const problems = (contestResult.problems || []).map((p, idx) => ({
        id: idx + 1,
        name: p.name,
        prefix: p.prefix,
        testCaseCount: p.testCaseCount || 0,
        maxScore: (p.testCaseCount || 0) * (p.scorePerCase || 10),
        timeLimitMs: p.timeLimitMs || config.timeLimitMs || 1000
    }));

    const ranking = buildRanking(players);
    const statistics = buildStatistics(players, problems);

    return { players, ranking, problems, statistics };
}

function buildRanking(players) {
    const sorted = [...players].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
        }
        if (b.solvedCount !== a.solvedCount) {
            return b.solvedCount - a.solvedCount;
        }
        return a.id - b.id;
    });

    return sorted.map((player, index) => ({
        rank: index + 1,
        id: player.id,
        name: player.name,
        totalScore: player.totalScore,
        solvedCount: player.solvedCount
    }));
}

function buildStatistics(players, problems) {
    const totalPlayers = players.length;
    let totalScore = 0;
    let totalSolved = 0;
    let totalCases = 0;
    let totalPassedCases = 0;
    const statusCounts = {};

    for (const player of players) {
        totalScore += player.totalScore;
        totalSolved += player.solvedCount;

        for (const problem of player.problems) {
            for (const c of problem.cases || []) {
                totalCases++;
                if (c.passed) {
                    totalPassedCases++;
                }
                const status = c.status || 'Unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            }
        }
    }

    const problemStats = problems.map((problem, idx) => {
        let solvedBy = 0;
        let totalProblemScore = 0;
        let problemTotalCases = 0;
        let problemPassedCases = 0;

        for (const player of players) {
            const playerProblem = player.problems[idx];
            if (playerProblem) {
                if (playerProblem.status === 'AC') {
                    solvedBy++;
                }
                totalProblemScore += playerProblem.score || 0;
                for (const c of playerProblem.cases || []) {
                    problemTotalCases++;
                    if (c.passed) {
                        problemPassedCases++;
                    }
                }
            }
        }

        return {
            problemId: problem.id,
            problemName: problem.name,
            solvedBy: solvedBy,
            solveRate: totalPlayers > 0 ? (solvedBy / totalPlayers) * 100 : 0,
            avgScore: totalPlayers > 0 ? totalProblemScore / totalPlayers : 0,
            maxScore: problem.maxScore,
            passRate: problemTotalCases > 0 ? (problemPassedCases / problemTotalCases) * 100 : 0
        };
    });

    return {
        totalPlayers,
        totalProblems: problems.length,
        avgScore: totalPlayers > 0 ? totalScore / totalPlayers : 0,
        totalSolved,
        avgSolved: totalPlayers > 0 ? totalSolved / totalPlayers : 0,
        totalCases,
        totalPassedCases,
        overallPassRate: totalCases > 0 ? (totalPassedCases / totalCases) * 100 : 0,
        statusCounts,
        problemStats
    };
}

function generateReport(results, config, options = {}) {
    const metadata = buildMetadata(config);
    let normalized;

    if (options.mode === 'contest' || (config.problems && Array.isArray(config.problems) && config.problems.length > 0)) {
        normalized = normalizeContestResults(results, config);
    } else {
        normalized = normalizeSingleProblemResults(results, config);
    }

    return {
        metadata,
        players: normalized.players,
        ranking: normalized.ranking,
        problems: normalized.problems,
        statistics: normalized.statistics
    };
}

function saveReport(report, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    return outputPath;
}

module.exports = {
    generateReport,
    saveReport,
    buildMetadata,
    buildRanking,
    buildStatistics,
    normalizeSingleProblemResults,
    normalizeContestResults
};
