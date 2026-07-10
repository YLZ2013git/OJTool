const fs = require('fs');
const path = require('path');
const jsonReporter = require('./json');

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function statusColor(status) {
    const s = (status || '').toUpperCase();
    if (s === 'AC' || s === 'ACCEPTED') return '#10b981';
    if (s === 'WA' || s === 'WRONG ANSWER') return '#ef4444';
    if (s === 'TLE' || s === 'TIME LIMIT EXCEEDED') return '#f59e0b';
    if (s === 'RTE' || s === 'RUNTIME ERROR') return '#8b5cf6';
    if (s === 'CE' || s === 'COMPILE ERROR') return '#6b7280';
    if (s === 'MLE' || s === 'MEMORY LIMIT EXCEEDED') return '#ec4899';
    if (s === 'OLE' || s === 'OUTPUT LIMIT EXCEEDED') return '#f97316';
    if (s === 'PA') return '#3b82f6';
    if (s === 'ERROR') return '#dc2626';
    return '#6b7280';
}

function statusBgClass(status) {
    const s = (status || '').toUpperCase();
    if (s === 'AC' || s === 'ACCEPTED') return 'bg-ac';
    if (s === 'WA' || s === 'WRONG ANSWER') return 'bg-wa';
    if (s === 'TLE' || s === 'TIME LIMIT EXCEEDED') return 'bg-tle';
    if (s === 'RTE' || s === 'RUNTIME ERROR') return 'bg-rte';
    if (s === 'CE' || s === 'COMPILE ERROR') return 'bg-ce';
    if (s === 'MLE' || s === 'MEMORY LIMIT EXCEEDED') return 'bg-mle';
    if (s === 'PA') return 'bg-pa';
    if (s === 'ERROR') return 'bg-error';
    return 'bg-gray';
}

function generateHtmlReport(results, config, options = {}) {
    const report = jsonReporter.generateReport(results, config, options);
    return renderHtml(report);
}

function renderHtml(report) {
    const { metadata, players, ranking, problems, statistics } = report;
    const generatedAt = new Date(metadata.generatedAt).toLocaleString('zh-CN');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>评测报告 - ${escapeHtml(metadata.toolName)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    background: #f1f5f9;
    color: #1e293b;
    line-height: 1.6;
    padding: 20px;
}
.container { max-width: 1200px; margin: 0 auto; }
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 32px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.header h1 { font-size: 28px; margin-bottom: 8px; }
.header .meta { opacity: 0.9; font-size: 14px; }
.card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
}
.card h2 {
    font-size: 20px;
    margin-bottom: 16px;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
}
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
}
.stat-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    border-left: 4px solid #667eea;
}
.stat-card .value { font-size: 28px; font-weight: 700; color: #0f172a; }
.stat-card .label { font-size: 13px; color: #64748b; margin-top: 4px; }
table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}
th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}
th {
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
tr:hover { background: #f8fafc; }
.rank-1 { background: #fef3c7 !important; }
.rank-2 { background: #f1f5f9 !important; }
.rank-3 { background: #fed7aa !important; }
.status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
}
.bg-ac { background: #10b981; }
.bg-wa { background: #ef4444; }
.bg-tle { background: #f59e0b; }
.bg-rte { background: #8b5cf6; }
.bg-ce { background: #6b7280; }
.bg-mle { background: #ec4899; }
.bg-pa { background: #3b82f6; }
.bg-error { background: #dc2626; }
.bg-gray { background: #9ca3af; }
.player-section { margin-bottom: 16px; }
.player-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
}
.player-header:hover { background: #e2e8f0; }
.player-header .player-info {
    display: flex;
    align-items: center;
    gap: 12px;
}
.player-header .rank-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #667eea;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
}
.player-header .score {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
}
.player-detail {
    display: none;
    padding: 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 8px 8px;
}
.player-detail.active { display: block; }
.problem-block { margin-bottom: 16px; }
.problem-block h4 {
    font-size: 15px;
    margin-bottom: 8px;
    color: #334155;
}
.case-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.case-item {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: white;
    cursor: help;
    position: relative;
}
.case-item .tooltip {
    visibility: hidden;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    z-index: 10;
    margin-bottom: 6px;
}
.case-item:hover .tooltip { visibility: visible; }
.bar-chart { margin-top: 16px; }
.bar-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 12px;
}
.bar-label {
    width: 120px;
    font-size: 13px;
    color: #475569;
    text-align: right;
    flex-shrink: 0;
}
.bar-container {
    flex: 1;
    height: 24px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}
.bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 4px;
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    color: white;
    font-size: 11px;
    font-weight: 600;
    min-width: 40px;
}
.bar-value {
    width: 60px;
    font-size: 13px;
    color: #0f172a;
    font-weight: 600;
    flex-shrink: 0;
}
.arrow {
    display: inline-block;
    transition: transform 0.2s;
    font-size: 12px;
}
.arrow.down { transform: rotate(90deg); }
.footer {
    text-align: center;
    color: #94a3b8;
    font-size: 12px;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
}
@media (max-width: 768px) {
    body { padding: 10px; }
    .header { padding: 20px; }
    .header h1 { font-size: 22px; }
    .card { padding: 16px; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .stat-card .value { font-size: 22px; }
    th, td { padding: 8px 6px; font-size: 12px; }
    .bar-label { width: 80px; font-size: 11px; }
}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🏆 评测报告</h1>
        <div class="meta">
            工具: ${escapeHtml(metadata.toolName)} v${escapeHtml(metadata.toolVersion)} |
            生成时间: ${escapeHtml(generatedAt)} |
            语言: ${escapeHtml(metadata.configSummary.language)} |
            选手数: ${metadata.configSummary.playerCount}
        </div>
    </div>

    <div class="card">
        <h2>📊 统计概览</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${statistics.totalPlayers}</div>
                <div class="label">参赛选手</div>
            </div>
            <div class="stat-card">
                <div class="value">${statistics.totalProblems}</div>
                <div class="label">题目数量</div>
            </div>
            <div class="stat-card">
                <div class="value">${statistics.avgScore.toFixed(1)}</div>
                <div class="label">平均得分</div>
            </div>
            <div class="stat-card">
                <div class="value">${statistics.avgSolved.toFixed(1)}</div>
                <div class="label">平均通过题数</div>
            </div>
            <div class="stat-card">
                <div class="value">${statistics.overallPassRate.toFixed(1)}%</div>
                <div class="label">总通过率</div>
            </div>
            <div class="stat-card">
                <div class="value">${statistics.totalCases}</div>
                <div class="label">测试用例总数</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>📈 各题通过率</h2>
        <div class="bar-chart">
            ${statistics.problemStats.map(ps => `
            <div class="bar-row">
                <div class="bar-label">${escapeHtml(ps.problemName)}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${Math.max(ps.passRate, 5)}%">
                        ${ps.passRate >= 15 ? ps.passRate.toFixed(1) + '%' : ''}
                    </div>
                </div>
                <div class="bar-value">${ps.solvedBy}/${statistics.totalPlayers}</div>
            </div>
            `).join('')}
        </div>
    </div>

    <div class="card">
        <h2>🏅 排行榜</h2>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>选手</th>
                        <th>总分</th>
                        <th>通过题数</th>
                        ${problems.map(p => `<th>${escapeHtml(p.name)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${ranking.map((r, idx) => {
                        const player = players.find(p => p.id === r.id);
                        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
                        return `
                    <tr class="${rankClass}">
                        <td><strong>#${r.rank}</strong></td>
                        <td>${escapeHtml(r.name)}</td>
                        <td><strong>${r.totalScore}</strong></td>
                        <td>${r.solvedCount}/${problems.length}</td>
                        ${player ? player.problems.map(pr => `
                        <td>
                            <span class="status-badge ${statusBgClass(pr.status)}">
                                ${pr.score}/${pr.maxScore}
                            </span>
                        </td>
                        `).join('') : problems.map(() => '<td>-</td>').join('')}
                    </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <h2>👤 选手详情</h2>
        ${ranking.map(r => {
            const player = players.find(p => p.id === r.id);
            if (!player) return '';
            return `
        <div class="player-section">
            <div class="player-header" onclick="togglePlayer('player-${player.id}')">
                <div class="player-info">
                    <div class="rank-num">${r.rank}</div>
                    <div>
                        <strong>${escapeHtml(player.name)}</strong>
                        ${player.error ? `<span style="color:#dc2626;font-size:12px;"> (${escapeHtml(player.error)})</span>` : ''}
                    </div>
                </div>
                <div>
                    <span class="score">${player.totalScore}</span> 分
                    <span class="arrow" id="arrow-player-${player.id}">▶</span>
                </div>
            </div>
            <div class="player-detail" id="player-${player.id}">
                ${player.problems.map(pr => `
                <div class="problem-block">
                    <h4>
                        <span class="status-badge ${statusBgClass(pr.status)}">${pr.status}</span>
                        ${escapeHtml(pr.problemName)} - ${pr.score}/${pr.maxScore} 分
                        (${pr.passed}/${pr.passed + pr.failed} 通过)
                    </h4>
                    <div class="case-list">
                        ${(pr.cases || []).map(c => `
                        <div class="case-item" style="background: ${statusColor(c.status)}">
                            ${c.caseNum}
                            <span class="tooltip">${escapeHtml(c.status)} - ${c.score}分</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
            `;
        }).join('')}
    </div>

    <div class="footer">
        由 ${escapeHtml(metadata.toolName)} v${escapeHtml(metadata.toolVersion)} 生成
    </div>
</div>

<script>
function togglePlayer(id) {
    const detail = document.getElementById(id);
    const arrow = document.getElementById('arrow-' + id);
    detail.classList.toggle('active');
    arrow.classList.toggle('down');
}
</script>
</body>
</html>`;
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
    generateReport: generateHtmlReport,
    saveReport,
    renderHtml
};
