// runner.cpp - 程序运行/管理工具函数实现
#include "runner.h"

bool runCommand(const string& cmdLine, const string& workDir, int& exitCode) {
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(STARTUPINFOA);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;

    vector<char> cmdBuffer(cmdLine.size() + 1);
    copy(cmdLine.begin(), cmdLine.end(), cmdBuffer.begin());
    cmdBuffer[cmdLine.size()] = '\0';

    if (!CreateProcessA(NULL, cmdBuffer.data(), NULL, NULL, FALSE, 0, NULL, workDir.c_str(), &si, &pi)) {
        cerr << "错误: 创建进程失败，错误码：" << GetLastError() << endl;
        return false;
    }

    WaitForSingleObject(pi.hProcess, INFINITE);
    GetExitCodeProcess(pi.hProcess, (LPDWORD)&exitCode);

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return true;
}

JudgeResult runProgramWithCheck(const string& exePath, const string& workDir,
                                const string& inFile, const string& outFile,
                                int timeLimitMs, int memoryLimitKb,
                                int& timeMs, int& memoryKb) {
    SECURITY_ATTRIBUTES sa = {0};
    sa.nLength = sizeof(SECURITY_ATTRIBUTES);
    sa.bInheritHandle = TRUE;
    sa.lpSecurityDescriptor = NULL;

    HANDLE hInput = CreateFileA(inFile.c_str(), GENERIC_READ,
        FILE_SHARE_READ, &sa, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

    if (hInput == INVALID_HANDLE_VALUE) {
        cerr << "错误: 无法打开输入文件 " << inFile << endl;
        timeMs = 0;
        memoryKb = 0;
        return RTE;
    }

    HANDLE hOutput = CreateFileA(outFile.c_str(), GENERIC_WRITE,
        FILE_SHARE_READ, &sa, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);

    if (hOutput == INVALID_HANDLE_VALUE) {
        cerr << "错误: 无法创建输出文件 " << outFile << endl;
        CloseHandle(hInput);
        timeMs = 0;
        memoryKb = 0;
        return RTE;
    }

    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(STARTUPINFOA);
    si.dwFlags = STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW;
    si.hStdInput = hInput;
    si.hStdOutput = hOutput;
    si.hStdError = GetStdHandle(STD_ERROR_HANDLE);
    si.wShowWindow = SW_HIDE;

    string cmdStr = "\"" + exePath + "\"";
    vector<char> cmdBuffer(cmdStr.size() + 1);
    copy(cmdStr.begin(), cmdStr.end(), cmdBuffer.begin());
    cmdBuffer[cmdStr.size()] = '\0';

    DWORD startTime = GetTickCount();

    if (!CreateProcessA(NULL, cmdBuffer.data(), NULL, NULL, TRUE, 0, NULL, workDir.c_str(), &si, &pi)) {
        cerr << "错误: 创建选手程序失败，错误码：" << GetLastError() << endl;
        CloseHandle(hInput);
        CloseHandle(hOutput);
        timeMs = 0;
        memoryKb = 0;
        return RTE;
    }

    JudgeResult result = AC;
    int peakMemoryKb = 0;
    const int checkIntervalMs = 10;
    DWORD elapsed = 0;

    while (true) {
        DWORD waitResult = WaitForSingleObject(pi.hProcess, checkIntervalMs);
        elapsed = GetTickCount() - startTime;

        PROCESS_MEMORY_COUNTERS pmc;
        if (GetProcessMemoryInfo(pi.hProcess, &pmc, sizeof(pmc))) {
            int currentMemoryKb = (int)(pmc.PeakWorkingSetSize / 1024);
            if (currentMemoryKb > peakMemoryKb) {
                peakMemoryKb = currentMemoryKb;
            }
            if (memoryLimitKb > 0 && peakMemoryKb > memoryLimitKb) {
                TerminateProcess(pi.hProcess, 1);
                result = MLE;
                timeMs = (int)elapsed;
                memoryKb = peakMemoryKb;
                CloseHandle(pi.hProcess);
                CloseHandle(pi.hThread);
                CloseHandle(hInput);
                CloseHandle(hOutput);
                return result;
            }
        }

        if (waitResult == WAIT_OBJECT_0) {
            break;
        }

        if (elapsed >= (DWORD)timeLimitMs) {
            TerminateProcess(pi.hProcess, 1);
            result = TLE;
            timeMs = timeLimitMs;
            memoryKb = peakMemoryKb;
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            CloseHandle(hInput);
            CloseHandle(hOutput);
            return result;
        }
    }

    DWORD endTime = GetTickCount();
    timeMs = (int)(endTime - startTime);

    PROCESS_MEMORY_COUNTERS pmcFinal;
    if (GetProcessMemoryInfo(pi.hProcess, &pmcFinal, sizeof(pmcFinal))) {
        peakMemoryKb = max(peakMemoryKb, (int)(pmcFinal.PeakWorkingSetSize / 1024));
    }
    memoryKb = peakMemoryKb;

    if (memoryLimitKb > 0 && peakMemoryKb > memoryLimitKb) {
        result = MLE;
    } else {
        DWORD exitCode;
        GetExitCodeProcess(pi.hProcess, &exitCode);
        if (exitCode != 0) {
            result = RTE;
        }
    }

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    CloseHandle(hInput);
    CloseHandle(hOutput);
    return result;
}
