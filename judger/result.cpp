// result.cpp - 评测结果枚举与转换函数实现
#include "result.h"

string resultToString(JudgeResult res) {
    switch (res) {
        case AC:  return "Accepted";
        case CE:  return "Compile Error";
        case RTE: return "Runtime Error";
        case TLE: return "Time Limit Exceeded";
        case OLE: return "Output Limit Exceeded";
        case MLE: return "Memory Limit Exceeded";
        case WA:  return "Wrong Answer";
        case UKE: return "Unknown Error";
        default: return "Unknown";
    }
}

string resultToShortString(JudgeResult res) {
    switch (res) {
        case AC:  return "AC";
        case CE:  return "CE";
        case RTE: return "RTE";
        case TLE: return "TLE";
        case OLE: return "OLE";
        case MLE: return "MLE";
        case WA:  return "WA";
        case UKE: return "UKE";
        default: return "UKN";
    }
}
