import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  staffSignup: (data: StaffSignupData) => Promise<User>;
  logout: () => Promise<void>;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface StaffSignupData extends SignupData {
  signup_code: string;
  shop_slug: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<User>('/auth/me/')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const persistAuth = (token: string, u: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (username: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login/', { username, password });
    persistAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const signup = async (data: SignupData) => {
    const res = await api.post<{ token: string; user: User }>('/auth/signup/', data);
    persistAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const staffSignup = async (data: StaffSignupData) => {
    const res = await api.post<{ token: string; user: User }>('/auth/staff-signup/', data);
    persistAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout/'); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, staffSignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
