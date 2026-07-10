// fileio.cpp - 文件 IO 工具函数实现
#include "fileio.h"
#include "utils.h"

bool fileExists(const string& filename) {
    return GetFileAttributesA(filename.c_str()) != INVALID_FILE_ATTRIBUTES;
}

bool readFileToVector(const string& filename, vector<string>& lines) {
    lines.clear();
    if (!fileExists(filename)) {
        cerr << "错误: 文件不存在 " << filename << endl;
        return false;
    }
    ifstream fin(filename);
    if (!fin.is_open()) {
        cerr << "错误: 无法打开文件 " << filename << endl;
        return false;
    }
    string line;
    while (getline(fin, line)) {
        lines.push_back(trim(line));
    }
    fin.close();
    return true;
}

bool readFileToString(const string& filename, string& content) {
    if (!fileExists(filename)) {
        return false;
    }
    ifstream fin(filename, ios::binary);
    if (!fin.is_open()) {
        return false;
    }
    stringstream ss;
    ss << fin.rdbuf();
    content = ss.str();
    fin.close();
    return true;
}

long long getFileSize(const string& filename) {
    WIN32_FILE_ATTRIBUTE_DATA fileAttr = {0};
    if (!GetFileAttributesExA(filename.c_str(), GetFileExInfoStandard, &fileAttr)) {
        return 0;
    }
    return ((long long)fileAttr.nFileSizeHigh << 32) | fileAttr.nFileSizeLow;
}

bool copyFile(const string& srcPath, const string& dstPath) {
    if (fileExists(dstPath)) {
        DeleteFileA(dstPath.c_str());
    }
    ifstream src(srcPath, ios::binary);
    ofstream dst(dstPath, ios::binary);
    if (!src.is_open() || !dst.is_open()) {
        cerr << "错误: 复制文件失败 " << srcPath << " -> " << dstPath << endl;
        return false;
    }
    dst << src.rdbuf();
    src.close();
    dst.close();
    return true;
}

bool deleteFile(const string& filename) {
    if (!fileExists(filename)) {
        return true;
    }
    return DeleteFileA(filename.c_str()) != 0;
}
