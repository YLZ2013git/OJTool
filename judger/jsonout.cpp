// jsonout.cpp - JSON 行输出函数实现
#include "jsonout.h"
#include "result.h"

void outputJsonPlayerStart(int player) {
    cout << "{\"type\":\"player_start\",\"player\":" << player << "}" << endl;
}

void outputJsonResult(int player, int caseNum, JudgeResult status, int score, int timeMs, int memoryKb) {
    cout << "{\"type\":\"result\",\"player\":" << player
         << ",\"case\":" << caseNum
         << ",\"status\":\"" << resultToShortString(status) << "\""
         << ",\"score\":" << score
         << ",\"timeMs\":" << timeMs
         << ",\"memoryKb\":" << memoryKb
         << "}" << endl;
}

void outputJsonPlayerEnd(int player, int totalScore, int maxScore) {
    cout << "{\"type\":\"player_end\",\"player\":" << player
         << ",\"totalScore\":" << totalScore
         << ",\"maxScore\":" << maxScore
         << "}" << endl;
}

void outputJsonDone(int playerCount) {
    cout << "{\"type\":\"done\",\"playerCount\":" << playerCount << "}" << endl;
}
