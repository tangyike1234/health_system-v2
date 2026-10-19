/**
 * 分析页面
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useAnalysisStore } from '../stores';
import api from '../services/api';

const Analyze = () => {
  const [file, setFile] = useState<File | null>(null);
  const [leadType, setLeadType] = useState<'single' | '12-lead'>('single');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { status, result, error, setStatus, setResult, setError, reset } = useAnalysisStore();
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validExtensions = ['.dat', '.csv', '.edf'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setError('不支持的文件格式，请上传 .dat、.csv 或 .edf 文件');
      return;
    }
    
    setFile(selectedFile);
    reset();
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setStatus('uploading');
    setError(null);

    try {
      const response = await api.analyzeECG(file, leadType) as any;
      setStatus('processing');
      
      // 轮询结果
      const pollResult = async () => {
        const result = await api.getAnalysisResult(response.task_id) as any;
        if (result.status === 'completed') {
          setResult(result);
        } else if (result.status === 'failed') {
          setError('分析失败');
        } else {
          setTimeout(pollResult, 1000);
        }
      };
      
      pollResult();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ECG 分析</h1>

      {/* 文件上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".dat,.csv,.edf"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              拖拽文件到此处或{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:underline"
              >
                点击上传
              </button>
            </p>
            <p className="text-sm text-gray-400">
              支持 .dat、.csv、.edf 格式
            </p>
          </>
        )}
      </div>

      {/* 导联类型 */}
      <div className="card">
        <div className="card-body">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            导联类型
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="leadType"
                value="single"
                checked={leadType === 'single'}
                onChange={() => setLeadType('single')}
                className="text-blue-600"
              />
              <span>单导联</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="leadType"
                value="12-lead"
                checked={leadType === '12-lead'}
                onChange={() => setLeadType('12-lead')}
                className="text-blue-600"
              />
              <span>12 导联</span>
            </label>
          </div>
        </div>
      </div>

      {/* 上传按钮 */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? '上传中...' : '开始分析'}
      </button>

      {/* 错误显示 */}
      {error && (
        <div className="alert-critical border p-4 rounded flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* 结果显示 */}
      {result && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>分析完成</span>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">心律</p>
                <p className="text-lg font-medium">
                  {result.result?.classification?.rhythm === 'normal' ? '正常' : result.result?.classification?.rhythm}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">置信度</p>
                <p className="text-lg font-medium">
                  {Math.round(result.result?.classification?.confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">信号质量</p>
                <p className="text-lg font-medium">
                  {Math.round(result.result?.signal_quality * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">处理时间</p>
                <p className="text-lg font-medium">
                  {result.result?.processing_time_ms} ms
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/records')}
              className="btn btn-secondary w-full"
            >
              查看历史记录
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyze;
