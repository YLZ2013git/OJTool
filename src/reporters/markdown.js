const fs = require('fs');
const path = require('path');
const jsonReporter = require('./json');

function statusEmoji(status) {
    const s = (status || '').toUpperCase();
    if (s === 'AC' || s === 'ACCEPTED') return '✅';
    if (s === 'WA' || s === 'WRONG ANSWER') return '❌';
    if (s === 'TLE' || s === 'TIME LIMIT EXCEEDED') return '⏱️';
    if (s === 'RTE' || s === 'RUNTIME ERROR') return '💥';
    if (s === 'CE' || s === 'COMPILE ERROR') return '⚙️';
    if (s === 'MLE' || s === 'MEMORY LIMIT EXCEEDED') return '🧠';
    if (s === 'OLE' || s === 'OUTPUT LIMIT EXCEEDED') return '📝';
    if (s === 'PA') return '📊';
    if (s === 'ERROR') return '⚠️';
    return '❓';
}

function generateMarkdownReport(results, config, options = {}) {
    const report = jsonReporter.generateReport(results, config, options);
    return renderMarkdown(report);
}

function renderMarkdown(report) {
    const { metadata, players, ranking, problems, statistics } = report;
    const generatedAt = new Date(metadata.generatedAt).toLocaleString('zh-CN');

    let md = '';

    md += '# 🏆 评测报告\n\n';
    md += `> 工具: **${metadata.toolName} v${metadata.toolVersion}**  \n`;
    md += `> 生成时间: **${generatedAt}**  \n`;
    md += `> 编程语言: **${metadata.configSummary.language}**  \n`;
    md += `> 参赛选手: **${statistics.totalPlayers}** 人  \n\n`;

    md += '---\n\n';

    md += '## 📊 统计概览\n\n';
    md += '| 指标 | 数值 |\n';
    md += '|------|------|\n';
    md += `| 参赛选手 | ${statistics.totalPlayers} 人 |\n`;
    md += `| 题目数量 | ${statistics.totalProblems} 题 |\n`;
    md += `| 平均得分 | ${statistics.avgScore.toFixed(1)} 分 |\n`;
    md += `| 平均通过题数 | ${statistics.avgSolved.toFixed(1)} 题 |\n`;
    md += `| 总通过率 | ${statistics.overallPassRate.toFixed(1)}% |\n`;
    md += `| 测试用例总数 | ${statistics.totalCases} 个 |\n`;
    md += `| 总通过用例 | ${statistics.totalPassedCases} 个 |\n\n`;

    md += '### 各状态分布\n\n';
    const statusEntries = Object.entries(statistics.statusCounts || {});
    if (statusEntries.length > 0) {
        md += '| 状态 | 数量 | 占比 |\n';
        md += '|------|------|------|\n';
        for (const [status, count] of statusEntries) {
            const pct = statistics.totalCases > 0 ? ((count / statistics.totalCases) * 100).toFixed(1) : '0.0';
            md += `| ${statusEmoji(status)} ${status} | ${count} | ${pct}% |\n`;
        }
        md += '\n';
    }

    md += '---\n\n';

    md += '## 📈 各题统计\n\n';
    md += '| 题目 | 满分 | 通过人数 | 通过率 | 平均分 | 用例通过率 |\n';
    md += '|------|------|----------|--------|--------|------------|\n';
    for (const ps of statistics.problemStats) {
        md += `| ${ps.problemName} | ${ps.maxScore} | ${ps.solvedBy}/${statistics.totalPlayers} | ${ps.solveRate.toFixed(1)}% | ${ps.avgScore.toFixed(1)} | ${ps.passRate.toFixed(1)}% |\n`;
    }
    md += '\n';

    md += '---\n\n';

    md += '## 🏅 排行榜\n\n';

    let header = '| 排名 | 选手 | 总分 | 通过题数 |';
    let separator = '|------|------|------|----------|';
    for (const p of problems) {
        header += ` ${p.name} |`;
        separator += '------|';
    }
    md += header + '\n';
    md += separator + '\n';

    for (const r of ranking) {
        const player = players.find(p => p.id === r.id);
        let row = `| ${r.rank} | ${r.name} | ${r.totalScore} | ${r.solvedCount}/${problems.length} |`;
        if (player) {
            for (const pr of player.problems) {
                row += ` ${statusEmoji(pr.status)} ${pr.score}/${pr.maxScore} |`;
            }
        } else {
            for (let i = 0; i < problems.length; i++) {
                row += ' - |';
            }
        }
        md += row + '\n';
    }
    md += '\n';

    md += '---\n\n';

    md += '## 👤 选手详情\n\n';

    for (const r of ranking) {
        const player = players.find(p => p.id === r.id);
        if (!player) continue;

        md += `### #${r.rank} ${player.name}\n\n`;
        md += `- **总分**: ${player.totalScore} 分\n`;
        md += `- **通过题数**: ${player.solvedCount}/${problems.length} 题\n`;
        if (player.error) {
            md += `- **错误**: ${player.error}\n`;
        }
        md += '\n';

        for (const pr of player.problems) {
            md += `#### ${statusEmoji(pr.status)} ${pr.problemName}\n\n`;
            md += `- **状态**: ${pr.status}\n`;
            md += `- **得分**: ${pr.score}/${pr.maxScore} 分\n`;
            md += `- **通过**: ${pr.passed}/${pr.passed + pr.failed} 个测试点\n`;
            if (pr.error) {
                md += `- **错误**: ${pr.error}\n`;
            }
            md += '\n';

            if (pr.cases && pr.cases.length > 0) {
                md += '| 测试点 | 状态 | 得分 |\n';
                md += '|--------|------|------|\n';
                for (const c of pr.cases) {
                    md += `| ${c.caseNum} | ${statusEmoji(c.status)} ${c.status} | ${c.score} |\n`;
                }
                md += '\n';
            }
        }

        md += '---\n\n';
    }

    md += `\n---\n\n*由 ${metadata.toolName} v${metadata.toolVersion} 生成*\n`;

    return md;
}

function saveReport(report, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, report, 'utf-8');
    return outputPath;
}

module.exports = {
    generateReport: generateMarkdownReport,
    saveReport,
    renderMarkdown
};
