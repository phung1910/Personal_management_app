import React, { useState, useEffect, useContext, useRef } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Clock, AlignLeft, Tag, Repeat, Calendar } from 'lucide-react';

interface EventSchedule {
  id: number;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  location_or_link?: string;
  notes?: string;
  color?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PIXELS_PER_HOUR = 36;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

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

// Fallback color for custom categories not in the list
const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || 'bg-teal-500';

const getEventColor = (event: Partial<EventSchedule>) => event.color || getCategoryColor(event.category || 'Default');

const AVAILABLE_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
  'bg-teal-500', 'bg-cyan-500', 'bg-gray-500', 'bg-slate-800'
];

const TimePicker = ({ timeStr, onChange }: { timeStr: string, onChange: (t: string) => void }) => {
  const [hoursStr, minutesStr] = timeStr ? timeStr.split(':') : ['08', '00'];
  let hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) hours = 8;
  const minutes = minutesStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let newH = parseInt(e.target.value, 10);
    if (ampm === 'PM' && newH !== 12) newH += 12;
    if (ampm === 'AM' && newH === 12) newH = 0;
    onChange(`${newH.toString().padStart(2, '0')}:${minutes}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${hours.toString().padStart(2, '0')}:${e.target.value}`);
  };

  const handleAmPmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAmPm = e.target.value;
    if (newAmPm !== ampm) {
      if (newAmPm === 'PM') hours = (hours % 12) + 12;
      else hours = hours % 12;
      onChange(`${hours.toString().padStart(2, '0')}:${minutes}`);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-1 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <select value={displayHours} onChange={handleHourChange} className="appearance-none bg-transparent outline-none cursor-pointer text-sm font-medium px-1">
        {Array.from({length: 12}, (_, i) => i + 1).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
      </select>
      <span className="text-gray-400 font-bold">:</span>
      <select value={minutes} onChange={handleMinuteChange} className="appearance-none bg-transparent outline-none cursor-pointer text-sm font-medium px-1">
        {Array.from({length: 12}, (_, i) => i * 5).map(m => {
          const mStr = m.toString().padStart(2, '0');
          return <option key={mStr} value={mStr}>{mStr}</option>;
        })}
      </select>
      <select value={ampm} onChange={handleAmPmChange} className="appearance-none bg-transparent outline-none cursor-pointer text-sm font-bold text-blue-600 px-1 ml-1">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

function Schedule() {
  const { t, language } = useContext(LanguageContext);
  const [events, setEvents] = useState<EventSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<EventSchedule>>({
    title: '',
    category: 'Work',
    start_time: '',
    end_time: '',
    notes: '',
    color: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Bulk creation state
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
    // Scroll to 7 AM on initial load
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * PIXELS_PER_HOUR;
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = (startDate: Date) => {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const weekDays = getWeekDays(currentWeekStart);

  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start_time);
      return eDate.getFullYear() === date.getFullYear() && 
             eDate.getMonth() === date.getMonth() && 
             eDate.getDate() === date.getDate();
    });
  };

  const getEventStyle = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    return {
      top: `${startMinutes * PIXELS_PER_MINUTE}px`,
      height: `${Math.max(durationMinutes * PIXELS_PER_MINUTE, 22)}px`, 
    };
  };

  const formatTimeRange = (start: string, end: string) => {
    const formatOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const s = new Date(start).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', formatOpts);
    const e = new Date(end).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', formatOpts);
    return `${s} - ${e}`;
  };

  const openCreateModal = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    
    // Format for datetime-local input: YYYY-MM-DDThh:mm
    const toLocalISOString = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingId(null);
    setFormData({
      title: '',
      category: language === 'vi' ? 'Công việc' : 'Work',
      start_time: toLocalISOString(now),
      end_time: toLocalISOString(end),
      notes: '',
      color: ''
    });
    setIsCustomCategory(false);
    setIsRepeat(false);
    setRepeatDays([now.getDay()]);
    setRepeatWeeks(1);
    setShowModal(true);
  };

  const openEditModal = (event: EventSchedule) => {
    const toLocalISOString = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingId(event.id);
    setFormData({
      title: event.title,
      category: event.category,
      start_time: toLocalISOString(new Date(event.start_time)),
      end_time: toLocalISOString(new Date(event.end_time)),
      notes: event.notes,
      color: event.color || ''
    });
    
    // Check if category is standard or custom
    const standardCategories = ['Work', 'Công việc', 'Study', 'Học tập', 'Health', 'Sức khỏe', 'Entertainment', 'Giải trí', 'Personal', 'Cá nhân', 'Default', 'Khác', 'Other'];
    setIsCustomCategory(!standardCategories.includes(event.category));
    
    setIsRepeat(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/events/${editingId}`, formData);
        setEvents(events.map(ev => ev.id === editingId ? res.data : ev));
      } else {
        if (isRepeat && repeatDays.length > 0) {
          const bulkEvents = [];
          const startDateStr = formData.start_time as string;
          const endDateStr = formData.end_time as string;
          
          for (let week = 0; week < repeatWeeks; week++) {
            for (const dayOfWeek of repeatDays) {
              const baseStart = new Date(startDateStr);
              const baseEnd = new Date(endDateStr);
              
              // Normalize days (Mon=1 ... Sun=7) to ensure they stay in the same calendar week
              const normalizeDay = (d: number) => d === 0 ? 7 : d;
              const startDayNorm = normalizeDay(baseStart.getDay());
              const targetDayNorm = normalizeDay(dayOfWeek);
              
              const dayOffset = targetDayNorm - startDayNorm;
              baseStart.setDate(baseStart.getDate() + (week * 7) + dayOffset);
              baseEnd.setDate(baseEnd.getDate() + (week * 7) + dayOffset);
              
              bulkEvents.push({
                ...formData,
                start_time: baseStart.toISOString(),
                end_time: baseEnd.toISOString(),
              });
            }
          }
          await api.post('/events/bulk', { events: bulkEvents });
          fetchEvents();
        } else {
          const res = await api.post('/events', formData);
          setEvents([...events, res.data]);
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${editingId}`);
      setEvents(events.filter(e => e.id !== editingId));
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const monthName = currentWeekStart.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-full overflow-hidden">
      {/* Header Area */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={goToToday}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {language === 'vi' ? 'Hôm nay' : 'Today'}
          </button>
          
          <div className="flex items-center">
            <button onClick={prevWeek} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={nextWeek} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <h2 className="text-xl font-medium text-gray-800 capitalize ml-2">{monthName}</h2>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {language === 'vi' ? 'Tạo mới' : 'Create'}
        </button>
      </div>

      {/* Calendar Header (Days) */}
      <div className="flex border-b border-gray-200 bg-white shrink-0 scrollbar-hide pr-[15px]"> 
        <div className="w-16 shrink-0 border-r border-gray-200"></div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={idx} className="flex flex-col items-center py-2 border-r border-gray-200 last:border-r-0">
                <span className={`text-[11px] font-medium uppercase ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                  {day.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' })}
                </span>
                <div className={`mt-1 w-10 h-10 flex items-center justify-center rounded-full text-xl ${isToday ? 'bg-blue-600 text-white font-medium' : 'text-gray-700'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative scroll-smooth"
      >
        <div className="flex min-h-[864px]"> 
          {/* Time axis */}
          <div className="w-16 shrink-0 border-r border-gray-200 relative bg-white z-10">
            {HOURS.map(h => (
              <div key={h} className="h-[36px] relative">
                <span className="absolute -top-2.5 right-2 text-[10px] text-gray-500 font-medium">
                  {h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid lines and Events */}
          <div className="flex-1 grid grid-cols-7 relative">
            {/* Horizontal Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map(h => (
                <div key={h} className="h-[36px] border-b border-gray-100 w-full" />
              ))}
            </div>

            {/* Vertical Columns and Events */}
            {weekDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();
              
              return (
                <div key={idx} className={`relative border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-blue-50/20' : ''}`}>
                  {dayEvents.map(event => {
                    const style = getEventStyle(event.start_time, event.end_time);
                    const isSmall = parseInt(style.height.replace('px', '')) < 35;
                    return (
                      <div 
                        key={event.id}
                        onClick={() => openEditModal(event)}
                        className={`absolute left-0 right-0 mx-0.5 rounded px-1 py-0.5 text-white overflow-hidden cursor-pointer hover:opacity-90 shadow-sm border border-white/20 transition-all z-10 hover:z-20 ${getEventColor(event)}`}
                        style={style}
                      >
                        <div className="font-semibold text-[10px] leading-tight truncate">{event.title}</div>
                        {!isSmall && (
                          <div className="text-white/90 text-[9px] leading-tight truncate mt-0.5">{formatTimeRange(event.start_time, event.end_time)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? (language === 'vi' ? 'Sửa Lịch trình' : 'Edit Event') : (language === 'vi' ? 'Thêm Lịch trình' : 'New Event')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={language === 'vi' ? 'Tiêu đề sự kiện' : 'Event title'}
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full text-xl font-medium border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-blue-600 px-0 py-2 placeholder-gray-400"
                />
              </div>

              <div className="flex flex-col gap-3 text-gray-600">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 shrink-0" />
                  <input
                    type="date"
                    required
                    value={formData.start_time ? formData.start_time.split('T')[0] : ''}
                    onChange={e => {
                      const date = e.target.value;
                      const startTime = formData.start_time ? formData.start_time.split('T')[1].substring(0, 5) : '08:00';
                      const endTime = formData.end_time ? formData.end_time.split('T')[1].substring(0, 5) : '09:00';
                      setFormData({
                        ...formData,
                        start_time: `${date}T${startTime}`,
                        end_time: `${date}T${endTime}`
                      });
                    }}
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 shrink-0" />
                  <div className="flex-1 flex items-center gap-3">
                    <TimePicker 
                      timeStr={formData.start_time ? formData.start_time.split('T')[1].substring(0, 5) : '08:00'}
                      onChange={time => {
                        const date = formData.start_time ? formData.start_time.split('T')[0] : new Date().toISOString().split('T')[0];
                        setFormData({...formData, start_time: `${date}T${time}`});
                      }}
                    />
                    <span className="text-gray-400 font-medium">→</span>
                    <TimePicker 
                      timeStr={formData.end_time ? formData.end_time.split('T')[1].substring(0, 5) : '09:00'}
                      onChange={time => {
                        const date = formData.end_time ? formData.end_time.split('T')[0] : new Date().toISOString().split('T')[0];
                        setFormData({...formData, end_time: `${date}T${time}`});
                      }}
                    />
                  </div>
                </div>
              </div>

              {formData.start_time && formData.end_time && new Date(formData.start_time) >= new Date(formData.end_time) && (
                <div className="text-red-500 text-xs font-medium px-1">
                  ⚠️ {language === 'vi' ? 'Giờ kết thúc phải lớn hơn Giờ bắt đầu. (Lưu ý: 12h trưa là 12:xx PM)' : 'End time must be after start time. (Note: Noon is 12:xx PM)'}
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-600">
                <Tag className="w-5 h-5 shrink-0" />
                {!isCustomCategory ? (
                  <select
                    value={formData.category}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setIsCustomCategory(true);
                        setFormData({...formData, category: ''});
                      } else {
                        setFormData({...formData, category: e.target.value});
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={language === 'vi' ? 'Công việc' : 'Work'}>{language === 'vi' ? 'Công việc' : 'Work'}</option>
                    <option value={language === 'vi' ? 'Học tập' : 'Study'}>{language === 'vi' ? 'Học tập' : 'Study'}</option>
                    <option value={language === 'vi' ? 'Sức khỏe' : 'Health'}>{language === 'vi' ? 'Sức khỏe' : 'Health'}</option>
                    <option value={language === 'vi' ? 'Giải trí' : 'Entertainment'}>{language === 'vi' ? 'Giải trí' : 'Entertainment'}</option>
                    <option value={language === 'vi' ? 'Cá nhân' : 'Personal'}>{language === 'vi' ? 'Cá nhân' : 'Personal'}</option>
                    <option value={language === 'vi' ? 'Khác' : 'Other'}>{language === 'vi' ? 'Khác' : 'Other'}</option>
                    <option value="custom">✍️ {language === 'vi' ? 'Tự nhập...' : 'Custom...'}</option>
                  </select>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder={language === 'vi' ? 'Nhập tên danh mục...' : 'Enter category name...'}
                      value={formData.category || ''}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsCustomCategory(false);
                        setFormData({...formData, category: language === 'vi' ? 'Công việc' : 'Work'});
                      }}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-500 transition-colors shrink-0"
                      title={language === 'vi' ? 'Hủy' : 'Cancel'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 text-gray-600">
                <AlignLeft className="w-5 h-5 shrink-0 mt-2.5" />
                <textarea
                  rows={2}
                  placeholder={language === 'vi' ? 'Thêm ghi chú...' : 'Add notes...'}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <div className={`w-4 h-4 rounded-full ${formData.color || getCategoryColor(formData.category || 'Default')}`} />
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, color: ''})}
                    className={`text-xs px-2 py-1 rounded-full border ${!formData.color ? 'bg-gray-100 font-bold border-gray-300' : 'bg-white border-gray-200'}`}
                  >
                    Mặc định
                  </button>
                  {AVAILABLE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, color})}
                      className={`w-6 h-6 rounded-full transition-transform ${color} ${formData.color === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>

              {!editingId && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer mb-3 select-none">
                    <input 
                      type="checkbox" 
                      checked={isRepeat} 
                      onChange={(e) => setIsRepeat(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                      <Repeat className="w-4 h-4 text-blue-600" />
                      {language === 'vi' ? 'Tạo lặp lại hàng loạt' : 'Repeat event'}
                    </div>
                  </label>

                  {isRepeat && (
                    <div className="pl-6 space-y-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">{language === 'vi' ? 'Lặp lại vào thứ:' : 'Repeat on:'}</p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5, 6, 0].map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (repeatDays.includes(day)) {
                                  setRepeatDays(repeatDays.filter(d => d !== day));
                                } else {
                                  setRepeatDays([...repeatDays, day]);
                                }
                              }}
                              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${repeatDays.includes(day) ? 'bg-blue-600 text-white shadow-md scale-110' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                            >
                              {language === 'vi' ? (day === 0 ? 'CN' : `T${day + 1}`) : (day === 0 ? 'Su' : ['M','Tu','W','Th','F','Sa'][day-1])}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-semibold text-gray-600">{language === 'vi' ? 'Lặp trong số tuần:' : 'For weeks:'}</p>
                        <input 
                          type="number" 
                          min="1" 
                          max="52"
                          value={repeatWeeks}
                          onChange={(e) => setRepeatWeeks(parseInt(e.target.value) || 1)}
                          className="w-16 text-sm border border-gray-300 rounded p-1 text-center font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="mr-auto text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {language === 'vi' ? 'Xóa' : 'Delete'}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={formData.start_time && formData.end_time ? new Date(formData.start_time) >= new Date(formData.end_time) : false}
                  className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'vi' ? 'Lưu' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
