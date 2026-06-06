import React, { createContext, useState, useEffect } from 'react';

type Language = 'en' | 'vi';

const translations = {
  en: {
    dashboard: 'Dashboard',
    study_sessions: 'Todo List',
    pomodoro: 'Pomodoro Timer',
    finance: 'Finance Tracker',
    summary: 'Summary',
    weekly_schedule: 'Schedule',
    sign_out: 'Sign Out',
    finance_desc: 'Manage your income, expenses, and savings.',
    new_transaction: 'New Transaction',
    expense: 'Expense',
    income: 'Income',
    amount: 'Amount',
    category: 'Category',
    description: 'Description (Optional)',
    date: 'Date',
    save_transaction: 'Save Transaction',
    total_balance: 'Total Balance',
    total_income: 'Total Income',
    total_expenses: 'Total Expenses',
    recent_transactions: 'Recent Transactions',
    no_transactions: 'No transactions found. Add one on the left to get started!',
    spending_breakdown: 'Spending Breakdown',
    focus_timer: 'Focus Timer',
    pomodoro_desc: 'Boost productivity with the Pomodoro technique.',
    focus_session: 'Focus Session',
    short_break: 'Short Break',
    what_working_on: 'What are you working on?',
    start: 'Start',
    pause: 'Pause',
    turn_off_alarm: 'Turn off Alarm',
    todays_focus: 'Today\'s Focus',
    total_focus_time: 'Total Focus Time',
    no_focus_recorded: 'No focus sessions recorded today.',
    manage_study: 'Manage and track your tasks.',
    new_session: 'New Task',
    all_sessions: 'All Tasks',
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
    no_sessions: 'No tasks found',
    no_sessions_desc: 'Get started by creating a new task.',
    placeholder_category: 'e.g. Food, Salary, Rent',
    placeholder_desc: 'Dinner with friends...',
    cat_food: 'Food & Dining',
    cat_transport: 'Transportation',
    cat_shopping: 'Shopping',
    cat_housing: 'Housing',
    cat_utilities: 'Utilities',
    cat_entertainment: 'Entertainment',
    cat_salary: 'Salary',
    cat_investments: 'Investments',
    login_to_save: 'Login to save your information',
    login: 'Login',
  },
  vi: {
    dashboard: 'Trang chủ',
    study_sessions: 'Việc cần làm',
    pomodoro: 'Đồng hồ Pomodoro',
    finance: 'Quản lý Tài chính',
    summary: 'Tổng kết',
    weekly_schedule: 'Lịch trình',
    sign_out: 'Đăng xuất',
    finance_desc: 'Quản lý thu nhập, chi tiêu và số dư của bạn.',
    new_transaction: 'Giao dịch mới',
    expense: 'Khoản chi',
    income: 'Khoản thu',
    amount: 'Số tiền',
    category: 'Danh mục',
    description: 'Mô tả (Tùy chọn)',
    date: 'Ngày',
    save_transaction: 'Lưu giao dịch',
    total_balance: 'Tổng số dư',
    total_income: 'Tổng thu nhập',
    total_expenses: 'Tổng chi tiêu',
    recent_transactions: 'Giao dịch gần đây',
    no_transactions: 'Chưa có giao dịch nào. Hãy thêm giao dịch ở bên trái!',
    spending_breakdown: 'Phân bổ Chi tiêu',
    focus_timer: 'Đồng hồ Tập trung',
    pomodoro_desc: 'Nâng cao năng suất bằng phương pháp Pomodoro.',
    focus_session: 'Phiên Tập trung',
    short_break: 'Nghỉ ngắn',
    what_working_on: 'Bạn đang làm việc gì thế?',
    start: 'Bắt đầu',
    pause: 'Tạm dừng',
    turn_off_alarm: 'Tắt Báo thức',
    todays_focus: 'Tập trung hôm nay',
    total_focus_time: 'Tổng thời gian tập trung',
    no_focus_recorded: 'Chưa có phiên tập trung nào hôm nay.',
    manage_study: 'Quản lý và theo dõi công việc của bạn.',
    new_session: 'Thêm công việc',
    all_sessions: 'Tất cả',
    todo: 'Cần làm',
    in_progress: 'Đang làm',
    completed: 'Đã xong',
    no_sessions: 'Chưa có công việc nào',
    no_sessions_desc: 'Hãy bắt đầu bằng cách tạo một công việc mới.',
    placeholder_category: 'VD: Ăn uống, Lương, Thuê nhà',
    placeholder_desc: 'Ăn tối với bạn bè...',
    cat_food: 'Ăn uống',
    cat_transport: 'Đi lại',
    cat_shopping: 'Mua sắm',
    cat_housing: 'Nhà cửa',
    cat_utilities: 'Hóa đơn & Tiện ích',
    cat_entertainment: 'Giải trí',
    cat_salary: 'Tiền lương',
    cat_investments: 'Đầu tư',
    login_to_save: 'Đăng nhập để lưu lại thông tin',
    login: 'Đăng nhập',
  }
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  formatCurrency: (amount: number | string) => string;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  formatCurrency: () => '',
  formatDate: () => '',
  formatTime: () => '',
  t: () => ''
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'vi' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (language === 'vi') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    if (language === 'vi') {
      return date.toLocaleDateString('vi-VN');
    }
    return date.toLocaleDateString('en-US');
  };

  const formatTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    if (language === 'vi') {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, formatCurrency, formatDate, formatTime, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
