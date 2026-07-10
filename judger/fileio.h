// fileio.h - 文件 IO 工具函数声明
#ifndef JUDGER_FILEIO_H
#define JUDGER_FILEIO_H

#include "common.h"

// 判断文件是否存在
bool fileExists(const string& filename);

// 把文件按行读取到 vector，每行已 trim
bool readFileToVector(const string& filename, vector<string>& lines);

// 读取整个文件内容到字符串
bool readFileToString(const string& filename, string& content);

// 获取文件大小（字节），失败返回 0
long long getFileSize(const string& filename);

// 复制文件（二进制），目标存在则先删除
bool copyFile(const string& srcPath, const string& dstPath);

// 删除文件，不存在视为成功
bool deleteFile(const string& filename);

#endif // JUDGER_FILEIO_H
