/**
 * ECG Health System - API 服务层
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ 认证 ============

  async login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  // ============ 分析 ============

  async analyzeECG(file: File, leadType: string = 'single', patientId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lead_type', leadType);
    if (patientId) {
      formData.append('patient_id', patientId);
    }

    return this.request('/analyze/ecg', {
      method: 'POST',
      headers: {}, // 不设置 Content-Type 让浏览器自动设置
      body: formData,
    });
  }

  async getAnalysisResult(taskId: string) {
    return this.request(`/analyze/${taskId}`);
  }

  // ============ 记录 ============

  async getRecords(params: {
    page?: number;
    page_size?: number;
    patient_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return this.request(`/records?${searchParams}`);
  }

  // ============ 系统 ============

  async getHealth() {
    return this.request('/health');
  }

  async getMetrics() {
    return this.request('/metrics');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
