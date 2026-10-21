// 王书阁：记录与分析页面；唐一可提供统一分析结果。
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { post, request, RecordResult, AnalysisTask } from '../services/api';
import Waveform from '../components/Waveform';
export default function Analyze(){
  const {id}=useParams();const navigate=useNavigate();
  const [search,setSearch]=useSearchParams(); const taskId=search.get("task");
  const [task,setTask]=useState<AnalysisTask|null>(null);
  useEffect(()=>{if(!taskId||id)return;let active=true;let timer:ReturnType<typeof setTimeout>;setTask(null);setError("");setBusy(true);async function poll(){try{const t=await request<AnalysisTask>("/tasks/"+taskId);if(!active)return;setTask(t);if(t.status==="completed"&&t.record_id){navigate("/records/"+t.record_id,{replace:true});setBusy(false);}else if(t.status==="failed"){setError(t.error||"分析失败，请重新提交");setBusy(false);}else{timer=setTimeout(poll,1000);}}catch(e){if(active){setError((e as Error).message);setBusy(false);}}}void poll();return()=>{active=false;clearTimeout(timer);};},[taskId,id,navigate]);
  const [file,setFile]=useState<File|null>(null),[rate,setRate]=useState(250),[record,setRecord]=useState<RecordResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;setRecord(null);setError('');if(id)request<RecordResult>('/records/'+id).then(r=>{if(active)setRecord(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
  async function run(replay=false){setBusy(true);setError('');try{let t:AnalysisTask;if(replay)t=await post('/acquisition/replay');else{if(!file)throw Error('请选择 CSV');const body=new FormData();body.append('file',file);body.append('sample_rate_hz',String(rate));t=await request('/analyze/ecg',{method:'POST',body});}setTask(t);setSearch({task:t.id});}catch(e){setError((e as Error).message);setBusy(false);}}
  return <section><p className="eyebrow">记录与分析 · 王书阁</p><h1>{id?'记录详情':'新建记录'}</h1>{!id&&<><p>首版支持单列 CSV（单位 mV，可含 value/sample/mv 表头）。采样率请按数据实际填写。</p><form onSubmit={(e:FormEvent)=>{e.preventDefault();void run();}}><label>CSV 文件<input type="file" accept=".csv" required onChange={e=>setFile(e.target.files?.[0]||null)} /></label><label>采样率 Hz<input type="number" min="50" max="2000" value={rate} onChange={e=>setRate(Number(e.target.value))} required /></label><div className="actions"><button disabled={busy}>导入并分析</button><button type="button" className="secondary" disabled={busy} onClick={()=>void run(true)}>使用合成回放</button></div></form></>}
    {!id&&taskId&&<p>任务编号：{taskId}（刷新页面可继续查询）</p>}<p role="status">{error||(busy?(task?.status==='running'?'分析处理中…':'任务排队中…'):'')}</p>{record&&<article>
      <p>{new Date(record.created_at).toLocaleString()} · 来源：{record.result.source} · 时长：{record.result.duration_sec?.toFixed(1)}s</p>{record.task_id&&<p>任务：{record.task_id} · 状态：{record.task_status}</p>}
      <h2>{record.result.quality.status==='insufficient'?'信号质量不足':'分析结果'}</h2>
      {record.result.quality.score!=null&&<p>质量评分：{record.result.quality.score} 分（{record.result.quality.grade}）</p>}
      <p>{record.result.quality.scope}</p>
      {record.result.quality.reasons.length>0&&<p>注意：{record.result.quality.reasons.join('；')}</p>}
      <Waveform values={record.result.waveform} duration={record.result.duration_sec} unit={record.result.unit} />
      {record.result.quality.status!=='insufficient'&&record.result.prediction.label&&<>
        <div className="grid">
          <article><h2>分类结果</h2><p>{record.result.prediction.label==='normal'?'正常窦性节律':record.result.prediction.label}</p><p>置信度：{record.result.prediction.confidence!=null?`${(record.result.prediction.confidence*100).toFixed(0)}%`:'—'}</p></article>
          <article><h2>心率</h2><p>{record.result.prediction.heart_rate?.bpm?`${record.result.prediction.heart_rate.bpm} 次/分`:'—'}</p><p>节律：{record.result.prediction.heart_rate?.regularity||'—'}</p></article>
          <article><h2>心拍统计</h2><p>共 {record.result.prediction.beats?.count??'—'} 个心拍</p><p>室性早搏：{record.result.prediction.beats?.vpc_count??0} 次</p></article>
        </div>
        {record.result.prediction.explanation_detail?.elderly_summary&&<aside style={{marginTop:20}}><h2 style={{marginTop:0}}>通俗说明</h2><p style={{fontSize:16}}>{record.result.prediction.explanation_detail.elderly_summary}</p></aside>}
        {record.result.prediction.explanation_detail?.professional_interpretation&&<><h2>专业解读</h2><p>{record.result.prediction.explanation_detail.professional_interpretation}</p></>}
        {record.result.prediction.explanation_detail?.evidence&&record.result.prediction.explanation_detail.evidence.length>0&&<><h2>分析依据</h2><ul>{record.result.prediction.explanation_detail.evidence.map((e,i)=><li key={i}>{e}</li>)}</ul></>}
        {record.result.prediction.explanation_detail?.uncertainty&&record.result.prediction.explanation_detail.uncertainty.length>0&&<><h2>不确定说明</h2><ul>{record.result.prediction.explanation_detail.uncertainty.map((e,i)=><li key={i}>{e}</li>)}</ul></>}
        {record.result.prediction.explanation_detail?.next_steps&&record.result.prediction.explanation_detail.next_steps.length>0&&<><h2>下一步建议</h2><ul>{record.result.prediction.explanation_detail.next_steps.map((e,i)=><li key={i}>{e}</li>)}</ul></>}
        {record.result.prediction.explanation_detail?.provider&&<small>解释引擎：{record.result.prediction.explanation_detail.provider==='deepseek'?'DeepSeek 大模型':'本地模板'}</small>}
      </>}
      {(record.result.quality.status==='insufficient'||!record.result.prediction.label)&&<p>{record.result.prediction.explanation}</p>}
    </article>}</section>;
}
