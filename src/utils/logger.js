const chalk = require('chalk');

const LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

class Logger {
    constructor(name = '') {
        this.verbose = false;
        this.name = name;
    }

    setVerbose(v) {
        this.verbose = v;
    }

    getVerbose() {
        return this.verbose;
    }

    _formatPrefix(level) {
        const timestamp = new Date().toLocaleTimeString();
        const namePart = this.name ? `[${this.name}] ` : '';
        return `[${level}] ${timestamp} - ${namePart}`;
    }

    debug(msg) {
        if (this.verbose) {
            const prefix = this._formatPrefix('DEBUG');
            console.log(chalk.gray(`${prefix}${msg}`));
        }
    }

    info(msg) {
        const prefix = this._formatPrefix('INFO');
        console.log(chalk.blue(`${prefix}${msg}`));
    }

    warn(msg) {
        const prefix = this._formatPrefix('WARN');
        console.log(chalk.yellow(`${prefix}${msg}`));
    }

    error(msg) {
        const prefix = this._formatPrefix('ERROR');
        console.log(chalk.red(`${prefix}${msg}`));
    }

    success(msg) {
        const prefix = this._formatPrefix('SUCCESS');
        console.log(chalk.green(`${prefix}${msg}`));
    }

    fail(msg) {
        const prefix = this._formatPrefix('FAIL');
        console.log(chalk.red(`${prefix}${msg}`));
    }

    log(msg) {
        console.log(msg);
    }

    clear() {
        console.clear();
    }

    divider(char = '-', length = 50) {
        console.log(chalk.dim(char.repeat(length)));
    }

    title(title) {
        console.log();
        console.log(chalk.bold.cyan(`═ ${title} ═`));
        console.log();
    }
}

const defaultLogger = new Logger();

module.exports = defaultLogger;
module.exports.Logger = Logger;
module.exports.LEVELS = LEVELS;
