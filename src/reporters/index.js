const jsonReporter = require('./json');
const htmlReporter = require('./html');
const markdownReporter = require('./markdown');

const reporters = {
    json: jsonReporter,
    html: htmlReporter,
    md: markdownReporter,
    markdown: markdownReporter
};

function getReporter(format) {
    const fmt = (format || 'html').toLowerCase();
    const reporter = reporters[fmt];
    if (!reporter) {
        throw new Error(`不支持的报告格式: ${format}，支持的格式: json, html, md`);
    }
    return reporter;
}

function getDefaultExtension(format) {
    const fmt = (format || 'html').toLowerCase();
    if (fmt === 'json') return '.json';
    if (fmt === 'html') return '.html';
    if (fmt === 'md' || fmt === 'markdown') return '.md';
    return '.html';
}

function generateAndSaveReport(results, config, options = {}) {
    const format = options.format || 'html';
    let outputPath = options.output;

    const formats = [];
    if (format === 'all') {
        formats.push('json', 'html', 'md');
    } else {
        formats.push(format);
    }

    const outputFiles = {};

    for (const fmt of formats) {
        const reporter = getReporter(fmt);
        const report = reporter.generateReport(results, config, options);

        let filePath = outputPath;
        if (!filePath) {
            filePath = `report${getDefaultExtension(fmt)}`;
        } else if (formats.length > 1) {
            const ext = getDefaultExtension(fmt);
            const base = outputPath.replace(/\.[^.]+$/, '');
            filePath = base + ext;
        }

        reporter.saveReport(report, filePath);
        outputFiles[fmt] = filePath;
    }

    return outputFiles;
}

module.exports = {
    reporters,
    getReporter,
    getDefaultExtension,
    generateAndSaveReport,
    json: jsonReporter,
    html: htmlReporter,
    markdown: markdownReporter
};
