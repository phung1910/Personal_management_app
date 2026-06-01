import React, { useContext, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { LayoutDashboard, CheckSquare, LogOut, Calendar, Timer, Wallet, Sparkles, Menu, X } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-slate-700 hover:text-rose-500 hover:bg-white transition-all active:scale-95"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Navigation (Left Sidebar on Mobile, Top Bar on Desktop) */}
      <header className={`fixed z-50 flex bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-500
        max-md:top-1/2 max-md:-translate-y-1/2 max-md:flex-col max-md:items-center max-md:py-4 max-md:px-2 max-md:rounded-[2rem] max-md:gap-4
        ${isMobileMenuOpen ? 'max-md:left-4 max-md:opacity-100 max-md:visible' : 'max-md:-left-full max-md:opacity-0 max-md:invisible'}
        md:top-6 md:left-1/2 md:-translate-x-1/2 md:flex-row md:items-center md:px-3 md:py-2 md:rounded-full md:gap-6 md:opacity-100 md:visible
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 max-md:pb-3 max-md:border-b md:pl-3 md:pr-2 md:border-r border-slate-200/50">
          <Sparkles className="w-6 h-6 md:w-5 md:h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-bold text-slate-700 tracking-wider uppercase max-md:hidden">Perso</span>
        </div>
        
        {/* Nav Links */}
        <nav className="flex items-center max-md:flex-col md:gap-1 gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={item.name}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-center transition-all duration-300 
                  max-md:w-12 max-md:h-12 max-md:rounded-2xl
                  md:px-4 md:py-2 md:rounded-full md:text-xs md:font-semibold md:tracking-wide
                  ${isActive
                    ? 'bg-white text-rose-500 shadow-sm md:scale-105 max-md:scale-110'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Icon className="w-6 h-6 md:hidden" />
                <span className="max-md:hidden">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="flex items-center max-md:flex-col max-md:pt-3 max-md:border-t md:pl-2 md:pr-1 md:border-l border-slate-200/50 gap-3">
          <div className="flex max-md:flex-col bg-slate-100/50 md:rounded-full max-md:rounded-xl p-0.5 border border-white/50 gap-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center justify-center max-md:w-8 max-md:h-8 md:px-2.5 md:py-1 text-[10px] font-bold md:rounded-full max-md:rounded-lg transition-all ${language === 'en' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('vi')}
              className={`flex items-center justify-center max-md:w-8 max-md:h-8 md:px-2.5 md:py-1 text-[10px] font-bold md:rounded-full max-md:rounded-lg transition-all ${language === 'vi' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              VI
            </button>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full bg-white/50 hover:bg-rose-100 hover:text-rose-500 text-slate-400 transition-all duration-300 border border-transparent hover:border-rose-200 group shrink-0"
            title={t('sign_out')}
          >
            <LogOut className="w-4 h-4 md:group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto min-h-screen max-w-7xl transition-all duration-500
        max-md:px-4 max-md:pt-24 max-md:pb-12
        md:pt-32 md:px-8 md:pb-12">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
