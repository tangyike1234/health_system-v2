/**
 * R 峰检测 - C 语言头文件
 */

#ifndef RPEAK_H
#define RPEAK_H

#include <stdint.h>

// ============================================================================
// R 峰检测器
// ============================================================================

typedef struct {
    // 配置
    int sample_rate;
    int window_size;         // 积分窗口大小 (ms)
    int min_rr_interval;     // 最小 RR 间期 (ms)
    
    // 中间缓冲
    int16_t* filtered;       // 带通滤波后的信号
    float* squared;          // 平方后的信号
    float* integrated;       // 积分后的信号
    
    // 状态
    int buffer_len;
    int write_pos;
    
    // 阈值
    float threshold;
    float threshold_coef;    // 阈值系数
} RPeakDetector;

// ============================================================================
// 函数声明
// ============================================================================

/**
 * 初始化 R 峰检测器
 */
void rpeak_init(RPeakDetector* detector, int sample_rate);

/**
 * 释放资源
 */
void rpeak_free(RPeakDetector* detector);

/**
 * 检测 R 峰位置
 * @param peaks 输出数组，存储峰位置索引
 * @param max_peaks 输出数组最大长度
 * @return 检测到的峰数量
 */
int detect_rpeaks(RPeakDetector* detector, 
                   const int16_t* signal, int signal_len,
                   int32_t* peaks, int max_peaks);

/**
 * 计算心率 (BPM)
 */
float compute_heart_rate(const int32_t* peaks, int count, int sample_rate);

/**
 * 计算 RMSSD (HRV 指标)
 */
float compute_rmssd(const int32_t* peaks, int count, int sample_rate);

/**
 * 重置检测器状态
 */
void rpeak_reset(RPeakDetector* detector);

#endif // RPEAK_H
