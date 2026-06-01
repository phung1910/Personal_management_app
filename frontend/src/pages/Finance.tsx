import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api/axios';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Tag } from 'lucide-react';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string | null;
  transaction_date: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  expense_breakdown?: Record<string, number>;
}

function Finance() {
  const { formatCurrency, formatDate, t } = useContext(LanguageContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_income: 0, total_expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [customCategory, setCustomCategory] = useState('');

  const adjustAmount = (delta: number) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData({...formData, amount: Math.max(0, current + delta).toString()});
  };

  const fetchData = async () => {
    try {
      const [transRes, sumRes] = await Promise.all([
        api.get('/finance'),
        api.get('/finance/summary')
      ]);
      setTransactions(transRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return;
    
    const finalCategory = formData.category === 'Custom' ? customCategory : formData.category;
    const finalData = { ...formData, category: finalCategory };
    
    try {
      await api.post('/finance', finalData);
      setFormData({
        type: formData.type, // keep the current type
        amount: '',
        category: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      setCustomCategory('');
      fetchData(); // Refresh all data to update summary and list
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/finance/${id}`);
      fetchData(); // Refresh all data
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const formatCurrencyLocal = (amount: number | string) => {
    return formatCurrency(amount);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('finance')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('finance_desc')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 font-medium mb-1">{t('total_balance')}</p>
            <h2 className="text-4xl font-black tracking-tight">{formatCurrencyLocal(summary.balance)}</h2>
          </div>
        </div>
        
        {/* Income Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-gray-500 font-medium">{t('total_income')}</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 pl-1">{formatCurrencyLocal(summary.total_income)}</h3>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-gray-500 font-medium">{t('total_expenses')}</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 pl-1">{formatCurrencyLocal(summary.total_expense)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Add Transaction Form & Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {t('new_transaction')}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    formData.type === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('expense')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    formData.type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('income')}
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('amount')} *</label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => adjustAmount(-1000)}
                    className="w-12 h-11 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-xl font-bold text-lg transition-colors border border-gray-200 shrink-0"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="block w-full pl-9 border border-gray-300 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => adjustAmount(1000)}
                    className="w-12 h-11 flex items-center justify-center bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-500 rounded-xl font-bold text-lg transition-colors border border-gray-200 shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('category')} *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="block w-full pl-9 border border-gray-300 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm appearance-none bg-white"
                  >
                    <option value="" disabled>{t('placeholder_category') || 'Chọn danh mục...'}</option>
                    {formData.type === 'expense' ? (
                      <>
                        <option value={t('cat_food') || 'Ăn uống'}>{t('cat_food') || 'Ăn uống'}</option>
                        <option value={t('cat_transport') || 'Đi lại'}>{t('cat_transport') || 'Đi lại'}</option>
                        <option value={t('cat_shopping') || 'Mua sắm'}>{t('cat_shopping') || 'Mua sắm'}</option>
                        <option value={t('cat_housing') || 'Nhà cửa'}>{t('cat_housing') || 'Nhà cửa'}</option>
                        <option value={t('cat_utilities') || 'Hóa đơn & Tiện ích'}>{t('cat_utilities') || 'Hóa đơn & Tiện ích'}</option>
                        <option value={t('cat_entertainment') || 'Giải trí'}>{t('cat_entertainment') || 'Giải trí'}</option>
                      </>
                    ) : (
                      <>
                        <option value={t('cat_salary') || 'Tiền lương'}>{t('cat_salary') || 'Tiền lương'}</option>
                        <option value={t('cat_investments') || 'Đầu tư'}>{t('cat_investments') || 'Đầu tư'}</option>
                      </>
                    )}
                    <option value="Custom" className="font-bold">+ Tự nhập lý do...</option>
                  </select>
                </div>
                {formData.category === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Nhập lý do chi tiêu/thu nhập..."
                    className="block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm animate-in fade-in slide-in-from-top-2"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="block w-full border border-gray-300 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  placeholder={t('placeholder_desc')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('date')} *</label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={e => setFormData({...formData, transaction_date: e.target.value})}
                  className="block w-full border border-gray-300 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="mt-6 pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-transparent py-2.5 bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {t('save_transaction')}
                </button>
              </div>
            </form>
          </div>

          {/* Spending Breakdown */}
          {summary.expense_breakdown && Object.keys(summary.expense_breakdown).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">{t('spending_breakdown')}</h3>
              <div className="space-y-4">
                {Object.entries(summary.expense_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = summary.total_expense > 0 ? (amount / summary.total_expense) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold text-gray-700">{category}</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrencyLocal(amount)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transaction List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{t('recent_transactions')}</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">{t('no_transactions')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <div key={t.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{t.category}</p>
                        {t.description && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">{t.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(t.transaction_date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className={`text-base font-bold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrencyLocal(t.amount)}
                      </span>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finance;
