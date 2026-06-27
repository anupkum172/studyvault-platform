import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './index.css';
import api from './lib/api';
import Auth from './pages/Auth';
import AppShell from './pages/AppShell';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('studyvault_user') || 'null'));
  const [loading, setLoading] = useState(false);

  const saveSession = ({ user, token }) => {
    localStorage.setItem('studyvault_token', token);
    localStorage.setItem('studyvault_user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (payload) => saveSession((await api.post('/auth/login', payload)).data);
  const register = async (payload) => saveSession((await api.post('/auth/register', payload)).data);
  const logout = () => { localStorage.clear(); setUser(null); };
  const updateUser = (u) => { localStorage.setItem('studyvault_user', JSON.stringify(u)); setUser(u); };

  useEffect(() => {
    const token = localStorage.getItem('studyvault_token');
    if (!token) return;
    setLoading(true);
    api.get('/auth/me').then((res) => updateUser(res.data.user)).catch(logout).finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, updateUser, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-600">Loading StudyVault...</div>;
  return user ? children : <Navigate to="/auth" replace />;
}

function Root() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/auth" element={<Auth />} /><Route path="/*" element={<Protected><AppShell /></Protected>} /></Routes></AuthProvider></BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
