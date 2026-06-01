import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api/axios';
import { Plus, CheckCircle, Circle, ArrowRight, Trash2, Edit2, Calendar, Target, Clock } from 'lucide-react';

interface StudySession {
  id: number;
  title: string;
  objective: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  progress_percentage: number;
  duration_minutes: number;
  target_date: string | null;
}

type TabType = 'all' | 'todo' | 'in_progress' | 'completed';

function StudySessions() {
  const navigate = useNavigate();
  const { formatDate, t } = useContext(LanguageContext);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<StudySession>>({
    title: '',
    objective: '',
    duration_minutes: 25,
    target_date: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/study');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/study', formData);
      setSessions([response.data, ...sessions]);
      setShowCreateModal(false);
      setFormData({ title: '', objective: '', duration_minutes: 25, target_date: '' });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const openEditModal = (session: StudySession) => {
    setEditingId(session.id);
    setFormData({
      title: session.title,
      objective: session.objective || '',
      status: session.status,
      progress_percentage: session.progress_percentage,
      duration_minutes: session.duration_minutes || 25,
      target_date: session.target_date ? session.target_date.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const response = await api.put(`/study/${editingId}`, formData);
      setSessions(sessions.map(s => s.id === editingId ? response.data : s));
      setShowEditModal(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.delete(`/study/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const newProgress = status === 'completed' ? 100 : (status === 'todo' ? 0 : undefined);
      const payload: any = { status };
      if (newProgress !== undefined) payload.progress_percentage = newProgress;

      const response = await api.put(`/study/${id}`, payload);
      setSessions(sessions.map(s => s.id === id ? response.data : s));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_progress': return <ArrowRight className="w-6 h-6 text-blue-500" />;
      default: return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const filteredSessions = sessions.filter(s => activeTab === 'all' || s.status === activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('study_sessions')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('manage_study')}</p>
        </div>
        <button
          onClick={() => {
            setFormData({ title: '', objective: '', target_date: '' });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('new_session')}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {(['all', 'todo', 'in_progress', 'completed'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'all' ? t('all_sessions') : tab === 'todo' ? t('todo') : tab === 'in_progress' ? t('in_progress') : t('completed')}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Target className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">{t('no_sessions')}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {activeTab === 'all' ? t('no_sessions_desc') : t('no_sessions')}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => updateStatus(session.id, session.status === 'completed' ? 'todo' : 'completed')}
                    className="mt-0.5 flex-shrink-0 focus:outline-none cursor-pointer"
                  >
                    {getStatusIcon(session.status)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-base font-bold text-gray-900 ${session.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                          {session.title}
                        </h3>
                        {session.objective && (
                          <p className={`text-sm text-gray-600 mt-1 line-clamp-2 ${session.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                            {session.objective}
                          </p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {session.status === 'todo' && (
                          <button 
                            onClick={() => {
                              updateStatus(session.id, 'in_progress');
                              navigate(`/pomodoro?title=${encodeURIComponent(session.title)}&duration=${session.duration_minutes || 25}`);
                            }}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-semibold cursor-pointer"
                          >
                            {t('start')}
                          </button>
                        )}
                        <button onClick={() => openEditModal(session)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(session.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Progress Bar */}
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${session.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${session.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 w-8">{session.progress_percentage}%</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Duration */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {session.duration_minutes || 25}m
                        </div>
                        
                        {/* Date */}
                        {session.target_date && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(session.target_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">New Study Session</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="e.g. Master React Hooks"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Objective</label>
                <textarea
                  rows={3}
                  value={formData.objective || ''}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="What do you want to achieve?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_minutes || 25}
                    onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.target_date || ''}
                    onChange={e => setFormData({...formData, target_date: e.target.value})}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg border border-transparent py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Edit Session</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Objective</label>
                <textarea
                  rows={2}
                  value={formData.objective || ''}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as StudySession['status']})}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_minutes || 25}
                    onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.target_date || ''}
                    onChange={e => setFormData({...formData, target_date: e.target.value})}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Progress: {formData.progress_percentage}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress_percentage}
                  onChange={e => setFormData({...formData, progress_percentage: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg border border-transparent py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudySessions;
