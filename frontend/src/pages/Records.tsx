// 王书阁：历史与共享记录页面。
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, RecordRow } from '../services/api';
export default function Records(){
  const [rows,setRows]=useState<RecordRow[]>([]),[shared,setShared]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(true);
  useEffect(()=>{let active=true;setBusy(true);setError('');request<RecordRow[]>('/records?shared='+shared).then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[shared]);
  return <section><p className="eyebrow">记录业务 · 王书阁</p><h1>历史记录</h1><label className="inline"><input type="checkbox" checked={shared} onChange={e=>setShared(e.target.checked)} />查看授权给我的记录</label><p role="status">{busy?'加载中…':error}</p>{!busy&&!error&&!rows.length&&<p>暂无记录</p>}{!busy&&!error&&rows.map(r=><div className="row" key={r.id}><span>{new Date(r.created_at).toLocaleString()}<small>{r.id}</small></span><Link to={'/records/'+r.id}>查看详情</Link></div>)}</section>;
}
