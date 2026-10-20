import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { post } from '../../services/api';
export default function Layout({children}: {children:ReactNode}) {
  async function logout() {
    try {await post('/auth/logout');} finally {sessionStorage.removeItem('ecg_token');window.dispatchEvent(new Event('ecg:logout'));}
  }
  return <><header><strong>未卜心知</strong><span>家庭心电辅助记录</span><button className="secondary" onClick={()=>{void logout().catch(()=>{});}}>退出</button></header>
    <main><aside>开发原型：合成回放与基础检查已接通。真实设备、正式信号算法及 AI 模型待接入，分析不作为诊断。</aside>
    <nav><NavLink to="/">概览</NavLink><NavLink to="/analyze">导入与分析</NavLink><NavLink to="/records">历史记录</NavLink><NavLink to="/family">家庭协同</NavLink></nav>{children}</main></>;
}
