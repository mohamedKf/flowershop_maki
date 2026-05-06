import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Promotion } from '@/lib/types';
import { listFrom } from '@/lib/utils';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DashboardNav } from '@/components/layout/DashboardNav';

interface F {
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  promo_code: string;
  starts_at: string;
  ends_at: string;
  is_featured: boolean;
  scope: string;
}

const empty: F = {
  title: '', subtitle: '', description: '', badge_text: '',
  discount_type: 'percent', discount_value: '10', promo_code: '',
  starts_at: '', ends_at: '', is_featured: false, scope: 'all',
};

const toLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DashboardPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<F>(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const r = await api.get('/promotions/');
    setItems(listFrom<Promotion>(r.data));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 86400000);
    setForm({ ...empty, starts_at: toLocal(now), ends_at: toLocal(future) });
    setErr(null); setOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      title: p.title, subtitle: p.subtitle || '', description: p.description || '',
      badge_text: p.badge_text || '', discount_type: p.discount_type,
      discount_value: p.discount_value, promo_code: p.promo_code || '',
      starts_at: p.starts_at.slice(0, 16), ends_at: p.ends_at.slice(0, 16),
      is_featured: p.is_featured, scope: p.scope || 'all',
    });
    setErr(null); setOpen(true);
  };

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      const payload = {
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      };
      const url = editing ? `/promotions/${editing.id}/` : '/promotions/';
      const method = editing ? 'patch' : 'post';
      await api[method](url, payload);
      setOpen(false); load();
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(typeof data === 'string' ? data : data?.detail || JSON.stringify(data) || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Promotion) => {
    if (!confirm(`Удалить акцию «${p.title}»?`)) return;
    await api.delete(`/promotions/${p.id}/`); load();
  };

  return (
    <div className="container py-12">
      <h1 className="section-title mb-3">Акции</h1>
      <DashboardNav />

      <div className="flex justify-end mb-6">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Добавить
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center text-ink-muted">Акций пока нет</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-xl text-white">{p.title}</h3>
                {p.is_running ? <Badge>идёт</Badge> : <Badge variant="secondary">не активна</Badge>}
              </div>
              {p.subtitle && <p className="text-sm text-ink-body mb-3">{p.subtitle}</p>}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">
                  {p.discount_type === 'percent' ? `−${p.discount_value}%` : `−${p.discount_value} ₽`}
                </Badge>
                {p.promo_code && <Badge variant="outline">{p.promo_code}</Badge>}
              </div>
              <div className="text-xs text-ink-muted mb-4">
                {new Date(p.starts_at).toLocaleDateString('ru-RU')} — {new Date(p.ends_at).toLocaleDateString('ru-RU')}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3 mr-1" /> Изменить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                  <Trash2 className="w-3 h-3 text-red" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить акцию' : 'Новая акция'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Подзаголовок</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Тип</Label>
                <Select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}>
                  <option value="percent">Процент</option>
                  <option value="fixed">Фикс. ₽</option>
                </Select>
              </div>
              <div>
                <Label>Размер</Label>
                <Input type="number" step="0.01" value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
              </div>
              <div>
                <Label>Промокод</Label>
                <Input value={form.promo_code}
                  onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })}
                  placeholder="SPRING25" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Начало</Label>
                <Input type="datetime-local" value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <Label>Окончание</Label>
                <Input type="datetime-local" value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Показывать на главной
            </label>
            {err && <div className="text-sm text-red">{err}</div>}
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
