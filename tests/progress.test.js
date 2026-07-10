beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
});

process.stdout.write = jest.fn();
console.log = jest.fn();

describe('ProgressBar', () => {
    describe('constructor', () => {
        it('应该正确初始化基本属性', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100, '测试进度');

            expect(pb.total).toBe(100);
            expect(pb.title).toBe('测试进度');
            expect(pb.current).toBe(0);
            expect(pb.statusText).toBe('');
            expect(pb.verbose).toBe(false);
            expect(pb.finished).toBe(false);
            expect(pb.barWidth).toBe(30);
        });

        it('默认 title 为空字符串', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(50);

            expect(pb.title).toBe('');
        });

        it('应该设置 startTime', () => {
            const ProgressBar = require('../src/utils/progress');
            const before = Date.now();
            const pb = new ProgressBar(100);
            const after = Date.now();

            expect(pb.startTime).toBeGreaterThanOrEqual(before);
            expect(pb.startTime).toBeLessThanOrEqual(after);
        });
    });

    describe('setVerbose', () => {
        it('应该设置 verbose 状态', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);

            expect(pb.verbose).toBe(false);
            pb.setVerbose(true);
            expect(pb.verbose).toBe(true);
            pb.setVerbose(false);
            expect(pb.verbose).toBe(false);
        });
    });

    describe('_checkTTY', () => {
        it('应该返回 process.stdout.isTTY 的值', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            expect(typeof pb.isTTY).toBe('boolean');
        });
    });

    describe('_isInteractive', () => {
        it('当 isTTY 为 true 且 verbose 为 false 时返回 true', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = false;
            expect(pb._isInteractive()).toBe(true);
        });

        it('当 isTTY 为 false 时返回 false', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;
            pb.verbose = false;
            expect(pb._isInteractive()).toBe(false);
        });

        it('当 verbose 为 true 时返回 false', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = true;
            expect(pb._isInteractive()).toBe(false);
        });
    });

    describe('_formatTime', () => {
        it('应该正确格式化秒数', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);

            expect(pb._formatTime(0)).toBe('00:00');
            expect(pb._formatTime(1000)).toBe('00:01');
            expect(pb._formatTime(59000)).toBe('00:59');
            expect(pb._formatTime(60000)).toBe('01:00');
            expect(pb._formatTime(3600000)).toBe('60:00');
        });

        it('负数或无效值返回 --:--', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);

            expect(pb._formatTime(-1)).toBe('--:--');
            expect(pb._formatTime(Infinity)).toBe('--:--');
            expect(pb._formatTime(NaN)).toBe('--:--');
        });
    });

    describe('_calculateETA', () => {
        it('current 为 0 时返回 Infinity', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.current = 0;
            expect(pb._calculateETA()).toBe(Infinity);
        });

        it('应该根据进度计算预计剩余时间', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.startTime = Date.now() - 10000;
            pb.current = 50;

            const eta = pb._calculateETA();
            expect(eta).toBeGreaterThan(0);
            expect(eta).toBeLessThan(20000);
        });
    });

    describe('_buildBar', () => {
        it('进度为 0 时应该返回空进度条', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.barWidth = 10;
            const bar = pb._buildBar(0);
            expect(bar).toBeDefined();
            expect(bar.length).toBeGreaterThan(0);
        });

        it('进度为 1 时应该返回满进度条', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.barWidth = 10;
            const bar = pb._buildBar(1);
            expect(bar).toBeDefined();
            expect(bar.length).toBeGreaterThan(0);
        });

        it('进度为 0.5 时应该返回半满进度条', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.barWidth = 10;
            const bar = pb._buildBar(0.5);
            expect(bar).toBeDefined();
            expect(bar.length).toBeGreaterThan(0);
        });
    });

    describe('_buildLine', () => {
        it('应该构建包含百分比的进度行', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100, '测试');
            pb.current = 50;
            pb.startTime = Date.now() - 5000;

            const line = pb._buildLine();
            expect(line).toContain('测试');
            expect(line).toContain('50.0%');
            expect(line).toContain('50/100');
            expect(line).toContain('ETA:');
        });

        it('没有 title 时不显示 title', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.current = 0;

            const line = pb._buildLine();
            expect(line).not.toContain('undefined');
        });

        it('有 statusText 时应该显示状态文字', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100, '测试');
            pb.current = 50;
            pb.statusText = '正在处理...';

            const line = pb._buildLine();
            expect(line).toContain('正在处理...');
        });

        it('total 为 0 时不报错', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(0);
            pb.current = 0;

            const line = pb._buildLine();
            expect(line).toBeDefined();
            expect(line).toContain('0/0');
        });

        it('current 超过 total 时百分比不超过 100%', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.current = 150;

            const line = pb._buildLine();
            expect(line).toContain('100.0%');
        });
    });

    describe('update', () => {
        it('应该更新 current 和 statusText', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;

            pb.update(50, '测试中');
            expect(pb.current).toBe(50);
            expect(pb.statusText).toBe('测试中');
        });

        it('非交互模式下不调用 process.stdout.write', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;

            pb.update(50);
            expect(process.stdout.write).not.toHaveBeenCalled();
        });

        it('交互模式下调用 process.stdout.write', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = false;
            pb.lastUpdateTime = 0;

            pb.update(50);
            expect(process.stdout.write).toHaveBeenCalled();
        });

        it('finished 状态下 update 不做任何事', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;
            pb.finished = true;

            pb.update(50);
            expect(pb.current).toBe(0);
        });

        it('update 节流 - 50ms 内的连续调用只渲染一次', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = false;
            pb.lastUpdateTime = 0;

            pb.update(10);
            const firstCallCount = process.stdout.write.mock.calls.length;

            pb.lastUpdateTime = Date.now();
            pb.update(20);
            expect(process.stdout.write.mock.calls.length).toBe(firstCallCount);
        });
    });

    describe('finish', () => {
        it('应该设置 finished 为 true 并更新 current 为 total', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;

            pb.finish();
            expect(pb.finished).toBe(true);
            expect(pb.current).toBe(100);
        });

        it('重复调用 finish 不会重复执行', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = false;

            pb.finish();
            const writeCount = process.stdout.write.mock.calls.length;

            pb.finish();
            expect(process.stdout.write.mock.calls.length).toBe(writeCount);
        });

        it('非交互模式下 finish 不输出', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;

            pb.finish();
            expect(process.stdout.write).not.toHaveBeenCalled();
        });
    });

    describe('interrupt', () => {
        it('非交互模式下直接输出消息', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = false;

            pb.interrupt('中断消息');
            expect(console.log).toHaveBeenCalledWith('中断消息');
        });

        it('交互模式下先清除进度条再输出消息', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = false;
            pb._lastOutputLength = 50;

            pb.interrupt('测试中断');

            expect(process.stdout.write).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('测试中断');
        });

        it('未完成时中断后恢复进度条显示', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.verbose = false;
            pb.finished = false;
            pb._lastOutputLength = 50;
            pb.lastUpdateTime = 0;

            const beforeCount = process.stdout.write.mock.calls.length;
            pb.interrupt('测试');
            const afterCount = process.stdout.write.mock.calls.length;

            expect(afterCount).toBeGreaterThan(beforeCount);
        });
    });

    describe('整体功能流程', () => {
        it('完整流程测试 - 创建、更新、完成', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(10, '下载');
            pb.isTTY = false;

            expect(pb.current).toBe(0);
            expect(pb.finished).toBe(false);

            pb.update(3, '下载中...');
            expect(pb.current).toBe(3);
            expect(pb.statusText).toBe('下载中...');

            pb.update(7);
            expect(pb.current).toBe(7);

            pb.finish();
            expect(pb.finished).toBe(true);
            expect(pb.current).toBe(10);
        });

        it('verbose 模式下完全不输出进度条', () => {
            const ProgressBar = require('../src/utils/progress');
            const pb = new ProgressBar(100);
            pb.isTTY = true;
            pb.setVerbose(true);

            pb.update(50);
            pb.finish();

            expect(process.stdout.write).not.toHaveBeenCalled();
        });
    });
});
