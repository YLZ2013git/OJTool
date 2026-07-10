# Makefile - judger 工程构建脚本
# 用法：
#   make           # 构建 bin/judger.exe
#   make checkers  # 构建内置 SPJ checker（ncmp/fcmp/rcmp4）
#   make clean     # 清理产物
#   make all       # 等同于 make
#
# 说明：
#   - judger.exe 用 -std=c++17 编译（自身）
#   - checker 用 -std=c++14（NOIP 标准），-I. 用于找到 testlib.h
#   - default 类型不走外部 checker，由 judger 内置 compareAnswer 实现，
#     因此 checkers 目标不编译 default.exe（也避免 Windows 上 default.exe
#     文件名与系统冲突）。default.cpp 仅作为参考实现保留。

CXX = g++
CXXFLAGS = -std=c++17 -O2 -static
LDFLAGS = -lpsapi

SRCS = main.cpp result.cpp utils.cpp fileio.cpp runner.cpp checker.cpp jsonout.cpp config.cpp
OBJS = $(SRCS:.cpp=.o)

TARGET = ../bin/judger.exe

# 仅编译实际需要外部 exe 的 checker（default 走内置 compareAnswer）
CHECKERS = checkers/ncmp.exe checkers/fcmp.exe checkers/rcmp4.exe

all: $(TARGET)

$(TARGET): $(OBJS)
	@if not exist ..\bin mkdir ..\bin
	$(CXX) $(CXXFLAGS) -o $@ $(OBJS) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

checkers: $(CHECKERS)

checkers/%.exe: checkers/%.cpp testlib.h
	$(CXX) -std=c++14 -O2 -I. -o $@ $<

clean:
	@del /Q *.o 2>nul
	@del /Q $(TARGET) 2>nul
	@del /Q checkers\*.exe 2>nul

.PHONY: all clean checkers
