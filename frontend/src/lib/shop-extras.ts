import type { ShopExtras } from './types';

/**
 * These defaults fill in branding fields that don't yet exist in the Django
 * Shop model. When the backend is extended to store them, swap this constant
 * for `useShop().extras` (or similar).
 */
export const SHOP_EXTRAS: ShopExtras = {
  city: 'Анапа',
  hoursText: '9:00 — 22:00 ежедневно',
  deliveryTimeText: 'Доставка 90 минут',
  tagline:
    'Букет — это последнее, что я могу себе позволить, и первое, без чего не могу жить.',
  establishedYear: '2014',
  social: {
    instagram: '#',
    telegram: '#',
    vk: '#',
    whatsapp: '#',
  },
  hero: {
    eyebrow: '— Глава первая',
    line1: 'Тишина,',
    line2: 'пахнущая',
    line3: 'розами.',
    lede: 'Мы\u00a0собираем букеты как пишут письма\u00a0— медленно, в\u00a0полумраке, когда снаружи уже зажглись фонари.',
  },
};
