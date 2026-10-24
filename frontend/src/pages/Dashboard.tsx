import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, RecordTrends } from '../services/api';

export default function Dashboard(){
  const [status,setStatus]=useState('读取采集状态…');
  const [summary,setSummary]=useState<RecordTrends|null>(null);
  useEffect(()=>{let active=true;Promise.all([
    request<{message:string}>('/acquisition/status'), request<RecordTrends>('/records/trends?days=30'),
  ]).then(([device,trends])=>{if(active){setStatus(device.message);setSummary(trends);}}).catch(e=>{if(active)setStatus(e.message);});return()=>{active=false;};},[]);
  const recordCount=summary?.days.reduce((sum,item)=>sum+item.records,0)??0;
  return <section><p className="eyebrow">五人协作框架</p><h1>从一份记录开始</h1><p>{status}</p><div className="actions"><Link className="button" to="/analyze">导入或回放</Link><Link className="button secondary" to="/records">查看历史</Link></div>
    <div className="grid"><article><h2>记录与分析</h2><p>上传、结果、历史与数据服务<br/>王书阁</p></article><article><h2>用户与家庭</h2><p>应用框架、账号、授权与站内提示<br/>李运嘉</p></article><article><h2>采集与分析模块</h2><p>刘源 · 设备接入<br/>林玄初 · 数据与信号<br/>唐一可 · AI 与分析集成</p></article></div>
    <article className="dashboard-summary"><h2>最近 30 天</h2><p>已保存记录：{recordCount} 条</p><p>有心率数据的日期：{summary?.days.filter(item=>item.heart_rate_bpm!=null).length??0} 天</p><Link to="/records">查看趋势详情 →</Link></article>
  </section>;
}
