export default function Waveform({values,duration,unit}:{values:number[];duration:number;unit:string}) {
  if(!values.length)return <p>没有波形数据</p>;
  let min=Infinity,max=-Infinity;for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}
  const step=Math.max(1,Math.ceil(values.length/3000));const points=values.filter((_,i)=>i%step===0).map((v,i)=>`${20+i*step/Math.max(values.length-1,1)*960},${200-(v-min)/(max-min||1)*170}`).join(' ');
  return <figure><svg viewBox="0 0 1000 240" role="img" aria-label={`心电波形，${duration.toFixed(2)}秒`}><defs><pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 40" fill="none" stroke="#dce8e3" /></pattern></defs><rect width="1000" height="240" fill="url(#grid)" /><polyline points={points} fill="none" stroke="#157a70" strokeWidth="1.5" /></svg><figcaption>时间 0–{duration.toFixed(2)} s · 幅值 {min.toFixed(3)}–{max.toFixed(3)} {unit}</figcaption></figure>;
}
