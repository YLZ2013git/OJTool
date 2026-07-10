const chalk = require('chalk');

class ProgressBar {
    constructor(total, title = '') {
        this.total = total;
        this.title = title;
        this.current = 0;
        this.statusText = '';
        this.startTime = Date.now();
        this.lastUpdateTime = 0;
        this.isTTY = this._checkTTY();
        this.verbose = false;
        this.barWidth = 30;
        this.finished = false;
        this._lastOutputLength = 0;
    }

    _checkTTY() {
        return process.stdout.isTTY || false;
    }

    setVerbose(v) {
        this.verbose = v;
    }

    _isInteractive() {
        return this.isTTY && !this.verbose;
    }

    _formatTime(ms) {
        if (ms < 0 || !isFinite(ms)) {
            return '--:--';
        }
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    _calculateETA() {
        if (this.current === 0) {
            return Infinity;
        }
        const elapsed = Date.now() - this.startTime;
        const rate = this.current / elapsed;
        if (rate === 0) {
            return Infinity;
        }
        const remaining = (this.total - this.current) / rate;
        return remaining;
    }

    _buildBar(progress) {
        const filled = Math.floor(progress * this.barWidth);
        const empty = this.barWidth - filled;
        const filledStr = chalk.green('█'.repeat(filled));
        const emptyStr = chalk.gray('░'.repeat(empty));
        return `${filledStr}${emptyStr}`;
    }

    _buildLine() {
        const progress = this.total > 0 ? Math.min(this.current / this.total, 1) : 0;
        const percent = (progress * 100).toFixed(1);
        const bar = this._buildBar(progress);
        const eta = this._calculateETA();
        const etaStr = this._formatTime(eta);

        const titlePart = this.title ? `${this.title} ` : '';
        const statusPart = this.statusText ? ` ${this.statusText}` : '';

        return `${titlePart}[${bar}] ${percent}% (${this.current}/${this.total}) ETA: ${etaStr}${statusPart}`;
    }

    update(current, statusText = '') {
        if (this.finished) {
            return;
        }

        this.current = current;
        if (statusText !== undefined) {
            this.statusText = statusText;
        }

        if (!this._isInteractive()) {
            return;
        }

        const now = Date.now();
        if (now - this.lastUpdateTime < 50) {
            return;
        }
        this.lastUpdateTime = now;

        this._render();
    }

    _render() {
        const line = this._buildLine();
        const paddedLine = line.padEnd(this._lastOutputLength, ' ');
        process.stdout.write(`\r${paddedLine}`);
        this._lastOutputLength = line.length;
    }

    finish() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        this.current = this.total;

        if (this._isInteractive()) {
            this._render();
            process.stdout.write('\n');
        }
    }

    interrupt(message) {
        if (this._isInteractive()) {
            const clearLine = ' '.repeat(this._lastOutputLength);
            process.stdout.write(`\r${clearLine}\r`);
        }
        console.log(message);
        if (this._isInteractive() && !this.finished) {
            this._render();
        }
    }
}

module.exports = ProgressBar;
