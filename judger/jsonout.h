// jsonout.h - JSON 行输出函数声明
// judger 与 Node.js 端通过 stdout 的 JSON 行协议通信
#ifndef JUDGER_JSONOUT_H
#define JUDGER_JSONOUT_H

#include "common.h"
#include "result.h"

// 输出选手开始评测事件
void outputJsonPlayerStart(int player);

// 输出单个测试点结果
void outputJsonResult(int player, int caseNum, JudgeResult status, int score, int timeMs, int memoryKb);

// 输出选手评测结束事件（含总分）
void outputJsonPlayerEnd(int player, int totalScore, int maxScore);

// 输出全部评测完成事件
void outputJsonDone(int playerCount);

#endif // JUDGER_JSONOUT_H
