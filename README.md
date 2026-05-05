# Цветочная — Full-stack flower shop

Django + React (Vite + TypeScript + Tailwind + shadcn/ui) flower shop.
Multi-shop, manager/worker roles, Sberbank payments, custom bouquet builder,
stock tracking, promotions.

## Local testing (5 minutes)

```bash
unzip flowershop.zip
cd flowershop

# Backend
pip install -r requirements.txt
cp .env.example .env       # edit if needed
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Open http://localhost:8000
```

The pre-built React app is included in `static_frontend/`, so you'll see the
full website immediately. Admin is at `/admin/`.

### To work on the frontend with hot reload

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173, proxies /api to Django
```

When done, rebuild for production:
```bash
npm run build
```

## Railway deployment (10 minutes)

The project includes everything Railway needs: `Procfile`, `railway.toml`,
`runtime.txt`, gunicorn, WhiteNoise, dj-database-url.

### 1. Create Railway project
- Push code to GitHub
- New project → Deploy from GitHub repo
- (Optional) Add a Postgres database service

### 2. Set environment variables on Railway

Required:
```
SECRET_KEY=<generate-strong-random-string>
DEBUG=0
ALLOWED_HOSTS=your-app-name.up.railway.app
MANAGER_SIGNUP_CODE=<random-secret>
WORKER_SIGNUP_CODE=<random-secret>
FIELD_ENCRYPTION_KEY=<run: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">
```

If you added Postgres, Railway auto-provides `DATABASE_URL`.

Optional (only needed when you wire up real Sberbank):
```
SBERBANK_FALLBACK_USERNAME=...
SBERBANK_FALLBACK_PASSWORD=...
```

### 3. First deploy
Railway runs the `release` command from `Procfile` automatically:
- `python manage.py migrate`
- `python manage.py collectstatic --noinput`

Then starts `gunicorn flowershop.wsgi`.

### 4. Create your superuser

In Railway, open the deployment shell:
```bash
python manage.py createsuperuser
```

Visit `https://your-app.up.railway.app/admin/` — log in, create your shop,
add categories/flowers/promotions.

## Pages

- **Customer**: `/`, `/catalog`, `/flowers/:id`, `/custom-bouquet`, `/about`,
  `/cart`, `/checkout`, `/payment/:number`, `/account`
- **Auth**: `/login`, `/signup`, `/staff-signup`
- **Manager**: `/dashboard`, `/dashboard/orders`, `/dashboard/customers`

## Pricing math (verified live)

Red Rose, 150 RUB/stem.
Tiers: 15+ = 95%, 50+ = 90%, 100+ = 85%.

```
25 stems × 150 × 0.95           = 3562.50 RUB
SPRING10 promo (-10%)            = -356.25 RUB
+ delivery                       = +500.00 RUB
                                ─────────────
total                            = 3706.25 RUB   ✓
```

## What was tested locally with `DEBUG=0` + gunicorn

- ✅ React app served on `/`
- ✅ Deep routes (`/catalog`, `/dashboard`, `/flowers/123`) all serve React
- ✅ API (`/api/shops/`, `/api/dashboard/overview/`) works
- ✅ Static JS/CSS bundles served by WhiteNoise
- ✅ Customer signup → login → cart → custom bouquet → checkout → promo → payment-page-load
- ✅ Manager dashboard with KPIs

## Stack

- Django 5 + Django REST Framework + Token auth
- Vite + React 18 + TypeScript
- Tailwind CSS v3 + shadcn/ui
- WhiteNoise (static), gunicorn (server), dj-database-url (Postgres/SQLite)
- Encryption (Fernet) for sensitive fields like Sberbank passwords
- S3-compatible bucket via django-storages (turn on with `USE_S3_STORAGE=1`)

## Project structure

```
flowershop/
├── manage.py, requirements.txt, .env.example
├── Procfile, railway.toml, runtime.txt
├── flowershop/        Django config (settings, urls, storage)
├── accounts/          Shop, User, settings, encryption, customer
├── catalog/           Category, Flower, FlowerSize, DiscountTier, Promotion
├── orders/            Cart, Order, Payment, Invoice, Sberbank client
├── frontend/          React source (run `npm run dev` for hot reload)
└── static_frontend/   Pre-built React app (served by Django)
```
