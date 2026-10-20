// 王书阁：记录与分析页面；唐一可提供统一分析结果。
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { post, request, RecordResult } from '../services/api';
import Waveform from '../components/Waveform';
export default function Analyze(){
  const {id}=useParams();const navigate=useNavigate();
  const [file,setFile]=useState<File|null>(null),[rate,setRate]=useState(250),[record,setRecord]=useState<RecordResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;setRecord(null);setError('');if(id)request<RecordResult>('/records/'+id).then(r=>{if(active)setRecord(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
  async function run(replay=false){setBusy(true);setError('');try{let r:RecordResult;if(replay)r=await post('/acquisition/replay');else{if(!file)throw Error('请选择 CSV');const body=new FormData();body.append('file',file);body.append('sample_rate_hz',String(rate));r=await request('/analyze/ecg',{method:'POST',body});}navigate('/records/'+r.id);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <section><p className="eyebrow">记录与分析 · 王书阁</p><h1>{id?'记录详情':'新建记录'}</h1>{!id&&<><p>首版支持单列 CSV（单位 mV，可含 value/sample/mv 表头）。采样率请按数据实际填写。</p><form onSubmit={(e:FormEvent)=>{e.preventDefault();void run();}}><label>CSV 文件<input type="file" accept=".csv" required onChange={e=>setFile(e.target.files?.[0]||null)} /></label><label>采样率 Hz<input type="number" min="50" max="2000" value={rate} onChange={e=>setRate(Number(e.target.value))} required /></label><div className="actions"><button disabled={busy}>导入并分析</button><button type="button" className="secondary" disabled={busy} onClick={()=>void run(true)}>使用合成回放</button></div></form></>}
    <p role="status">{busy?'处理与保存中…':error}</p>{record&&<article><p>{new Date(record.created_at).toLocaleString()} · {record.result.source}</p><h2>{record.result.quality.status==='insufficient'?'数据不足':'仅通过基础有效性检查'}</h2><p>{record.result.quality.scope}</p><p>{record.result.quality.reasons.join('；')}</p><Waveform values={record.result.waveform} duration={record.result.duration_sec} unit={record.result.unit} /><p>{record.result.prediction.explanation}</p><p>分类：{record.result.prediction.label??'暂无结果'} · 心率：尚未实现</p></article>}</section>;
}
