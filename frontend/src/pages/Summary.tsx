import React, { useContext, useState, useEffect, useMemo } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { CheckCircle2, Timer, TrendingDown, TrendingUp, Sparkles, Calendar, CalendarDays, CalendarRange, Infinity as InfinityIcon, X, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../api/axios';
import { isWithinFilter } from '../utils/dateFilters';
import type { TimeFilter } from '../utils/dateFilters';

function Summary() {
  const { language, formatCurrency } = useContext(LanguageContext);
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeModal, setActiveModal] = useState<'pomodoro' | 'finance' | 'tasks' | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);

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

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setActiveModal(null);
      setIsClosingModal(false);
    }, 380); // match animation duration
  };

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
      filteredPomodoro,
      filteredTasks,
      filteredTransactions,
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
          <div 
            onClick={() => setActiveModal('pomodoro')}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-center items-center text-center gap-5 hover:-translate-y-2 transition-all duration-300 group/card cursor-pointer"
          >
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
          <div 
            onClick={() => setActiveModal('finance')}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-center gap-6 hover:-translate-y-2 transition-all duration-300 group/card cursor-pointer"
          >
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
          <div 
            onClick={() => setActiveModal('tasks')}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-center items-center text-center gap-5 hover:-translate-y-2 transition-all duration-300 group/card cursor-pointer"
          >
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

      {/* Detail Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
          <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md ${isClosingModal ? 'animate-out fade-out duration-500 ease-in' : 'animate-in fade-in duration-700 ease-out'}`} onClick={handleCloseModal}></div>
          
          <div className={`bg-[#fcf9f5] w-full md:w-[60%] max-w-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden border border-white/50 flex flex-col max-h-[85vh] ${isClosingModal ? 'animate-modal-close' : 'animate-modal-pop'}`}>
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-200/50 bg-white/50">
              <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                {activeModal === 'pomodoro' && (
                  <><Timer className="w-8 h-8 text-orange-500" /> {language === 'vi' ? 'Chi tiết Pomodoro' : 'Pomodoro Details'}</>
                )}
                {activeModal === 'finance' && (
                  <><TrendingUp className="w-8 h-8 text-green-500" /> {language === 'vi' ? 'Chi tiết Tài chính' : 'Finance Details'}</>
                )}
                {activeModal === 'tasks' && (
                  <><CheckCircle2 className="w-8 h-8 text-indigo-500" /> {language === 'vi' ? 'Task Hoàn Thành' : 'Completed Tasks'}</>
                )}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-full transition-all duration-300 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-4">
              {activeModal === 'pomodoro' && summaryStats.filteredPomodoro.length === 0 && (
                <p className="text-center text-slate-500 py-10">{language === 'vi' ? 'Không có phiên tập trung nào.' : 'No focus sessions yet.'}</p>
              )}
              {activeModal === 'pomodoro' && summaryStats.filteredPomodoro.map((log: any) => (
                <div key={log.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex justify-between items-center hover:border-orange-200 transition-colors">
                  <div>
                    <p className="font-bold text-slate-700">{log.task_name || (language === 'vi' ? 'Không có tên' : 'Unnamed Task')}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      {new Date(log.completed_at || log.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </p>
                  </div>
                  <div className="bg-orange-50 text-orange-600 font-bold px-4 py-2 rounded-xl text-sm border border-orange-100">
                    {log.duration_minutes} min
                  </div>
                </div>
              ))}

              {activeModal === 'finance' && summaryStats.filteredTransactions.length === 0 && (
                <p className="text-center text-slate-500 py-10">{language === 'vi' ? 'Không có giao dịch nào.' : 'No transactions found.'}</p>
              )}
              {activeModal === 'finance' && summaryStats.filteredTransactions.sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).map((t: any) => (
                <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-rose-50 text-rose-500'}`}>
                      {t.type === 'income' ? <PlusCircle className="w-6 h-6" /> : <MinusCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{t.category}</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        {t.description && <span className="mr-2">{t.description} • </span>}
                        {new Date(t.transaction_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className={`font-extrabold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}

              {activeModal === 'tasks' && summaryStats.filteredTasks.length === 0 && (
                <p className="text-center text-slate-500 py-10">{language === 'vi' ? 'Không có nhiệm vụ nào hoàn thành.' : 'No completed tasks found.'}</p>
              )}
              {activeModal === 'tasks' && summaryStats.filteredTasks.map((task: any) => (
                <div key={task.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-700 text-lg">{task.title}</p>
                    {task.objective && <p className="text-sm text-slate-500 mt-1">{task.objective}</p>}
                    <p className="text-xs font-medium text-slate-400 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.target_date 
                        ? new Date(task.target_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') 
                        : (language === 'vi' ? 'Không có ngày hạn' : 'No target date')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Summary;
