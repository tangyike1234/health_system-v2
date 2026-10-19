/**
 * 公共定义
 */

#ifndef COMMON_H
#define COMMON_H

#include <stdint.h>
#include <stdbool.h>

// ============================================================================
// 类型定义
// ============================================================================

typedef int16_t ecg_sample_t;    // ECG 采样值类型
typedef int32_t timestamp_t;      // 时间戳类型

// ============================================================================
// 常量
// ============================================================================

#define DEFAULT_SAMPLE_RATE 500
#define MAX_SAMPLES 4096
#define ECG_BUFFER_SIZE 2048

// 信号范围 (假设 12-bit ADC, 0-4095)
// 实际应用中需要根据硬件定标
#define ECG_MIN_VALUE 0
#define ECG_MAX_VALUE 4095
#define ECG_MIDDLE 2048

// ============================================================================
// 错误码
// ============================================================================

typedef enum {
    ECG_OK = 0,
    ECG_ERROR_INVALID_PARAM = -1,
    ECG_ERROR_BUFFER_FULL = -2,
    ECG_ERROR_NO_MEMORY = -3,
    ECG_ERROR_NOT_INITIALIZED = -4
} EcgError;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 计算 CRC16
 */
uint16_t crc16(const uint8_t* data, int len);

/**
 * 限幅
 */
int16_t saturate(int32_t value, int16_t min_val, int16_t max_val);

/**
 * 毫秒转采样数
 */
int ms_to_samples(int ms, int sample_rate);

#endif // COMMON_H
