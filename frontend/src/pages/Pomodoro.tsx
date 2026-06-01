import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api/axios';
import { Play, Pause, RotateCcw, Save, History, Coffee, BookOpen, Settings } from 'lucide-react';

interface PomodoroLog {
  id: number;
  task_name: string;
  duration_minutes: number;
  completed_at: string;
}

function Pomodoro() {
  const location = useLocation();
  const { formatTime: formatDateTime, t } = useContext(LanguageContext);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes
  const [initialDuration, setInitialDuration] = useState(25); // To reset back to this duration
  const [breakDuration, setBreakDuration] = useState(5); // Default 5 minutes for break
  const [showSettings, setShowSettings] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [taskName, setTaskName] = useState('');
  
  const [logs, setLogs] = useState<PomodoroLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audio ref for looping alarm
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  
  // Target time for background-safe countdown
  const targetTimeRef = useRef<number | null>(null);

  // Request Notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    // Preload audio
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    audioRef.current.loop = true;
  }, []);

  // Parse URL Parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get('title');
    const duration = params.get('duration');

    if (title) {
      setTaskName(title);
    }
    
    if (duration) {
      const parsedDuration = parseInt(duration);
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        setTimeLeft(parsedDuration * 60);
        setInitialDuration(parsedDuration);
      }
    }
  }, [location.search]);

  // Timer logic - Background Safe
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive) {
      if (!targetTimeRef.current) {
        targetTimeRef.current = Date.now() + timeLeft * 1000;
      }
      
      interval = setInterval(() => {
        if (!targetTimeRef.current) return;
        
        const now = Date.now();
        const remaining = Math.round((targetTimeRef.current - now) / 1000);
        
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsActive(false);
          targetTimeRef.current = null;
          
          // Fire alarm and notification
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
            setIsRinging(true);
          }
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(mode === 'work' ? 'Work session complete!' : 'Break is over!', {
              body: mode === 'work' ? 'Time to take a short break.' : 'Time to get back to work.',
              icon: '/favicon.ico' // optional
            });
          }
        } else {
          setTimeLeft(remaining);
        }
      }, 500); // Check twice a second for accuracy
    } else {
      targetTimeRef.current = null;
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
    
    // Automatically switch mode after acknowledging alarm
    if (mode === 'work') {
      handleSaveSession();
      setMode('break');
      setTimeLeft(breakDuration * 60);
    } else {
      setMode('work');
      setTimeLeft(initialDuration * 60);
    }
  };

  // Fetch history
  const fetchLogs = async () => {
    try {
      const response = await api.get('/pomodoro');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching pomodoro logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSaveSession = async () => {
    try {
      const name = taskName.trim() || 'Focus Session';
      const response = await api.post('/pomodoro', {
        task_name: name,
        duration_minutes: initialDuration // custom pomodoro duration
      });
      setLogs([response.data, ...logs]);
      setTaskName('');
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? initialDuration * 60 : breakDuration * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? initialDuration * 60 : breakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalFocusTime = logs.reduce((acc, log) => acc + log.duration_minutes, 0);
  const focusHours = Math.floor(totalFocusTime / 60);
  const focusMinutes = totalFocusTime % 60;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('focus_timer')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pomodoro_desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timer Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-2xl border border-gray-100 overflow-hidden">
            {/* Mode Switcher */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => switchMode('work')}
                className={`flex-1 py-4 flex justify-center items-center gap-2 font-semibold transition-colors ${
                  mode === 'work' ? 'bg-red-50 text-red-600 border-b-2 border-red-500' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                {t('focus_session')} ({initialDuration}m)
              </button>
              <button
                onClick={() => switchMode('break')}
                className={`flex-1 py-4 flex justify-center items-center gap-2 font-semibold transition-colors ${
                  mode === 'break' ? 'bg-green-50 text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Coffee className="w-5 h-5" />
                {t('short_break')} ({breakDuration}m)
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Timer Display */}
            <div className={`p-8 md:p-16 flex flex-col items-center justify-center transition-colors duration-500 ${mode === 'work' ? 'bg-red-500' : 'bg-green-500'}`}>
              <div className="text-[120px] font-black text-white leading-none tracking-tight">
                {formatTime(timeLeft)}
              </div>
              
              {mode === 'work' && (
                <div className="mt-8 w-full max-w-sm">
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder={t('what_working_on')}
                    className="w-full text-center bg-white/20 border border-white/30 text-white placeholder-white/60 rounded-xl py-3 px-4 focus:outline-none focus:bg-white/30 transition-colors font-medium"
                    disabled={isActive}
                  />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-white flex justify-center gap-4">
              {isRinging ? (
                <button
                  onClick={stopAlarm}
                  className="w-full max-w-xs py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 animate-pulse"
                >
                  {t('turn_off_alarm')}
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleTimer}
                    className={`w-40 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-sm transition-transform active:scale-95 ${
                      isActive ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : (mode === 'work' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700')
                    }`}
                  >
                    {isActive ? <><Pause className="w-6 h-6"/> {t('pause')}</> : <><Play className="w-6 h-6"/> {t('start')}</>}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="w-16 py-4 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm transition-transform active:scale-95"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-400" />
              {t('todays_focus')}
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">{t('total_focus_time')}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {focusHours}h {focusMinutes}m
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">{t('no_focus_recorded')}</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-gray-900 truncate">{log.task_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(log.completed_at)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700">
                        {log.duration_minutes}m
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Timer Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Focus Session (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={initialDuration}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setInitialDuration(val);
                      if (mode === 'work' && !isActive) setTimeLeft(val * 60);
                    }
                  }}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Short Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={breakDuration}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setBreakDuration(val);
                      if (mode === 'break' && !isActive) setTimeLeft(val * 60);
                    }
                  }}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full rounded-lg border border-transparent py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pomodoro;
