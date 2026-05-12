import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Category } from '@/lib/types';
import { listFrom } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { DashboardNav } from '@/components/layout/DashboardNav';

interface FormState {
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  photoFile: File | null;
}

const empty: FormState = {
  name: '', description: '', sort_order: 0, is_active: true, photoFile: null,
};

export default function DashboardCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const r = await api.get('/categories/');
    setItems(listFrom<Category>(r.data));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null); setForm(empty); setErr(null); setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name, description: c.description, sort_order: c.sort_order,
      is_active: c.is_active, photoFile: null,
    });
    setErr(null); setOpen(true);
  };

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('sort_order', String(form.sort_order));
      fd.append('is_active', form.is_active ? 'true' : 'false');
      if (form.photoFile) fd.append('photo', form.photoFile);
      const url = editing ? `/categories/${editing.id}/` : '/categories/';
      const method = editing ? 'patch' : 'post';
      await api[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOpen(false); load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Удалить «${c.name}»?`)) return;
    await api.delete(`/categories/${c.id}/`); load();
  };

  return (
    <div className="container py-12">
      <h1 className="section-title mb-3">Категории</h1>
      <DashboardNav />

      <div className="flex justify-end mb-6">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Добавить
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center text-ink-muted">Пока нет категорий</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              {c.photo ? (
                <img src={c.photo} alt={c.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-bg-stage1 flex items-center justify-center text-ink-faint">
                  <ImagePlus className="w-8 h-8" />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display text-xl text-ink-primary">{c.name}</h3>
                  {!c.is_active && <Badge variant="secondary">скрыта</Badge>}
                </div>
                {c.description && (
                  <p className="text-xs text-ink-body mb-4 line-clamp-2">{c.description}</p>
                )}
                <div className="text-xs text-ink-faint mb-4">
                  {c.flower_count} цветов · позиция {c.sort_order}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    <Pencil className="w-3 h-3 mr-1" /> Изменить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c)}>
                    <Trash2 className="w-3 h-3 text-red" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить категорию' : 'Новая категория'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Фото</Label>
              <input
                type="file" accept="image/*"
                onChange={(e) => setForm({ ...form, photoFile: e.target.files?.[0] || null })}
                className="text-sm text-ink-body"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Порядок</Label>
                <Input type="number" value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
              <label className="flex items-end gap-2 pb-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Активна
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
