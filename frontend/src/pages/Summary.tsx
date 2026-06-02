import React, { useContext, useState, useEffect, useMemo } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { CheckCircle2, Timer, TrendingDown, TrendingUp, Sparkles, Calendar, CalendarDays, CalendarRange, Infinity as InfinityIcon } from 'lucide-react';
import api from '../api/axios';
import { isWithinFilter } from '../utils/dateFilters';
import type { TimeFilter } from '../utils/dateFilters';

function Summary() {
  const { language, formatCurrency } = useContext(LanguageContext);
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Raw data
  const [pomodoroLogs, setPomodoroLogs] = useState<any[]>([]);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const [tasksRes, financeRes, pomodoroRes] = await Promise.all([
          api.get('/study'),
          api.get('/finance'), // fetch all transactions, not just summary
          api.get('/pomodoro')
        ]);
  
        setStudySessions(tasksRes.data);
        setTransactions(financeRes.data);
        setPomodoroLogs(pomodoroRes.data);
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaryData();
  }, []);

  // Calculate stats based on filter
  const summaryStats = useMemo(() => {
    // Filter Pomodoro (uses completed_at or created_at)
    const filteredPomodoro = pomodoroLogs.filter(p => isWithinFilter(p.completed_at || p.created_at, timeFilter));
    const pomodoroMinutes = filteredPomodoro.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);

    // Filter Tasks (uses target_date, if no target_date we might include it or not, let's include if 'all')
    const filteredTasks = studySessions.filter(t => t.status === 'completed' && (timeFilter === 'all' ? true : isWithinFilter(t.target_date, timeFilter)));
    const completedTasksCount = filteredTasks.length;
    
    // Filter Finance (uses transaction_date)
    const filteredTransactions = transactions.filter(t => isWithinFilter(t.transaction_date, timeFilter));
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

    return {
      pomodoroMinutes,
      completedTasks: completedTasksCount,
      totalIncome,
      totalExpense,
    };
  }, [pomodoroLogs, studySessions, transactions, timeFilter]);

  const handleFilterChange = (filter: TimeFilter) => {
    if (filter === timeFilter) return;
    setIsTransitioning(true);
    setTimeFilter(filter);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const filterOptions = [
    { id: 'today', icon: Calendar, labelVi: 'Hôm nay', labelEn: 'Today' },
    { id: 'week', icon: CalendarDays, labelVi: 'Tuần này', labelEn: 'This Week' },
    { id: 'month', icon: CalendarRange, labelVi: 'Tháng này', labelEn: 'This Month' },
    { id: 'all', icon: InfinityIcon, labelVi: 'Toàn bộ', labelEn: 'All Time' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-10 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight text-slate-800">
            {language === 'vi' ? 'Kết quả' : 'Your'} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-4">
              {language === 'vi' ? 'của bạn' : 'Summary'}
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
            {language === 'vi' 
              ? 'Nhìn lại những gì bạn đã đạt được và tiếp tục phát huy nhé!' 
              : 'Take a look at what you have achieved and keep up the great work!'}
          </p>
        </div>
      </div>

      {/* Time Filter Toggle */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm w-fit">
        {filterOptions.map(opt => {
          const Icon = opt.icon;
          const isActive = timeFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleFilterChange(opt.id as TimeFilter)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-105' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : ''}`} />
              {language === 'vi' ? opt.labelVi : opt.labelEn}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'}`}>
          {/* Pomodoro Stats */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-center items-center text-center gap-5 hover:-translate-y-2 transition-all duration-300 group/card">
            <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center text-orange-500 group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-300">
              <Timer className="w-10 h-10" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{language === 'vi' ? 'Giờ Pomodoro' : 'Pomodoro Time'}</p>
              <p className="text-4xl font-extrabold text-slate-800 transition-all">
                {Math.floor(summaryStats.pomodoroMinutes / 60)}<span className="text-lg font-medium text-slate-500 mx-1">h</span>
                {summaryStats.pomodoroMinutes % 60}<span className="text-lg font-medium text-slate-500 ml-1">m</span>
              </p>
            </div>
          </div>

          {/* Finance Stats */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-center gap-6 hover:-translate-y-2 transition-all duration-300 group/card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-500 group-hover/card:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{language === 'vi' ? 'Tổng thu' : 'Total Income'}</span>
                  <span className="font-extrabold text-green-600 text-xl transition-all">{formatCurrency(summaryStats.totalIncome)}</span>
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500 group-hover/card:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{language === 'vi' ? 'Tổng chi' : 'Total Expense'}</span>
                  <span className="font-extrabold text-rose-600 text-xl transition-all">{formatCurrency(summaryStats.totalExpense)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Stats */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-center items-center text-center gap-5 hover:-translate-y-2 transition-all duration-300 group/card">
            <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover/card:scale-110 group-hover/card:-rotate-6 transition-all duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{language === 'vi' ? 'Task Hoàn Thành' : 'Completed Tasks'}</p>
              <p className="text-5xl font-extrabold text-slate-800 transition-all">{summaryStats.completedTasks}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Summary;
