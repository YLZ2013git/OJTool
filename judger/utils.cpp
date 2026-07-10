// utils.cpp - 通用工具函数实现
#include "utils.h"

string trim(const string& s) {
    size_t start = s.find_first_not_of(" \t\r\n");
    size_t end = s.find_last_not_of(" \t\r\n");
    return (start == string::npos || end == string::npos) ? "" : s.substr(start, end - start + 1);
}

string sanitizePath(const string& input) {
    string result;
    for (char c : input) {
        if (c != '"' && c != ';' && c != '|' && c != '&' && c != '$' && c != '`' && c != '\n' && c != '\r') {
            result += c;
        }
    }
    return result;
}

string expandEnvVars(const string& input) {
    DWORD needed = ExpandEnvironmentStringsA(input.c_str(), NULL, 0);
    if (needed == 0) {
        return input;
    }
    vector<char> expanded(needed);
    DWORD result = ExpandEnvironmentStringsA(input.c_str(), expanded.data(), needed);
    if (result > 0 && result <= needed) {
        return string(expanded.data());
    }
    return input;
}

string parseJsonString(const string& content, const string& key) {
    string searchKey = "\"" + key + "\"";
    size_t pos = content.find(searchKey);
    if (pos == string::npos) return "";

    size_t colonPos = content.find(":", pos + searchKey.length());
    if (colonPos == string::npos) return "";

    size_t startQuote = content.find("\"", colonPos + 1);
    if (startQuote == string::npos) return "";

    size_t endQuote = content.find("\"", startQuote + 1);
    if (endQuote == string::npos) return "";

    return content.substr(startQuote + 1, endQuote - startQuote - 1);
}

int parseJsonInt(const string& content, const string& key) {
    string searchKey = "\"" + key + "\"";
    size_t pos = content.find(searchKey);
    if (pos == string::npos) return 0;

    size_t colonPos = content.find(":", pos + searchKey.length());
    if (colonPos == string::npos) return 0;

    size_t start = content.find_first_of("-0123456789", colonPos + 1);
    if (start == string::npos) return 0;

    size_t end = start;
    while (end < content.length() && (isdigit(content[end]) || content[end] == '-')) {
        end++;
    }

    return atoi(content.substr(start, end - start).c_str());
}

bool parseJsonBool(const string& content, const string& key) {
    string searchKey = "\"" + key + "\"";
    size_t pos = content.find(searchKey);
    if (pos == string::npos) return false;

    size_t colonPos = content.find(":", pos + searchKey.length());
    if (colonPos == string::npos) return false;

    // 在冒号后查找 true 或 1
    size_t truePos = content.find("true", colonPos + 1);
    if (truePos != string::npos && truePos - colonPos <= 10) {
        return true;
    }
    size_t onePos = content.find("1", colonPos + 1);
    if (onePos != string::npos && onePos - colonPos <= 5) {
        // 确认是独立的 1（不是数字的一部分）
        char prev = onePos > 0 ? content[onePos - 1] : ' ';
        char next = onePos + 1 < content.length() ? content[onePos + 1] : ' ';
        if (!isdigit((unsigned char)prev) && !isdigit((unsigned char)next)) {
            return true;
        }
    }
    return false;
}

string escapeJsonString(const string& s) {
    string result;
    for (char c : s) {
        switch (c) {
            case '"':  result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;
            default:   result += c; break;
        }
    }
    return result;
}
