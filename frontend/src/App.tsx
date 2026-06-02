import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import StudySessions from './pages/StudySessions';
import Schedule from './pages/Schedule';
import Pomodoro from './pages/Pomodoro';
import Finance from './pages/Finance';
import Summary from './pages/Summary';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          
          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/study" element={<StudySessions />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/summary" element={<Summary />} />
              {/* Add more protected routes here */}
            </Route>
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
