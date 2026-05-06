import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Flower, Category } from '@/lib/types';
import { listFrom, formatRub } from '@/lib/utils';
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
import { Plus, Pencil, Trash2, AlertTriangle, ImagePlus } from 'lucide-react';
import { DashboardNav } from '@/components/layout/DashboardNav';

interface F {
  category: number | '';
  name: string;
  description: string;
  base_price: string;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  available_for_custom: boolean;
  photoFile: File | null;
}

const empty: F = {
  category: '', name: '', description: '', base_price: '0', stock: 0,
  low_stock_threshold: 10, is_active: true, is_featured: false,
  available_for_custom: true, photoFile: null,
};

export default function DashboardFlowersPage() {
  const [items, setItems] = useState<Flower[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [form, setForm] = useState<F>(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const [r1, r2] = await Promise.all([
      api.get('/flowers/'),
      api.get('/categories/'),
    ]);
    setItems(listFrom<Flower>(r1.data));
    setCats(listFrom<Category>(r2.data));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, category: cats[0]?.id || '' });
    setErr(null); setOpen(true);
  };

  const openEdit = (f: Flower) => {
    setEditing(f);
    setForm({
      category: f.category, name: f.name, description: f.description || '',
      base_price: f.base_price, stock: f.stock,
      low_stock_threshold: f.low_stock_threshold || 10,
      is_active: f.is_active, is_featured: f.is_featured,
      available_for_custom: f.available_for_custom, photoFile: null,
    });
    setErr(null); setOpen(true);
  };

  const save = async () => {
    if (!form.category) { setErr('Выберите категорию'); return; }
    setSaving(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('category', String(form.category));
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('base_price', form.base_price);
      fd.append('stock', String(form.stock));
      fd.append('low_stock_threshold', String(form.low_stock_threshold));
      fd.append('is_active', form.is_active ? 'true' : 'false');
      fd.append('is_featured', form.is_featured ? 'true' : 'false');
      fd.append('available_for_custom', form.available_for_custom ? 'true' : 'false');
      if (form.photoFile) fd.append('photo', form.photoFile);
      const url = editing ? `/flowers/${editing.id}/` : '/flowers/';
      const method = editing ? 'patch' : 'post';
      await api[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOpen(false); load();
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(typeof data === 'string' ? data : data?.detail || JSON.stringify(data) || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f: Flower) => {
    if (!confirm(`Удалить «${f.name}»?`)) return;
    await api.delete(`/flowers/${f.id}/`); load();
  };

  return (
    <div className="container py-12">
      <h1 className="section-title mb-3">Цветы</h1>
      <DashboardNav />

      <div className="flex justify-end mb-6">
        <Button onClick={openNew} disabled={cats.length === 0}>
          <Plus className="w-4 h-4 mr-2" /> Добавить
        </Button>
      </div>

      {cats.length === 0 ? (
        <Card className="p-12 text-center text-ink-muted">Сначала создайте хотя бы одну категорию</Card>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-ink-muted">Цветов пока нет</Card>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <Card key={f.id} className="p-4 flex items-center gap-4 flex-wrap">
              {f.photo ? (
                <img src={f.photo} alt={f.name} className="w-16 h-16 object-cover" />
              ) : (
                <div className="w-16 h-16 bg-bg-stage1 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-ink-faint" />
                </div>
              )}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-white">{f.name}</h3>
                  <Badge variant="secondary">{f.category_name}</Badge>
                  {f.is_featured && <Badge>Хит</Badge>}
                  {f.is_out_of_stock && <Badge variant="outline">нет в наличии</Badge>}
                  {!f.is_out_of_stock && f.is_low_stock && (
                    <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" /> мало</Badge>
                  )}
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  {formatRub(f.base_price)} · в наличии {f.stock}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(f)}>
                <Trash2 className="w-3 h-3 text-red" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить цветок' : 'Новый цветок'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Категория</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Название</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Цена ₽</Label>
                <Input type="number" step="0.01" value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
              </div>
              <div>
                <Label>В наличии</Label>
                <Input type="number" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Порог мало</Label>
                <Input type="number" value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Фото</Label>
              <input type="file" accept="image/*"
                onChange={(e) => setForm({ ...form, photoFile: e.target.files?.[0] || null })}
                className="text-sm text-ink-body" />
            </div>
            <div className="flex gap-4 flex-wrap text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Активен
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                Хит
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.available_for_custom}
                  onChange={(e) => setForm({ ...form, available_for_custom: e.target.checked })} />
                В свой букет
              </label>
            </div>
            {err && <div className="text-sm text-red">{err}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
