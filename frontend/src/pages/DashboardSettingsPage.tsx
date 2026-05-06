import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Shop } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle2, Info } from 'lucide-react';
import { DashboardNav } from '@/components/layout/DashboardNav';

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
    setSaving(true); setErr(null); setSaved(false);
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
      setShop(r.data); setLogoFile(null); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      const data = e?.response?.data;
      setErr(typeof data === 'string' ? data : data?.detail || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!shop) {
    return (
      <div className="container py-32 text-center text-ink-muted">Загрузка...</div>
    );
  }

  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="section-title mb-3">Настройки</h1>
      <DashboardNav />

      <p className="text-sm text-ink-muted mb-8">
        Эти данные показываются клиентам в шапке сайта, в подвале и на странице «О нас».
      </p>

      {/* Backend-driven fields */}
      <Card className="p-7 space-y-5 mb-8">
        <div className="text-[11px] tracking-[0.3em] uppercase text-red font-medium mb-1">
          Основное
        </div>

        <div>
          <Label>Название магазина</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label>Адрес</Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Анапа, ул. Морская 5"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Телефон</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (918) 555-12-34" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@maki.ru" />
          </div>
        </div>

        <div>
          <Label>Логотип</Label>
          <input type="file" accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="text-sm text-ink-body" />
          {shop.logo && !logoFile && (
            <img src={shop.logo} alt="" className="mt-3 h-16 object-contain" />
          )}
        </div>

        <div className="text-xs text-ink-faint pt-2 border-t border-rule">
          URL магазина: <code className="bg-bg-elevated px-2 py-0.5 text-red">{shop.slug}</code>
          &nbsp;— этот идентификатор изменить нельзя.
        </div>

        {err && (
          <div className="text-sm text-red border border-red/40 px-4 py-3">{err}</div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-rule">
          {saved ? (
            <div className="text-sm text-red flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Сохранено
            </div>
          ) : <div />}
          <Button onClick={save} disabled={saving || !name}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </Card>

      {/* Frontend-only info */}
      <Card className="p-6 border-red/30">
        <div className="flex gap-3 items-start">
          <Info className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-body">
            <div className="text-red text-[11px] tracking-[0.25em] uppercase mb-2 font-medium">
              О дополнительных полях
            </div>
            <p className="leading-relaxed mb-2">
              Город, режим работы, описание магазина и тексты на главной странице сейчас
              хранятся в коде сайта и обновляются разработчиком.
            </p>
            <p className="leading-relaxed">
              Чтобы редактировать их через дашборд, попросите разработчика
              расширить модель Shop в Django. Поля готовы к использованию,
              нужна только миграция.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
