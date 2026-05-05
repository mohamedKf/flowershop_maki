import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const u = await login(username, password);
      navigate(u.role === 'manager' || u.role === 'worker' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card className="p-8 w-full max-w-md">
        <h1 className="font-display text-3xl mb-2">С возвращением</h1>
        <p className="text-muted-foreground mb-6">Войдите в свой аккаунт</p>

        <form onSubmit={submit} className="space-y-4">
          <Input
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Входим...' : 'Войти'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-blush-100 text-sm text-center text-muted-foreground">
          Нет аккаунта?{' '}
          <Link to="/signup" className="text-blush-600 hover:text-blush-700 font-medium">
            Зарегистрироваться
          </Link>
        </div>
      </Card>
    </div>
  );
}
