import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Shop } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Store, Save, CheckCircle2 } from 'lucide-react';

export default function DashboardSettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const r = await api.get<Shop>('/shops/mine/');
    setShop(r.data);
    setName(r.data.name);
    setAddress(r.data.address || '');
    setPhone(r.data.phone || '');
    setEmail(r.data.email || '');
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    setErr(null);
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('address', address);
      fd.append('phone', phone);
      fd.append('email', email);
      if (logoFile) fd.append('logo', logoFile);

      const r = await api.patch<Shop>(`/shops/${shop.slug}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShop(r.data);
      setLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(typeof data === 'string' ? data : data?.detail || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!shop) {
    return <div className="container py-20 text-center text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Store className="h-7 w-7 text-blush-500" />
        <h1 className="font-display text-4xl">Настройки магазина</h1>
      </div>

      <p className="text-sm text-stone-600 mb-6">
        Эти данные показываются клиентам в шапке сайта, в подвале и на странице «О нас».
      </p>

      <Card className="p-6 space-y-5">
        <div>
          <Label>Название магазина *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label>Адрес</Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Например: Анапа, ул. Ленина 12"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Телефон</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (900) 123-45-67"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@example.ru"
            />
          </div>
        </div>

        <div>
          <Label>Логотип</Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-blush-100 file:text-blush-700 hover:file:bg-blush-200"
          />
          {shop.logo && !logoFile && (
            <img src={shop.logo} alt="" className="mt-2 h-16 object-contain" />
          )}
        </div>

        <div className="text-xs text-stone-500 pt-2 border-t">
          URL магазина: <code className="bg-stone-100 px-1.5 py-0.5 rounded">{shop.slug}</code>
          {' '}— этот идентификатор изменить нельзя, потому что от него зависят все ссылки.
        </div>

        {err && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {err}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <div className="text-sm text-green-700 inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Сохранено
            </div>
          ) : <div />}
          <Button onClick={save} disabled={saving || !name}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
