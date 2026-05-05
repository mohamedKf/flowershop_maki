import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ACTIVE_SHOP_SLUG } from '@/contexts/CartContext';
import { User as UserIcon, Briefcase } from 'lucide-react';

type Mode = 'customer' | 'staff';

export default function SignupPage() {
  const { signup, staffSignup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('customer');
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', phone: '',
    signup_code: '', shop_slug: ACTIVE_SHOP_SLUG,
  });
  const [errors, setErrors] = useState<Record<string, string[] | string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (mode === 'staff') {
        await staffSignup(form);
        navigate('/dashboard');
      } else {
        const { signup_code, shop_slug, ...customerForm } = form;
        await signup(customerForm);
        navigate('/');
      }
    } catch (err: any) {
      setErrors(err.response?.data || { detail: ['Ошибка регистрации'] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card className="p-8 w-full max-w-md">
        <h1 className="font-display text-3xl mb-2">Создайте аккаунт</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {mode === 'customer'
            ? 'Чтобы заказывать быстрее и видеть историю покупок'
            : 'Для менеджеров и сотрудников магазина'}
        </p>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-blush-50 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('customer'); setErrors({}); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'customer'
                ? 'bg-white text-blush-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserIcon className="h-4 w-4" /> Клиент
          </button>
          <button
            type="button"
            onClick={() => { setMode('staff'); setErrors({}); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'staff'
                ? 'bg-white text-blush-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="h-4 w-4" /> Сотрудник
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'staff' && (
            <div>
              <Input
                placeholder="Код регистрации *"
                value={form.signup_code}
                onChange={(e) => update('signup_code', e.target.value)}
                required
              />
              {errors.signup_code && (
                <p className="text-xs text-red-600 mt-1">
                  {Array.isArray(errors.signup_code) ? errors.signup_code[0] : errors.signup_code}
                </p>
              )}
              <p className="text-xs text-stone-500 mt-1">
                Код выдаёт владелец магазина. Определяет роль — менеджер или сотрудник.
              </p>
            </div>
          )}

          <Input
            placeholder="Имя пользователя *"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            required
            minLength={3}
          />
          {errors.username && <p className="text-xs text-red-600">{(errors.username as any)[0]}</p>}

          <Input
            placeholder="Email *"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
          {errors.email && <p className="text-xs text-red-600">{(errors.email as any)[0]}</p>}

          <Input
            placeholder="Пароль (минимум 8 символов) *"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            minLength={8}
          />
          {errors.password && <p className="text-xs text-red-600">{(errors.password as any)[0]}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Имя" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
            <Input placeholder="Фамилия" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
          </div>
          <Input placeholder="Телефон" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />

          {errors.detail && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {Array.isArray(errors.detail) ? errors.detail[0] : errors.detail}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Создание...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-blush-100 text-sm text-center text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blush-600 hover:text-blush-700 font-medium">Войти</Link>
        </div>
      </Card>
    </div>
  );
}
