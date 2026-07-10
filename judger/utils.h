// utils.h - 通用工具函数声明
// 包含字符串处理、路径净化、环境变量展开、简易 JSON 解析等
#ifndef JUDGER_UTILS_H
#define JUDGER_UTILS_H

#include "common.h"

// 去除字符串首尾空白字符
string trim(const string& s);

// 净化路径，移除可能用于命令注入的危险字符（" ; | & $ ` 换行）
string sanitizePath(const string& input);

// 展开 Windows 环境变量（如 %TEMP%）
string expandEnvVars(const string& input);

// 从 JSON 文本中按 key 解析字符串值（简易实现）
string parseJsonString(const string& content, const string& key);

// 从 JSON 文本中按 key 解析整数值（简易实现）
int parseJsonInt(const string& content, const string& key);

// 从 JSON 文本中按 key 解析布尔值（默认 false，识别 true/1）
bool parseJsonBool(const string& content, const string& key);

// 转义 JSON 字符串中的特殊字符
string escapeJsonString(const string& s);

#endif // JUDGER_UTILS_H
