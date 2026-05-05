import { Link } from 'react-router-dom';
import { Camera, MessageCircle, Phone } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';

export default function Footer() {
  const { shop } = useShop();
  const name = shop?.name || 'Цветочная';
  const phone = shop?.phone || '';
  const email = shop?.email || '';
  const address = shop?.address || '';

  return (
    <footer className="bg-cream-50 border-t border-blush-100 mt-24">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="font-display text-3xl mb-4">{name}</div>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Авторские букеты из свежих цветов. Создаём цветочные истории
              с любовью и вниманием к деталям.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" className="h-10 w-10 rounded-full bg-white border border-blush-200 flex items-center justify-center hover:bg-blush-50 transition-colors">
                <Camera className="h-4 w-4 text-blush-600" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-white border border-blush-200 flex items-center justify-center hover:bg-blush-50 transition-colors">
                <MessageCircle className="h-4 w-4 text-blush-600" />
              </a>
              {phone && (
                <a href={`tel:${phone}`} className="h-10 w-10 rounded-full bg-white border border-blush-200 flex items-center justify-center hover:bg-blush-50 transition-colors">
                  <Phone className="h-4 w-4 text-blush-600" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">Магазин</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/catalog" className="hover:text-foreground transition-colors">Каталог</Link>
              <Link to="/custom-bouquet" className="hover:text-foreground transition-colors">Свой букет</Link>
              <Link to="/about" className="hover:text-foreground transition-colors">О нас</Link>
              <Link to="/account" className="hover:text-foreground transition-colors">Личный кабинет</Link>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">Контакты</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-foreground transition-colors">{phone}</a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="hover:text-foreground transition-colors">{email}</a>
              )}
              {address && <span>{address}</span>}
              <span>Ежедневно 9:00 – 22:00</span>
            </div>
          </div>
        </div>

        <div className="border-t border-blush-100 mt-12 pt-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 {name}. Все права защищены.</span>
          <span>Сделано с ♡</span>
        </div>
      </div>
    </footer>
  );
}
