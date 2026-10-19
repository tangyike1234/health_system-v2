/**
 * 布局组件
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, History, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/analyze', icon: Upload, label: '分析' },
    { path: '/records', icon: History, label: '记录' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">ECG Health</h1>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 退出 */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
