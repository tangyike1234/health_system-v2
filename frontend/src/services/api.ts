// 共享请求适配；各业务页面由对应负责人维护。
export interface RecordResult {
  id: string; created_at: string; task_status: string;
  result: {
    source: string; waveform: number[]; sample_rate_hz: number; unit: string; duration_sec: number;
    quality: {status: string; reasons: string[]; scope: string; score?: number; grade?: string};
    prediction: {
      status: string; label: string | null; confidence: number | null; explanation: string;
      heart_rate?: {bpm: number; min_bpm?: number; max_bpm?: number; rr_cv?: number; regularity?: string};
      beats?: {count: number; vpc_count?: number};
      explanation_detail?: {
        elderly_summary?: string; professional_interpretation?: string;
        evidence?: string[]; uncertainty?: string[]; reassurance?: string;
        next_steps?: string[]; risk_level?: string; provider?: string;
      };
    };
  };
}
export interface RecordRow {id: string; created_at: string;}
export interface Grant {id: string; username: string; active: number;}
export interface Notification {id: string; message: string; status: string;}
const base = '/api/v1';
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = sessionStorage.getItem('ecg_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(base + path, {...options, headers});
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {sessionStorage.removeItem('ecg_token'); window.dispatchEvent(new Event('ecg:logout'));}
    throw new Error(typeof data.detail === 'string' ? data.detail : `请求失败 (${response.status})`);
  }
  return data as T;
}
export function post<T>(path: string, body: unknown = {}) {return request<T>(path, {method:'POST', body:JSON.stringify(body)});}
