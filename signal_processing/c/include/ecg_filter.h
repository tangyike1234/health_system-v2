/**
 * ECG Filter - C 语言头文件
 */

#ifndef ECG_FILTER_H
#define ECG_FILTER_H

#include <stdint.h>

// ============================================================================
// 滤波器配置
// ============================================================================

#define MAX_FILTER_ORDER 4

typedef struct {
    // 滤波器系数
    float b[MAX_FILTER_ORDER + 1];
    float a[MAX_FILTER_ORDER + 1];
    
    // 状态 (用于双二阶级联)
    float x_history[2];
    float y_history[2];
    
    // 配置
    int order;
    float cutoff_low;   // 低频截止 (Hz)
    float cutoff_high;  // 高频截止 (Hz)
    int sample_rate;
} EcgFilter;

// ============================================================================
// 函数声明
// ============================================================================

/**
 * 初始化高通滤波器 (去除基线漂移)
 * 截止频率: 0.5 Hz
 */
void highpass_filter_init(EcgFilter* filter, int sample_rate);

/**
 * 初始化低通滤波器 (去除高频噪声)
 * 截止频率: 45 Hz
 */
void lowpass_filter_init(EcgFilter* filter, int sample_rate);

/**
 * 初始化工频陷波滤波器
 * 陷波频率: 50 Hz
 */
void notch_filter_init(EcgFilter* filter, int sample_rate);

/**
 * 初始化带通滤波器 (R 峰检测专用)
 * 通带: 5-15 Hz
 */
void bandpass_filter_init(EcgFilter* filter, int sample_rate);

/**
 * 应用滤波器
 * @param input  输入信号
 * @param output 输出信号
 * @param len    信号长度
 */
void filter_apply(EcgFilter* filter, const int16_t* input, 
                  int16_t* output, int len);

/**
 * 重置滤波器状态
 */
void filter_reset(EcgFilter* filter);

#endif // ECG_FILTER_H
