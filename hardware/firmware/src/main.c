/**
 * ECG Collector - STM32 固件
 * 框架: 初始化 → 采样 → 发送
 */

#include <stdint.h>

// ============ 配置 ============
#define SAMPLE_RATE 500
#define FRAME_SIZE 100

// ============ 主循环框架 ============
/*
int main(void) {
    // 1. 初始化
    system_init();
    adc_init(SAMPLE_RATE);
    uart_init(115200);
    protocol_init();
    
    while (1) {
        // 2. 等待/接收命令 (START/STOP/CONFIG)
        handle_commands();
        
        // 3. 采样数据
        if (is_streaming) {
            // DMA 采集 → 环形缓冲区
            // 凑满一帧 → 发送数据帧
        }
        
        // 4. 心跳保活 (每 5s)
        send_heartbeat();
    }
}
*/

// TODO: 实现以下函数
void system_init(void);
void adc_init(int sample_rate);
void uart_init(int baudrate);
void protocol_init(void);
void handle_commands(void);
int is_streaming(void);
void send_data_frame(void);
void send_heartbeat(void);
