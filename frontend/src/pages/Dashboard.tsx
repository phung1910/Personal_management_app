import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { Clock, Target, Calendar, CreditCard, CheckCircle2, Circle, Plus, Wallet, TrendingDown, ArrowRight, Sparkles, Timer } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { isWithinFilter } from '../utils/dateFilters';

interface EventSchedule {
  id: number;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  color?: string;
}

interface StudySession {
  id: number;
  title: string;
  status: string;
  objective?: string;
  target_date?: string;
}

interface FinanceSummary {
  total_expense: number;
  total_income: number;
  balance: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Work': 'bg-blue-500',
  'Công việc': 'bg-blue-500',
  'Study': 'bg-indigo-500',
  'Học tập': 'bg-indigo-500',
  'Health': 'bg-green-500',
  'Sức khỏe': 'bg-green-500',
  'Entertainment': 'bg-pink-500',
  'Giải trí': 'bg-pink-500',
  'Personal': 'bg-amber-500',
  'Cá nhân': 'bg-amber-500',
  'Default': 'bg-gray-500',
  'Khác': 'bg-gray-500',
  'Other': 'bg-gray-500'
};

const getEventColor = (event: Partial<EventSchedule>) => event.color || CATEGORY_COLORS[event.category || 'Default'] || 'bg-teal-500';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  
  const [upcomingEvents, setUpcomingEvents] = useState<EventSchedule[]>([]);
  const [currentEvents, setCurrentEvents] = useState<EventSchedule[]>([]);
  const [todayTasks, setTodayTasks] = useState<StudySession[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);

  // Widget Summary
  const [showSummaryAnimation, setShowSummaryAnimation] = useState(false);
  const [miniSummary, setMiniSummary] = useState({ pomodoroTime: 0, completedTasks: 0, expense: 0 });

  // Quick expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(language === 'vi' ? 'Ăn uống' : 'Food');
  const [customCategory, setCustomCategory] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const adjustAmount = (delta: number) => {
    const current = parseFloat(expenseAmount) || 0;
    setExpenseAmount(Math.max(0, current + delta).toString());
  };

  useEffect(() => {
    fetchDashboardData();
  }, [language]);

  const fetchDashboardData = async () => {
    try {
      const [eventsRes, tasksRes, financeRes, pomodoroRes] = await Promise.all([
        api.get('/events'),
        api.get('/study'),
        api.get('/finance'),
        api.get('/pomodoro')
      ]);

      // Filter current and upcoming events
      const now = new Date();
      
      const current = eventsRes.data
        .filter((e: EventSchedule) => new Date(e.start_time) <= now && new Date(e.end_time) >= now)
        .sort((a: EventSchedule, b: EventSchedule) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      const upcoming = eventsRes.data
        .filter((e: EventSchedule) => new Date(e.start_time) > now)
        .sort((a: EventSchedule, b: EventSchedule) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 4); // Take top 4

      // Filter today's tasks for task list
      const todayStr = new Date().toISOString().split('T')[0];
      const tasks = tasksRes.data
        .filter((t: StudySession) => {
          if (t.status === 'completed') return false;
          if (!t.target_date) return true; // Tasks without date are "anytime", show them
          return t.target_date.startsWith(todayStr); // Only today's tasks
        })
        .slice(0, 5); // Take top 5

      setCurrentEvents(current);
      setUpcomingEvents(upcoming);
      setTodayTasks(tasks);

      // Finance Summary (all time for widget top)
      const totalExpense = financeRes.data.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + Number(t.amount), 0);
      setFinance({ total_expense: totalExpense, total_income: 0, balance: 0 });

      // Mini Summary (Today) calculation
      const todayPomodoros = pomodoroRes.data.filter((p: any) => isWithinFilter(p.completed_at || p.created_at, 'today'));
      const pomodoroTime = todayPomodoros.reduce((acc: number, p: any) => acc + (p.duration_minutes || 0), 0);
      
      const todayTasksList = tasksRes.data.filter((t: any) => t.status === 'completed' && isWithinFilter(t.target_date, 'today'));
      
      const todayExpense = financeRes.data.filter((t: any) => t.type === 'expense' && isWithinFilter(t.transaction_date, 'today')).reduce((acc: number, t: any) => acc + Number(t.amount), 0);

      setMiniSummary({
         pomodoroTime,
         completedTasks: todayTasksList.length,
         expense: todayExpense
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const toggleTaskStatus = async (task: StudySession) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      await api.put(`/study/${task.id}`, { status: newStatus });
      // Remove from list if completed
      if (newStatus === 'completed') {
        setTodayTasks(todayTasks.filter(t => t.id !== task.id));
      } 
      fetchDashboardData();
    } catch (error) {
      console.error("Error toggling task status", error);
    }
  };

  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;
    
    const finalCategory = expenseCategory === 'Custom' ? (customCategory || (language === 'vi' ? 'Khác' : 'Other')) : expenseCategory;

    setIsSubmittingExpense(true);
    try {
      await api.post('/finance', {
        type: 'expense',
        amount: parseFloat(expenseAmount),
        category: finalCategory,
        description: 'Quick Add from Dashboard',
        transaction_date: new Date().toISOString()
      });
      setExpenseAmount('');
      fetchDashboardData(); // Refresh summary
    } catch (error) {
      console.error("Error adding expense", error);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight text-slate-800">
            {language === 'vi' ? 'Khám phá không gian' : 'Explore unique abstract'} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
              {language === 'vi' ? 'làm việc của bạn.' : 'designs that defy'}
            </span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
            {language === 'vi' 
              ? `Chào mừng ${user?.username}. Hôm nay là một ngày tuyệt vời để hoàn thành mục tiêu!` 
              : `Welcome back, ${user?.username}. Today is a great day to accomplish your goals!`}
          </p>
        </div>
        <div className="relative z-10 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-2xl text-sm font-semibold border border-white/50 shadow-sm hover:bg-white transition-colors cursor-default text-slate-600">
          {new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Upcoming Events & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Tasks */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 border border-white/60 p-8 hover:-translate-y-2 hover:bg-white/90 group/card">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-slate-800">
                <Target className="w-6 h-6 text-rose-400 group-hover/card:animate-spin" />
                <h2 className="text-xl font-bold tracking-wide">{language === 'vi' ? 'Việc cần làm hôm nay' : "Today's Tasks"}</h2>
              </div>
              <span className="bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full border border-rose-200">{todayTasks.length} tasks</span>
            </div>
            
            {todayTasks.length > 0 ? (
              <div className="space-y-4">
                {todayTasks.map(task => (
                  <div key={task.id} className="group flex items-start gap-4 p-4 hover:bg-white rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100 hover:shadow-sm cursor-pointer" onClick={() => toggleTaskStatus(task)}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                      className="mt-0.5 text-slate-300 hover:text-green-500 transition-all duration-300 hover:scale-125 hover:rotate-12"
                    >
                      {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div>
                      <p className={`text-base font-semibold transition-colors duration-300 ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-rose-600'}`}>
                        {task.title}
                      </p>
                      {task.objective && (
                        <p className="text-sm text-slate-500 mt-1">{task.objective}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 bg-white/40 rounded-2xl border border-dashed border-slate-200">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30 text-rose-400" />
                <p className="text-sm font-medium">{language === 'vi' ? 'Tuyệt vời! Bạn đã hoàn thành hết việc.' : "Awesome! You've completed all tasks."}</p>
              </div>
            )}
          </div>

          {/* Events Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 border border-white/60 p-8 hover:-translate-y-2 hover:bg-white/90 group/card">
            
            {currentEvents.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 text-slate-800 mb-6">
                  <Calendar className="w-6 h-6 text-green-500 group-hover/card:animate-pulse" />
                  <h2 className="text-xl font-bold tracking-wide">{language === 'vi' ? 'Lịch trình hiện tại' : 'Current Events'}</h2>
                </div>
                <div className="space-y-4">
                  {currentEvents.map(event => (
                    <div key={event.id} className="flex gap-5 group">
                      <div className="w-16 flex flex-col items-center justify-center shrink-0 py-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(event.start_time)}</span>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-green-600 transition-colors">{formatTime(event.start_time)}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl border border-green-200/50 shadow-sm transition-all duration-300 group-hover:scale-[1.02] bg-green-50/50 group-hover:bg-green-50 group-hover:border-green-200 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getEventColor(event)} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        <div>
                          <h4 className="text-base font-bold text-slate-800 group-hover:text-green-700 transition-colors">{event.title}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{event.category} • {language === 'vi' ? 'Đang diễn ra' : 'Happening now'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-slate-800 mb-6">
              <Calendar className="w-6 h-6 text-blue-400 group-hover/card:animate-pulse" />
              <h2 className="text-xl font-bold tracking-wide">{language === 'vi' ? 'Lịch trình sắp tới' : 'Upcoming Events'}</h2>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex gap-5 group">
                    <div className="w-16 flex flex-col items-center justify-center shrink-0 py-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(event.start_time)}</span>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{formatTime(event.start_time)}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl border border-white/50 shadow-sm transition-all duration-300 group-hover:scale-[1.02] bg-white/40 group-hover:bg-white group-hover:border-slate-100 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getEventColor(event)} opacity-50 group-hover:opacity-100 transition-opacity`} />
                      <div>
                        <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{event.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{event.category}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 bg-white/40 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-blue-400" />
                <p className="text-sm font-medium">{language === 'vi' ? 'Không có lịch trình nào sắp tới.' : 'No upcoming events.'}</p>
              </div>
            )}
          </div>

        </div>

        {/* Column 2: Right Column */}
        <div className="space-y-6">
          
          {/* Summary Widget */}
          <div className={`bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 border border-white/60 overflow-hidden relative group/summary ${showSummaryAnimation ? 'pb-6' : 'hover:-translate-y-2 hover:bg-white/90 cursor-pointer hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]'}`}
               onClick={() => !showSummaryAnimation && setShowSummaryAnimation(true)}
          >
             {/* Header / Prompt */}
             <div className="p-8 flex items-center justify-between relative z-10">
               <div className="pr-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{language === 'vi' ? 'Xem lại tổng kết hôm nay?' : 'See today summary?'}</h3>
                  {!showSummaryAnimation && (
                    <p className="text-xs text-slate-500 font-medium">{language === 'vi' ? 'Nhấn để khám phá thành quả của bạn' : 'Tap to reveal your achievements'}</p>
                  )}
               </div>
               {!showSummaryAnimation ? (
                 <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 group-hover/summary:scale-110 group-hover/summary:rotate-12 transition-all duration-300 shrink-0 shadow-sm border border-indigo-200">
                   <Sparkles className="w-6 h-6 animate-pulse" />
                 </div>
               ) : (
                 <button onClick={(e) => { e.stopPropagation(); navigate('/summary'); }} className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors shrink-0">
                   {language === 'vi' ? 'Chi tiết' : 'View all'}
                   <ArrowRight className="w-3 h-3" />
                 </button>
               )}
             </div>

             {/* Expanded content */}
             <div className={`transition-all duration-1000 ease-in-out px-6 grid grid-cols-3 gap-3 overflow-hidden ${showSummaryAnimation ? 'max-h-64 opacity-100 mt-0' : 'max-h-0 opacity-0'}`}>
                
                {/* Task */}
                <div className={`flex flex-col items-center justify-center bg-indigo-50/70 rounded-2xl p-4 transform transition-all duration-1000 border border-indigo-100/50 ${showSummaryAnimation ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-10 opacity-0'}`}>
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 mb-2" />
                  <span className="text-2xl font-extrabold text-slate-700">{miniSummary.completedTasks}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Tasks</span>
                </div>

                {/* Pomodoro */}
                <div className={`flex flex-col items-center justify-center bg-orange-50/70 rounded-2xl p-4 transform transition-all duration-1000 border border-orange-100/50 ${showSummaryAnimation ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'}`}>
                  <Timer className="w-5 h-5 text-orange-400 mb-2" />
                  <span className="text-2xl font-extrabold text-slate-700">{miniSummary.pomodoroTime}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Phút</span>
                </div>

                {/* Expense */}
                <div className={`flex flex-col items-center justify-center bg-rose-50/70 rounded-2xl p-4 transform transition-all duration-1000 border border-rose-100/50 text-center ${showSummaryAnimation ? 'translate-y-0 opacity-100 delay-500' : 'translate-y-10 opacity-0'}`}>
                  <TrendingDown className="w-5 h-5 text-rose-400 mb-2" />
                  <span className="text-base font-extrabold text-slate-700 truncate w-full">{miniSummary.expense >= 1000 ? (miniSummary.expense/1000) + 'k' : miniSummary.expense}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Chi</span>
                </div>
             </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 border border-white/60 overflow-hidden hover:-translate-y-2 hover:bg-white/90 group/card">
            <div className="bg-gradient-to-br from-rose-100 via-fuchsia-100 to-indigo-100 p-8 text-slate-800 relative border-b border-white/50">
              <Wallet className="absolute right-[-10%] top-[-10%] w-48 h-48 text-rose-300 opacity-20 transform rotate-12 group-hover/card:rotate-0 transition-transform duration-700" />
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <CreditCard className="w-6 h-6 text-rose-500" />
                <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">{language === 'vi' ? 'Tổng chi tiêu' : 'Total Expenses'}</h2>
              </div>
              <h3 className="text-4xl font-extrabold mb-2 tracking-tight text-slate-800">{formatCurrency(finance?.total_expense || 0)}</h3>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                {language === 'vi' ? 'Quản lý tài chính thông minh!' : 'Manage your finances wisely!'}
              </p>
            </div>
            
            <div className="p-8">
              <h4 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-wider">{language === 'vi' ? 'Nhập chi tiêu nhanh' : 'Quick Expense'}</h4>
              <form onSubmit={handleQuickExpense} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => adjustAmount(-1000)}
                      className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-500 rounded-xl font-bold text-lg transition-colors border border-slate-200 shrink-0"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        required
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                        placeholder={language === 'vi' ? 'Nhập số tiền...' : 'Enter amount...'}
                        className="w-full bg-white/50 border border-white/60 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white outline-none transition-all shadow-inner"
                      />
                      <span className="absolute right-4 top-3.5 text-sm text-slate-400 font-bold">đ</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => adjustAmount(1000)}
                      className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-500 rounded-xl font-bold text-lg transition-colors border border-slate-200 shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full bg-white/50 border border-white/60 rounded-xl p-3.5 text-sm text-slate-700 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white outline-none transition-all appearance-none shadow-inner"
                  >
                    <option value={language === 'vi' ? 'Ăn uống' : 'Food'} className="text-black">{language === 'vi' ? 'Ăn uống' : 'Food'}</option>
                    <option value={language === 'vi' ? 'Di chuyển' : 'Transport'} className="text-black">{language === 'vi' ? 'Di chuyển' : 'Transport'}</option>
                    <option value={language === 'vi' ? 'Mua sắm' : 'Shopping'} className="text-black">{language === 'vi' ? 'Mua sắm' : 'Shopping'}</option>
                    <option value={language === 'vi' ? 'Khác' : 'Other'} className="text-black">{language === 'vi' ? 'Khác' : 'Other'}</option>
                    <option value="Custom" className="text-black font-bold">{language === 'vi' ? '+ Tự nhập lý do...' : '+ Custom reason...'}</option>
                  </select>
                  
                  {expenseCategory === 'Custom' && (
                    <input 
                      type="text"
                      required
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập lý do chi tiêu...' : 'Enter expense reason...'}
                      className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white outline-none transition-all shadow-inner animate-in fade-in slide-in-from-top-2"
                      autoFocus
                    />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingExpense || !expenseAmount}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-rose-500 font-bold py-3.5 rounded-xl text-sm transition-all duration-300 disabled:opacity-50 mt-2 hover:shadow-[0_8px_20px_rgba(244,63,94,0.3)] active:scale-95 uppercase tracking-wide"
                >
                  <Plus className="w-5 h-5" />
                  {isSubmittingExpense 
                    ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') 
                    : (language === 'vi' ? 'Thêm khoản chi' : 'Add Expense')
                  }
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
