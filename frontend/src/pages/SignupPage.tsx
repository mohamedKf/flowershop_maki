import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SHOP_SLUG } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [staffMode, setStaffMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regCode, setRegCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const url = staffMode ? '/auth/staff-signup/' : '/auth/signup/';
      const payload: any = {
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      };
      if (staffMode) {
        payload.signup_code = regCode;
        payload.shop_slug = SHOP_SLUG;
      }

      await api.post(url, payload);
      await login(username, password);
      nav('/');
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(
        typeof data === 'string' ? data : data?.detail || JSON.stringify(data) || 'Не удалось зарегистрироваться'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16 md:py-24 max-w-md">
      <div className="eyebrow mb-4">— Регистрация</div>
      <h1 className="section-title mb-8">
        {staffMode ? 'Сотрудник' : 'Клиент'}
      </h1>

      {/* Mode toggle */}
      <div className="flex border border-rule mb-10">
        <button
          onClick={() => setStaffMode(false)}
          className={`flex-1 py-3 text-[11px] tracking-[0.25em] uppercase transition-colors ${
            !staffMode ? 'bg-red text-white' : 'text-ink-muted hover:text-white'
          }`}
        >
          Я клиент
        </button>
        <button
          onClick={() => setStaffMode(true)}
          className={`flex-1 py-3 text-[11px] tracking-[0.25em] uppercase transition-colors ${
            staffMode ? 'bg-red text-white' : 'text-ink-muted hover:text-white'
          }`}
        >
          Сотрудник
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Имя</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <Label>Фамилия</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label>Логин</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Телефон</Label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7..." />
        </div>
        <div>
          <Label>Пароль</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>

        {staffMode && (
          <div>
            <Label>Код регистрации</Label>
            <Input
              value={regCode}
              onChange={(e) => setRegCode(e.target.value)}
              placeholder="Получите от владельца магазина"
              required
            />
          </div>
        )}

        {err && <div className="text-sm text-red border border-red/40 px-4 py-3">{err}</div>}

        <Button type="submit" disabled={busy} size="lg" className="w-full">
          {busy ? 'Создаём...' : 'Зарегистрироваться'}
        </Button>
      </form>

      <div className="mt-10 pt-8 border-t border-rule text-center text-sm text-ink-muted">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-red hover:text-red-bright underline">
          Войти
        </Link>
      </div>
    </div>
  );
}
