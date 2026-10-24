// 王书阁：历史、趋势、导出与记录删除页面。
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadFile, request, RecordPage, RecordTrendPoint, RecordTrends } from '../services/api';

const PAGE_SIZE = 10;

export default function Records(){
  const [page,setPage]=useState(1),[refresh,setRefresh]=useState(0),[data,setData]=useState<RecordPage|null>(null),[trends,setTrends]=useState<RecordTrendPoint[]>([]);
  const [shared,setShared]=useState(false),[days,setDays]=useState(30),[error,setError]=useState(''),[busy,setBusy]=useState(true),[action,setAction]=useState('');

  useEffect(()=>{
    let active=true; setBusy(true); setError('');
    Promise.all([
      request<RecordPage>(`/records?shared=${shared}&page=${page}&page_size=${PAGE_SIZE}`),
      request<RecordTrends>(`/records/trends?shared=${shared}&days=${days}`),
    ]).then(([records, summary])=>{if(active){setData(records);setTrends(summary.days);}})
      .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[shared,page,days,refresh]);

  async function remove(id:string){
    if(!window.confirm('确定删除这条记录吗？删除后不能恢复。'))return;
    setAction(id);setError('');
    try{await request(`/records/${id}`,{method:'DELETE'});if(page>1&&data?.items.length===1)setPage(p=>p-1);else setRefresh(value=>value+1);}
    catch(e){setError((e as Error).message);}finally{setAction('');}
  }

  return <section><p className="eyebrow">记录业务 · 王书阁</p><h1>历史记录</h1>
    <div className="record-toolbar"><label className="inline"><input type="checkbox" checked={shared} onChange={e=>{setShared(e.target.checked);setPage(1);}} />查看授权给我的记录</label><label className="inline">趋势范围<select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 天</option><option value={30}>30 天</option><option value={90}>90 天</option></select></label></div>
    <p role="status">{busy?'加载中…':error}</p>
    {!busy&&!error&&<>
      <div className="trend-summary"><strong>趋势概览</strong><span>近 {days} 天记录：{trends.reduce((sum,item)=>sum+item.records,0)} 条</span><span>有心率数据的日期：{trends.filter(item=>item.heart_rate_bpm!=null).length} 天</span></div>
      {trends.length>0&&<div className="trend-list">{trends.map(item=><div className="trend-point" key={item.date}><span>{item.date}</span><span>{item.records} 条</span><span>{item.heart_rate_bpm==null?'暂无心率':`平均 ${item.heart_rate_bpm} 次/分`}</span></div>)}</div>}
      {!data?.items.length&&<p>暂无记录</p>}
      {data?.items.map(r=><div className="row" key={r.id}><span>{new Date(r.created_at).toLocaleString()}<small>{r.id}</small></span><span className="row-actions"><Link to={'/records/'+r.id}>查看详情</Link><button className="link-button" disabled={action===r.id||shared} onClick={()=>void downloadFile(`/records/${r.id}/export?format=csv`,`ecg-record-${r.id}.csv`).catch(e=>setError(e.message))}>导出 CSV</button><button className="danger-link" disabled={action===r.id||shared} onClick={()=>void remove(r.id)}>删除</button></span></div>)}
      {data&&data.pages>1&&<div className="pager"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page} / {data.pages} 页，共 {data.total} 条</span><button disabled={page>=data.pages} onClick={()=>setPage(p=>p+1)}>下一页</button></div>}
    </>}
  </section>;
}
