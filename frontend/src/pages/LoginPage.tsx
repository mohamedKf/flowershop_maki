import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'customer' ? '/account' : '/dashboard'} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(username, password);
      nav('/');
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Неверный логин или пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16 md:py-24 max-w-md">
      <div className="eyebrow mb-4">— Вход</div>
      <h1 className="section-title mb-10">Здравствуйте</h1>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Имя пользователя</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div>
          <Label>Пароль</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <div className="text-sm text-red border border-red/40 px-4 py-3">{err}</div>}
        <Button type="submit" disabled={busy || !username || !password} size="lg" className="w-full">
          {busy ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <div className="mt-12 pt-8 border-t border-rule text-center">
        <p className="text-sm text-ink-muted mb-4">Ещё нет аккаунта?</p>
        <Link
          to="/signup"
          className="text-[11px] tracking-[0.28em] uppercase text-red hover:text-red-bright border-b border-red/30 hover:border-red pb-1"
        >
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}
