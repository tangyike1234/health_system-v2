/**
 * 仪表盘页面
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, AlertTriangle, Wifi } from 'lucide-react';
import { useRealtimeStore } from '../../stores';

// 模拟数据
const mockWaveformData = Array.from({ length: 100 }, (_, i) => ({
  index: i,
  value: Math.sin(i * 0.3) * 50 + Math.random() * 10,
}));

const Dashboard = () => {
  const { isConnected, currentRhythm, heartRate, confidence, alert } = useRealtimeStore();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">实时监测</h1>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${isConnected ? 'status-online' : 'status-offline'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
      </div>

      {/* 告警横幅 */}
      {alert.level && (
        <div className={`alert-${alert.level} border-l-4 p-4 rounded`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* 实时波形 */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            实时心电图
          </span>
          <span className="text-sm text-gray-500">500 Hz</span>
        </div>
        <div className="card-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockWaveformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="index" hide />
              <YAxis domain={[-100, 100]} hide />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 心率 */}
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">心率</p>
              <p className="text-2xl font-bold">{heartRate || '--'} <span className="text-sm font-normal">BPM</span></p>
            </div>
          </div>
        </div>

        {/* 心律 */}
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">心律</p>
              <p className="text-2xl font-bold">{currentRhythm === 'normal' ? '正常' : currentRhythm}</p>
            </div>
          </div>
        </div>

        {/* 置信度 */}
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">置信度</p>
              <p className="text-2xl font-bold">{Math.round(confidence * 100)}<span className="text-sm font-normal">%</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
