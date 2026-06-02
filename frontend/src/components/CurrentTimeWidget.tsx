import React, { useState, useEffect, useContext } from 'react';
import { Clock, Calendar } from 'lucide-react';
import api from '../api/axios';
import { LanguageContext } from '../context/LanguageContext';

interface EventSchedule {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
}

const CurrentTimeWidget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState<EventSchedule[]>([]);
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events for widget:', error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Find if there's any active event right now
  const activeEvent = events.find((event) => {
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();
    const now = currentTime.getTime();
    return now >= start && now <= end;
  });

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  
  const formattedDate = currentTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/50 px-4 py-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-white/90 group">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-400" />
          <span className="text-lg font-bold text-slate-700 leading-none">{formattedTime}</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{formattedDate}</span>
      </div>
      
      {activeEvent && (
        <>
          <div className="w-px h-8 bg-slate-200/50"></div>
          <div className="flex flex-col max-w-[120px] sm:max-w-[180px]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-bold text-slate-700 truncate">{activeEvent.title}</span>
            </div>
            <span className="text-[9px] font-medium text-slate-400 truncate">
              {language === 'vi' ? 'Đang diễn ra' : 'Happening now'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentTimeWidget;
