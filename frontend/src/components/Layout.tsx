import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { LayoutDashboard, CheckSquare, LogOut, Calendar, Timer, Wallet, Sparkles } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const location = useLocation();

  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('study_sessions'), path: '/study', icon: CheckSquare },
    { name: t('weekly_schedule'), path: '/schedule', icon: Calendar },
    { name: t('pomodoro'), path: '/pomodoro', icon: Timer },
    { name: t('finance'), path: '/finance', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f5] text-slate-800 font-sans relative overflow-x-hidden selection:bg-rose-200/50">
      {/* Soft Pastel Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/40 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-amber-200/30 blur-[110px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Floating Top Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-3 py-2 bg-white/60 backdrop-blur-2xl border border-white/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <div className="flex items-center gap-2 pl-3 pr-2 border-r border-slate-200/50">
          <Sparkles className="w-5 h-5 text-rose-400" />
          <span className="text-sm font-bold text-slate-700 tracking-wider uppercase">Perso</span>
        </div>
        
        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-rose-500 shadow-sm scale-105'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="flex items-center gap-3 pl-2 pr-1 border-l border-slate-200/50">
          <div className="flex bg-slate-100/50 rounded-full p-0.5 border border-white/50">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'en' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'vi' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              VI
            </button>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/50 hover:bg-rose-100 hover:text-rose-500 text-slate-400 transition-all duration-300 border border-transparent hover:border-rose-200 group"
            title={t('sign_out')}
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
