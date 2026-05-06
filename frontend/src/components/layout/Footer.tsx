import { Link } from 'react-router-dom';
import { useShop } from '@/contexts/ShopContext';

export function Footer() {
  const { shop, extras } = useShop();

  return (
    <footer className="relative bg-bg-stage2 border-t border-rule pt-20 pb-8 overflow-hidden mt-12">
      {/* Decorative whisper text */}
      <div
        aria-hidden
        className="brand-whisper absolute -bottom-10 -right-5 leading-[0.85]"
        style={{ fontSize: 'clamp(180px, 22vw, 320px)' }}
      >
        маки
      </div>

      <div className="container relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 mb-16">
          {/* Brand col */}
          <div>
            <div className="font-script text-5xl text-white leading-[0.9] mb-1">
              маки
            </div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-red mb-7 font-medium">
              Цветочное ателье · {extras.city}
            </div>
            <p className="font-serif italic text-lg text-ink-body max-w-[320px] leading-relaxed mb-7">
              «{extras.tagline}»
            </p>
            <div className="flex gap-3">
              {extras.social.instagram && (
                <SocialBtn href={extras.social.instagram} label="IG" />
              )}
              {extras.social.telegram && (
                <SocialBtn href={extras.social.telegram} label="TG" />
              )}
              {extras.social.vk && <SocialBtn href={extras.social.vk} label="VK" />}
              {extras.social.whatsapp && (
                <SocialBtn href={extras.social.whatsapp} label="WA" />
              )}
            </div>
          </div>

          <FooterCol title="Магазин">
            <Link to="/catalog">Каталог</Link>
            <Link to="/custom-bouquet">Свой букет</Link>
            <Link to="/about">О студии</Link>
          </FooterCol>

          <FooterCol title="Связь">
            {shop?.phone && <a href={`tel:${shop.phone}`}>{shop.phone}</a>}
            {shop?.email && <a href={`mailto:${shop.email}`}>{shop.email}</a>}
            {shop?.address && <span className="block text-ink-body mb-3 text-sm">{shop.address}</span>}
            <span className="block text-ink-body text-sm">{extras.hoursText}</span>
          </FooterCol>
        </div>

        <div className="pt-8 border-t border-rule flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-ink-faint">
          <span>© {new Date().getFullYear()} {shop?.name || 'Маки'} · с {extras.establishedYear}</span>
          <span>Made with <span className="text-red">✦</span> in {extras.city}</span>
        </div>
      </div>
    </footer>
  );
}

function SocialBtn({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 border border-rule-strong flex items-center justify-center text-xs font-semibold tracking-wider text-ink-body hover:bg-red hover:border-red hover:text-white hover:-translate-y-0.5 transition-all"
    >
      {label}
    </a>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[11px] tracking-[0.3em] uppercase text-red mb-6 font-medium">
        {title}
      </h4>
      <div className="space-y-3 [&>a]:block [&>a]:text-sm [&>a]:text-ink-body [&>a]:no-underline [&>a:hover]:text-white [&>a]:transition-colors">
        {children}
      </div>
    </div>
  );
}
