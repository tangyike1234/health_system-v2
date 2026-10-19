/**
 * 历史记录页面
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const Records = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['records', page, searchTerm],
    queryFn: () => api.getRecords({
      page,
      page_size: pageSize,
      patient_id: searchTerm || undefined,
    }) as Promise<any>,
  });

  const getRhythmLabel = (rhythm: string) => {
    const labels: Record<string, string> = {
      normal: '正常',
      atrial_fibrillation: '房颤',
      sinus_tachycardia: '窦性心动过速',
      sinus_bradycardia: '窦性心动过缓',
    };
    return labels[rhythm] || rhythm;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>

      {/* 搜索栏 */}
      <div className="card">
        <div className="card-body flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索患者 ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="card">
        {isLoading ? (
          <div className="card-body text-center py-8">
            <div className="animate-pulse">加载中...</div>
          </div>
        ) : error ? (
          <div className="card-body text-center py-8 text-red-600">
            加载失败，请稍后重试
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="card-body text-center py-8 text-gray-500">
            暂无记录
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-600">患者 ID</th>
                  <th className="text-left p-4 font-medium text-gray-600">心律</th>
                  <th className="text-left p-4 font-medium text-gray-600">时间</th>
                  <th className="text-right p-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((record: any) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{record.patient_id || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        record.rhythm === 'normal'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getRhythmLabel(record.rhythm)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:underline">
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 分页 */}
            {data?.total > pageSize && (
              <div className="card-body flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} 条，
                  共 {data.total} 条
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * pageSize >= data.total}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Records;
