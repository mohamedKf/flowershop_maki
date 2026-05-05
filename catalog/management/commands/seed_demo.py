"""
Demo data seeder for the flower shop.

Usage:
    python manage.py seed_demo            # adds demo data (skips if already exists)
    python manage.py seed_demo --reset    # wipes existing data first

Adds:
    - 5 realistic categories with photos
    - 18 flowers across categories with photos, sizes, discount tiers
    - 4 active promotions (one with promo code)
    - 8 customers with realistic Russian names/phones
    - 25 orders in various states (paid, pending, confirmed, etc.)
    - Stock movement history

Photos are downloaded from Unsplash (free, no API key needed) on first run.
Uses real production-quality images so the demo looks credible.
"""

import io
import random
from datetime import timedelta
from decimal import Decimal
from urllib.request import urlopen, Request

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from accounts.models import Shop, User
from accounts.customer import CustomerAddress
from catalog.models import Category, Flower, FlowerSize, DiscountTier, StockMovement
from catalog.promotions import Promotion
from orders.models import Order, OrderItem


# ---------------------------------------------------------------------------
# Demo data definitions
# ---------------------------------------------------------------------------

CATEGORIES = [
    {
        'name': 'Розы',
        'description': 'Свежие розы из Эквадора и Голландии. Классика на все случаи.',
        'photo_url': 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
        'sort_order': 1,
    },
    {
        'name': 'Пионы',
        'description': 'Нежные ароматные пионы. Сезонные сорта премиум-класса.',
        'photo_url': 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?w=800',
        'sort_order': 2,
    },
    {
        'name': 'Тюльпаны',
        'description': 'Голландские тюльпаны самых разных оттенков.',
        'photo_url': 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800',
        'sort_order': 3,
    },
    {
        'name': 'Полевые букеты',
        'description': 'Авторские букеты в природном стиле — с ромашками, лавандой, эустомой.',
        'photo_url': 'https://images.unsplash.com/photo-1469259943454-aa100abba749?w=800',
        'sort_order': 4,
    },
    {
        'name': 'Орхидеи',
        'description': 'Экзотические орхидеи в горшках — живут долго, цветут красиво.',
        'photo_url': 'https://images.unsplash.com/photo-1610631066894-62452ccb927c?w=800',
        'sort_order': 5,
    },
]

FLOWERS = [
    # category_name, name, base_price, stock, featured, photo_url
    ('Розы', 'Красная роза Эксплорер', '180', 450, True,
     'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=800'),
    ('Розы', 'Белая роза Аваланж', '200', 320, True,
     'https://images.unsplash.com/photo-1455582916367-25f75bfc6710?w=800'),
    ('Розы', 'Розовая роза Мондиаль', '190', 280, False,
     'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800'),
    ('Розы', 'Кустовая роза Мисти Баблз', '220', 150, True,
     'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800'),
    ('Розы', 'Жёлтая роза Пенни Лейн', '180', 200, False,
     'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800'),

    ('Пионы', 'Белый пион Сара Бернар', '450', 80, True,
     'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?w=800'),
    ('Пионы', 'Розовый пион Корал Шарм', '500', 65, True,
     'https://images.unsplash.com/photo-1530092285049-1c42085fd395?w=800'),
    ('Пионы', 'Бордовый пион Карл Розенфилд', '480', 18, False,
     'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800'),

    ('Тюльпаны', 'Розовый тюльпан', '90', 380, True,
     'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800'),
    ('Тюльпаны', 'Жёлтый тюльпан', '85', 350, False,
     'https://images.unsplash.com/photo-1457089328389-f4f888aac4d4?w=800'),
    ('Тюльпаны', 'Белый тюльпан', '90', 240, False,
     'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=800'),
    ('Тюльпаны', 'Фиолетовый тюльпан', '100', 180, True,
     'https://images.unsplash.com/photo-1589123053646-4e8b5493f6a7?w=800'),

    ('Полевые букеты', 'Букет с эустомой', '850', 25, True,
     'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800'),
    ('Полевые букеты', 'Букет с лавандой', '650', 30, False,
     'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800'),
    ('Полевые букеты', 'Ромашковый микс', '550', 40, True,
     'https://images.unsplash.com/photo-1471696035578-3d8c78d99684?w=800'),

    ('Орхидеи', 'Орхидея Фаленопсис белая', '1800', 12, True,
     'https://images.unsplash.com/photo-1610631066894-62452ccb927c?w=800'),
    ('Орхидеи', 'Орхидея Фаленопсис розовая', '1900', 8, False,
     'https://images.unsplash.com/photo-1469259943454-aa100abba749?w=800'),
    ('Орхидеи', 'Орхидея Дендробиум', '2400', 5, True,
     'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=800'),
]

PROMOTIONS = [
    {
        'title': 'Весенняя коллекция',
        'subtitle': 'Скидка 15% на все пионы и тюльпаны',
        'badge_text': '−15%',
        'discount_type': 'percent',
        'discount_value': '15',
        'is_featured': True,
    },
    {
        'title': 'Промокод SPRING25',
        'subtitle': 'Скидка 25% при заказе от 3000 ₽',
        'badge_text': '−25%',
        'discount_type': 'percent',
        'discount_value': '25',
        'promo_code': 'SPRING25',
        'min_order_amount': '3000',
        'is_featured': True,
    },
    {
        'title': 'Букет в подарок от 5000 ₽',
        'subtitle': 'К заказу от 5000 ₽ — фирменный мини-букет в подарок',
        'badge_text': 'Подарок',
        'discount_type': 'fixed',
        'discount_value': '0',
        'min_order_amount': '5000',
        'is_featured': False,
    },
    {
        'title': 'День рождения — особая цена',
        'subtitle': 'Скидка 500 ₽ именинникам в день рождения',
        'badge_text': '−500 ₽',
        'discount_type': 'fixed',
        'discount_value': '500',
        'is_featured': False,
    },
]

CUSTOMERS = [
    ('anna_p', 'Anna', 'Petrova', 'anna.petrova@example.ru', '+7 (918) 555-12-34'),
    ('mikhail_s', 'Mikhail', 'Sokolov', 'm.sokolov@example.ru', '+7 (918) 555-23-45'),
    ('elena_k', 'Elena', 'Kuznetsova', 'elena.k@example.ru', '+7 (918) 555-34-56'),
    ('dmitry_v', 'Dmitry', 'Volkov', 'dmitry@example.ru', '+7 (918) 555-45-67'),
    ('olga_m', 'Olga', 'Morozova', 'olga.m@example.ru', '+7 (918) 555-56-78'),
    ('sergey_n', 'Sergey', 'Novikov', 's.novikov@example.ru', '+7 (918) 555-67-89'),
    ('maria_l', 'Maria', 'Lebedeva', 'maria.l@example.ru', '+7 (918) 555-78-90'),
    ('ivan_z', 'Ivan', 'Zaytsev', 'ivan.z@example.ru', '+7 (918) 555-89-01'),
]

ANAPA_ADDRESSES = [
    'Анапа, ул. Ленина, 12',
    'Анапа, ул. Крымская, 45',
    'Анапа, ул. Терская, 78',
    'Анапа, ул. Гребенская, 23',
    'Анапа, ул. Краснодарская, 56',
    'Анапа, мкр. Анапский 12-й, д. 8',
    'Анапа, ул. Шевченко, 102',
    'Анапа, ул. Парковая, 14',
]

ORDER_STATUSES = [
    ('paid', 0.40),       # 40% paid
    ('processing', 0.20), # 20% being prepared
    ('ready', 0.15),      # 15% ready for delivery
    ('delivered', 0.15),  # 15% delivered
    ('pending', 0.10),    # 10% awaiting payment
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def download_image(url):
    """Fetch an image from a URL and return a ContentFile ready for ImageField."""
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0 flowershop-seed'})
        with urlopen(req, timeout=15) as resp:
            data = resp.read()
        return ContentFile(data)
    except Exception as e:
        print(f'  WARN: failed to fetch {url}: {e}')
        return None


def weighted_choice(choices):
    """Pick a status using probability weights."""
    total = sum(w for _, w in choices)
    r = random.random() * total
    upto = 0
    for choice, weight in choices:
        upto += weight
        if upto >= r:
            return choice
    return choices[-1][0]


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Seed the database with realistic demo data (categories, flowers, customers, orders).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Wipe existing demo data before seeding.',
        )
        parser.add_argument(
            '--no-photos',
            action='store_true',
            help='Skip downloading photos (faster, but boring).',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        shop = Shop.objects.first()
        if not shop:
            self.stdout.write(self.style.ERROR(
                'No shop found. Run `python manage.py migrate` first to auto-create one.'
            ))
            return

        if options['reset']:
            self.stdout.write('Wiping existing data...')
            Order.objects.filter(shop=shop).delete()
            Promotion.objects.filter(shop=shop).delete()
            Flower.objects.filter(category__shop=shop).delete()
            Category.objects.filter(shop=shop).delete()
            User.objects.filter(role='customer').delete()

        download_photos = not options['no_photos']
        self.stdout.write(f'Seeding shop: {shop.name} (slug: {shop.slug})')
        if download_photos:
            self.stdout.write('Downloading photos from Unsplash (this takes ~30 seconds)...')

        # ---- Categories ----
        cat_map = {}
        for cdata in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                shop=shop,
                name=cdata['name'],
                defaults={
                    'slug': slugify(cdata['name'], allow_unicode=True),
                    'description': cdata['description'],
                    'sort_order': cdata['sort_order'],
                    'is_active': True,
                },
            )
            cat_map[cdata['name']] = cat
            if created and download_photos and cdata.get('photo_url'):
                img = download_image(cdata['photo_url'])
                if img:
                    cat.photo.save(f"{cat.slug}.jpg", img, save=True)
            mark = '+' if created else '·'
            self.stdout.write(f'  {mark} category: {cat.name}')

        # ---- Flowers ----
        flower_list = []
        for cat_name, name, price, stock, featured, photo_url in FLOWERS:
            cat = cat_map.get(cat_name)
            if not cat:
                continue
            flower, created = Flower.objects.get_or_create(
                category=cat,
                name=name,
                defaults={
                    'slug': slugify(name, allow_unicode=True),
                    'base_price': Decimal(price),
                    'stock': stock,
                    'low_stock_threshold': 20,
                    'is_active': True,
                    'is_featured': featured,
                    'available_for_custom': True,
                },
            )
            if created and download_photos and photo_url:
                img = download_image(photo_url)
                if img:
                    flower.photo.save(f"{flower.slug}.jpg", img, save=True)

            # Sizes
            for q in [1, 11, 25, 51, 75, 101]:
                FlowerSize.objects.get_or_create(flower=flower, quantity=q)
            # Discount tiers
            DiscountTier.objects.get_or_create(
                flower=flower, min_quantity=15,
                defaults={'percent': Decimal('95')},
            )
            DiscountTier.objects.get_or_create(
                flower=flower, min_quantity=50,
                defaults={'percent': Decimal('90')},
            )
            DiscountTier.objects.get_or_create(
                flower=flower, min_quantity=100,
                defaults={'percent': Decimal('85')},
            )
            flower_list.append(flower)
            mark = '+' if created else '·'
            self.stdout.write(f'  {mark} flower: {name} ({stock} в наличии)')

        # ---- Promotions ----
        now = timezone.now()
        for pdata in PROMOTIONS:
            promo, created = Promotion.objects.get_or_create(
                shop=shop,
                title=pdata['title'],
                defaults={
                    'slug': slugify(pdata['title'], allow_unicode=True),
                    'subtitle': pdata['subtitle'],
                    'badge_text': pdata['badge_text'],
                    'discount_type': pdata['discount_type'],
                    'discount_value': Decimal(pdata['discount_value']),
                    'promo_code': pdata.get('promo_code', ''),
                    'min_order_amount': Decimal(pdata.get('min_order_amount', '0')),
                    'starts_at': now - timedelta(days=2),
                    'ends_at': now + timedelta(days=30),
                    'is_active': True,
                    'is_featured': pdata['is_featured'],
                    'scope': 'all',
                },
            )
            mark = '+' if created else '·'
            self.stdout.write(f'  {mark} promo: {promo.title}')

        # ---- Demo manager account ----
        manager, mgr_created = User.objects.get_or_create(
            username='maki',
            defaults={
                'email': 'maki@example.ru',
                'first_name': 'Maki',
                'last_name': 'Manager',
                'role': 'manager',
                'shop': shop,
                'is_staff': True,
            },
        )
        if mgr_created:
            manager.set_password('maki')
            manager.save()
        mark = '+' if mgr_created else '·'
        self.stdout.write(f'  {mark} manager: {manager.username} (password: maki)')

        # ---- Customers ----
        customer_users = []
        for username, first, last, email, phone in CUSTOMERS:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                    'phone': phone,
                    'role': 'customer',
                },
            )
            if created:
                user.set_password(f'{username}_demo123')
                user.save()
                # Optional saved address
                CustomerAddress.objects.get_or_create(
                    user=user,
                    address_line=random.choice(ANAPA_ADDRESSES),
                    defaults={
                        'is_default': True,
                        'label': 'дом',
                        'recipient_name': f'{first} {last}',
                        'phone': phone,
                    },
                )
            customer_users.append(user)
            mark = '+' if created else '·'
            self.stdout.write(f'  {mark} customer: {first} {last} ({username})')

        # ---- Orders ----
        order_count_target = 25
        existing_orders = Order.objects.filter(shop=shop).count()
        to_create = max(0, order_count_target - existing_orders)
        if to_create > 0:
            self.stdout.write(f'Creating {to_create} orders...')

        for i in range(to_create):
            customer = random.choice(customer_users)
            n_items = random.randint(1, 3)
            chosen = random.sample(flower_list, min(n_items, len(flower_list)))

            # Build line items
            subtotal = Decimal('0')
            line_items = []
            for fl in chosen:
                qty = random.choice([1, 11, 15, 25, 51])
                # Apply tier discount
                multiplier = Decimal('1.00')
                if qty >= 100:
                    multiplier = Decimal('0.85')
                elif qty >= 50:
                    multiplier = Decimal('0.90')
                elif qty >= 15:
                    multiplier = Decimal('0.95')
                unit_price = fl.base_price * multiplier
                line_total = unit_price * qty
                subtotal += line_total
                line_items.append((fl, qty, unit_price, line_total))

            delivery_cost = Decimal(random.choice(['0', '300', '500']))
            discount = Decimal('0')
            promo_code = ''
            if random.random() < 0.25:
                promo_code = 'SPRING25'
                discount = (subtotal * Decimal('0.25')).quantize(Decimal('0.01'))

            total = subtotal - discount + delivery_cost
            status = weighted_choice(ORDER_STATUSES)

            # Order date: spread across last 14 days
            days_ago = random.randint(0, 14)
            created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))

            order = Order.objects.create(
                shop=shop,
                user=customer,
                customer_name=f'{customer.first_name} {customer.last_name}',
                customer_phone=customer.phone,
                customer_email=customer.email,
                delivery_address=random.choice(ANAPA_ADDRESSES),
                delivery_cost=delivery_cost,
                subtotal=subtotal,
                discount_amount=discount,
                promo_code_used=promo_code,
                total=total,
                status=status,
            )
            # Backdate the order
            Order.objects.filter(pk=order.pk).update(created_at=created_at)

            for fl, qty, unit_price, line_total in line_items:
                OrderItem.objects.create(
                    order=order,
                    flower=fl,
                    flower_name=fl.name,
                    stems=qty,
                    quantity=1,
                    unit_price=unit_price,
                    line_total=line_total,
                )
                # Stock movement only for paid orders
                if status == 'paid':
                    StockMovement.objects.create(
                        flower=fl,
                        reason='sale',
                        delta=-qty,
                        stock_after=max(0, fl.stock - qty),
                        related_order=order,
                    )

        # ---- Refresh customer profile metrics ----
        for user in customer_users:
            if hasattr(user, 'customer_profile'):
                user.customer_profile.recompute_metrics()

        self.stdout.write(self.style.SUCCESS('\n✓ Demo data seeded successfully!'))
        self.stdout.write(f'  Categories: {Category.objects.filter(shop=shop).count()}')
        self.stdout.write(f'  Flowers:    {Flower.objects.filter(category__shop=shop).count()}')
        self.stdout.write(f'  Promotions: {Promotion.objects.filter(shop=shop).count()}')
        self.stdout.write(f'  Customers:  {User.objects.filter(role="customer").count()}')
        self.stdout.write(f'  Orders:     {Order.objects.filter(shop=shop).count()}')