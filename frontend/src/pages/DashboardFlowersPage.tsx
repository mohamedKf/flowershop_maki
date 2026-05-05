import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Flower, Category, FlowerSize, DiscountTier } from '@/lib/types';
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
import { Plus, Pencil, Trash2, Package, AlertTriangle, ImagePlus } from 'lucide-react';
import { formatRub } from '@/lib/utils';

interface FlowerForm {
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

const emptyForm: FlowerForm = {
  category: '', name: '', description: '', base_price: '0', stock: 0,
  low_stock_threshold: 10, is_active: true, is_featured: false,
  available_for_custom: true, photoFile: null,
};

export default function DashboardFlowersPage() {
  const [items, setItems] = useState<Flower[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [form, setForm] = useState<FlowerForm>(emptyForm);
  const [sizes, setSizes] = useState<FlowerSize[]>([]);
  const [tiers, setTiers] = useState<DiscountTier[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Restock dialog
  const [restockFor, setRestockFor] = useState<Flower | null>(null);
  const [restockDelta, setRestockDelta] = useState(50);
  const [restockNote, setRestockNote] = useState('');

  const load = async () => {
    const [r1, r2] = await Promise.all([
      api.get<Flower[]>('/flowers/'),
      api.get<Category[]>('/categories/'),
    ]);
    setItems(r1.data);
    setCats(r2.data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, category: cats[0]?.id || '' });
    setSizes([]);
    setTiers([]);
    setErr(null);
    setOpen(true);
  };

  const openEdit = async (f: Flower) => {
    // Refetch detail to get sizes + tiers
    const r = await api.get<Flower>(`/flowers/${f.id}/`);
    const detail = r.data;
    setEditing(detail);
    setForm({
      category: detail.category,
      name: detail.name,
      description: detail.description || '',
      base_price: detail.base_price,
      stock: detail.stock,
      low_stock_threshold: detail.low_stock_threshold || 10,
      is_active: detail.is_active,
      is_featured: detail.is_featured,
      available_for_custom: detail.available_for_custom,
      photoFile: null,
    });
    setSizes(detail.sizes || []);
    setTiers(detail.discount_tiers || []);
    setErr(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.category) {
      setErr('Выберите категорию');
      return;
    }
    setSaving(true);
    setErr(null);
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

      let saved: Flower;
      if (editing) {
        const r = await api.patch<Flower>(`/flowers/${editing.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        saved = r.data;
      } else {
        const r = await api.post<Flower>('/flowers/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        saved = r.data;
      }

      // Sync sizes
      const existingSizes = editing?.sizes || [];
      // Delete removed
      for (const old of existingSizes) {
        if (!sizes.find((s) => s.id === old.id)) {
          await api.delete(`/sizes/${old.id}/`);
        }
      }
      // Add new (no id)
      for (const s of sizes) {
        if (!s.id || s.id < 0) {
          await api.post('/sizes/', { flower: saved.id, quantity: s.quantity });
        }
      }

      // Sync tiers
      const existingTiers = editing?.discount_tiers || [];
      for (const old of existingTiers) {
        if (!tiers.find((t) => t.id === old.id)) {
          await api.delete(`/tiers/${old.id}/`);
        }
      }
      for (const t of tiers) {
        if (!t.id || t.id < 0) {
          await api.post('/tiers/', {
            flower: saved.id,
            min_quantity: t.min_quantity,
            percent: t.percent,
          });
        }
      }

      setOpen(false);
      load();
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(typeof data === 'string' ? data : data?.detail || JSON.stringify(data) || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f: Flower) => {
    if (!confirm(`Удалить «${f.name}»?`)) return;
    await api.delete(`/flowers/${f.id}/`);
    load();
  };

  const addSize = () => {
    setSizes([...sizes, {
      id: -Date.now(), flower: 0, quantity: 1, label: '', price: '0', is_active: true,
    }]);
  };

  const addTier = () => {
    setTiers([...tiers, {
      id: -Date.now(), flower: 0, min_quantity: 10, percent: '95',
    }]);
  };

  const doRestock = async () => {
    if (!restockFor || restockDelta === 0) return;
    try {
      await api.post(`/flowers/${restockFor.id}/restock/`, {
        delta: restockDelta,
        note: restockNote,
      });
      setRestockFor(null);
      setRestockNote('');
      setRestockDelta(50);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Ошибка пополнения');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-4xl">Цветы</h1>
        <Button onClick={openNew} disabled={cats.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Добавить
        </Button>
      </div>

      {cats.length === 0 && (
        <Card className="p-8 text-center text-stone-500 mb-4">
          Сначала создайте хотя бы одну категорию.
        </Card>
      )}

      {items.length === 0 && cats.length > 0 && (
        <Card className="p-12 text-center text-stone-500">Пока нет цветов.</Card>
      )}

      <div className="space-y-3">
        {items.map((f) => (
          <Card key={f.id} className="p-4 flex items-center gap-4">
            {f.photo ? (
              <img src={f.photo} alt={f.name} className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-blush-50 rounded-lg flex items-center justify-center">
                <ImagePlus className="h-6 w-6 text-blush-300" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{f.name}</h3>
                <Badge variant="secondary">{f.category_name}</Badge>
                {f.is_featured && <Badge>хит</Badge>}
                {!f.is_active && <Badge variant="secondary">скрыт</Badge>}
                {f.is_out_of_stock && (
                  <Badge className="bg-rose-100 text-rose-700">нет в наличии</Badge>
                )}
                {!f.is_out_of_stock && f.is_low_stock && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-3 w-3 mr-1" /> мало
                  </Badge>
                )}
              </div>
              <div className="text-sm text-stone-500 mt-1">
                {formatRub(f.base_price)} за стебель · в наличии {f.stock}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setRestockFor(f)}>
                <Package className="h-3 w-3 mr-1" /> Пополнить
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(f)}>
                <Trash2 className="h-3 w-3 text-rose-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit/create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить цветок' : 'Новый цветок'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Категория *</Label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
                >
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Название *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
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
                <Label>Цена за стебель ₽ *</Label>
                <Input
                  type="number" step="0.01"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                />
              </div>
              <div>
                <Label>В наличии</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Порог «мало»</Label>
                <Input
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Фото</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, photoFile: e.target.files?.[0] || null })}
                className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-blush-100 file:text-blush-700 hover:file:bg-blush-200"
              />
              {editing?.photo && !form.photoFile && (
                <img src={editing.photo} alt="" className="mt-2 h-20 w-20 object-cover rounded-lg" />
              )}
            </div>

            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-blush-300"
                />
                Активен
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox" checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="rounded border-blush-300"
                />
                Хит продаж
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox" checked={form.available_for_custom}
                  onChange={(e) => setForm({ ...form, available_for_custom: e.target.checked })}
                  className="rounded border-blush-300"
                />
                Доступен в букетах
              </label>
            </div>

            {/* Sizes */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <Label>Размеры букета (готовые наборы)</Label>
                <Button type="button" size="sm" variant="ghost" onClick={addSize}>
                  <Plus className="h-3 w-3 mr-1" /> Добавить
                </Button>
              </div>
              {sizes.length === 0 && (
                <p className="text-xs text-stone-500">
                  Например, 11, 25, 51 цветок. Пусто — клиент сможет указать любое количество.
                </p>
              )}
              <div className="space-y-2">
                {sizes.map((s, i) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <Input
                      type="number" min={1}
                      value={s.quantity}
                      onChange={(e) => {
                        const next = [...sizes];
                        next[i] = { ...s, quantity: Number(e.target.value) };
                        setSizes(next);
                      }}
                      className="w-32"
                    />
                    <span className="text-sm text-stone-500">шт.</span>
                    <Button
                      type="button" size="sm" variant="ghost"
                      onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3 w-3 text-rose-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiers */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <Label>Скидки за объём</Label>
                <Button type="button" size="sm" variant="ghost" onClick={addTier}>
                  <Plus className="h-3 w-3 mr-1" /> Добавить
                </Button>
              </div>
              {tiers.length === 0 && (
                <p className="text-xs text-stone-500">
                  Например, от 15 шт — 95%, от 50 — 90%, от 100 — 85%.
                </p>
              )}
              <div className="space-y-2">
                {tiers.map((t, i) => (
                  <div key={t.id} className="flex gap-2 items-center">
                    <span className="text-sm">от</span>
                    <Input
                      type="number" min={1}
                      value={t.min_quantity}
                      onChange={(e) => {
                        const next = [...tiers];
                        next[i] = { ...t, min_quantity: Number(e.target.value) };
                        setTiers(next);
                      }}
                      className="w-24"
                    />
                    <span className="text-sm">шт. —</span>
                    <Input
                      type="number" min={1} max={100} step="0.01"
                      value={t.percent}
                      onChange={(e) => {
                        const next = [...tiers];
                        next[i] = { ...t, percent: e.target.value };
                        setTiers(next);
                      }}
                      className="w-24"
                    />
                    <span className="text-sm">% от цены</span>
                    <Button
                      type="button" size="sm" variant="ghost"
                      onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3 w-3 text-rose-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {err && <div className="text-sm text-rose-600">{err}</div>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.category}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock dialog */}
      <Dialog open={!!restockFor} onOpenChange={(v) => !v && setRestockFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пополнить запас</DialogTitle>
          </DialogHeader>
          {restockFor && (
            <div className="space-y-4">
              <div className="text-sm text-stone-600">
                «{restockFor.name}» — сейчас в наличии: <strong>{restockFor.stock}</strong>
              </div>
              <div>
                <Label>Изменение количества (можно отрицательное)</Label>
                <Input
                  type="number"
                  value={restockDelta}
                  onChange={(e) => setRestockDelta(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Комментарий</Label>
                <Input
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="Например: поставка от 5 мая"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestockFor(null)}>Отмена</Button>
            <Button onClick={doRestock}>Подтвердить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
