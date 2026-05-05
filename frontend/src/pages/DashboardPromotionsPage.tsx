import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Promotion } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag, Sparkles } from 'lucide-react';

interface PromoForm {
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  promo_code: string;
  min_order_amount: string;
  max_uses: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_featured: boolean;
  scope: string;
}

const empty: PromoForm = {
  title: '', subtitle: '', description: '', badge_text: '',
  discount_type: 'percent', discount_value: '10', promo_code: '',
  min_order_amount: '0', max_uses: 0,
  starts_at: '', ends_at: '',
  is_active: true, is_featured: false, scope: 'all',
};

const toLocalISO = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DashboardPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromoForm>(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const r = await api.get<Promotion[]>('/promotions/');
    setItems(r.data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setForm({ ...empty, starts_at: toLocalISO(now), ends_at: toLocalISO(future) });
    setErr(null);
    setOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      title: p.title,
      subtitle: p.subtitle || '',
      description: p.description || '',
      badge_text: p.badge_text || '',
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      promo_code: p.promo_code || '',
      min_order_amount: '0',
      max_uses: 0,
      starts_at: p.starts_at.slice(0, 16),
      ends_at: p.ends_at.slice(0, 16),
      is_active: true,
      is_featured: p.is_featured,
      scope: p.scope || 'all',
    });
    setErr(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        badge_text: form.badge_text,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        promo_code: form.promo_code,
        min_order_amount: form.min_order_amount,
        max_uses: form.max_uses,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        is_active: form.is_active,
        is_featured: form.is_featured,
        scope: form.scope,
      };
      if (editing) {
        await api.patch(`/promotions/${editing.id}/`, payload);
      } else {
        await api.post('/promotions/', payload);
      }
      setOpen(false);
      load();
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(typeof data === 'string' ? data : data?.detail || JSON.stringify(data) || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Promotion) => {
    if (!confirm(`Удалить акцию «${p.title}»?`)) return;
    await api.delete(`/promotions/${p.id}/`);
    load();
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-4xl">Акции и промокоды</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Добавить</Button>
      </div>

      {items.length === 0 && (
        <Card className="p-12 text-center text-stone-500">Акций пока нет.</Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blush-500" />
                <h3 className="font-medium text-lg">{p.title}</h3>
              </div>
              {p.is_running && <Badge>идёт</Badge>}
              {!p.is_running && <Badge variant="secondary">не активна</Badge>}
            </div>
            {p.subtitle && <p className="text-sm text-stone-600 mb-2">{p.subtitle}</p>}
            <div className="flex flex-wrap gap-2 text-sm mb-3">
              <Badge variant="secondary">
                {p.discount_type === 'percent' ? `-${p.discount_value}%` : `−${p.discount_value} ₽`}
              </Badge>
              {p.promo_code && (
                <Badge variant="secondary">
                  <Tag className="h-3 w-3 mr-1" /> {p.promo_code}
                </Badge>
              )}
              {p.is_featured && <Badge>хит</Badge>}
            </div>
            <div className="text-xs text-stone-500 mb-3">
              {new Date(p.starts_at).toLocaleDateString('ru-RU')} — {new Date(p.ends_at).toLocaleDateString('ru-RU')}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                <Pencil className="h-3 w-3 mr-1" /> Изменить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                <Trash2 className="h-3 w-3 text-rose-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить акцию' : 'Новая акция'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Название *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Подзаголовок</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Тип</Label>
                <Select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                >
                  <option value="percent">Процент</option>
                  <option value="fixed">Фикс. сумма</option>
                </Select>
              </div>
              <div>
                <Label>Размер скидки</Label>
                <Input
                  type="number" step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                />
              </div>
              <div>
                <Label>Бейдж</Label>
                <Input
                  placeholder="-10%"
                  value={form.badge_text}
                  onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Промокод</Label>
                <Input
                  placeholder="SPRING10"
                  value={form.promo_code}
                  onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Мин. сумма заказа ₽</Label>
                <Input
                  type="number"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Начало</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Окончание</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-blush-300"
                />
                Активна
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox" checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="rounded border-blush-300"
                />
                Показывать на главной
              </label>
            </div>

            {err && <div className="text-sm text-rose-600">{err}</div>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={save} disabled={saving || !form.title}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
