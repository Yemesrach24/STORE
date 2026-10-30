# K-FORCE ETHIOPIA — Taekwondo Equipment Store & Inventory Management

An inventory and storefront application for **K-FORCE ETHIOPIA**, a taekwondo /
martial-arts equipment shop. It combines a public product catalogue and ordering
flow with an admin dashboard for managing items, categories, orders and users.

The whole interface is **multilingual**: English, Amharic (አማርኛ) and Korean (한국어).
Store content (items and categories) can also be entered in all three languages.

---

## ✨ Features

### 🛍️ Public storefront (`/shop`)
- Browse equipment by category, live search, promotional carousels.
- Product detail pages with pricing, sizes, images and seller contact details.
- Place an order (guests allowed — no account required) and arrange payment and
  delivery directly with the seller via phone, WhatsApp or Telegram.
- "My Orders" page so buyers can track their own orders.

### 🛠️ Admin dashboard (`/admin`)
- **Dashboard** — key metrics (orders, items, categories, revenue, recent items).
- **Orders** — review, approve or decline customer orders.
- **Categories** — create/edit hierarchical (parent/child) categories.
- **Items** — full product catalogue with pricing, stock, sizes, images and
  contact info.
- **Inventory** — system-wide inventory overview.
- **Analytics** — sales and category performance (Super Admin).
- **Users** — manage accounts and roles (Super Admin).
- **Telegram** — connect and manage the customer-support bot.

### 🌐 Multilingual (English / አማርኛ / 한국어)
- Language switcher in the site header (and shop header), persisted in a cookie.
- **Store content is translatable too**: items and categories carry an English,
  Amharic and Korean version of their name and description (items additionally
  have Korean/Amharic colour, tags, supplier, company name and per-size names).
- When a language is active, the localized value is shown and it falls back to
  English when a translation is missing.
- UI strings live in a single dictionary: [`src/lib/i18n.ts`](./src/lib/i18n.ts).

### 🤖 Telegram bot
- `/start` (with a one-time language picker), `/shop`, `/about`, `/help` and
  `/language` commands.
- The bot replies in the user's chosen language (English / Amharic / Korean),
  saved on their account.
- New orders are pushed to the seller's Telegram chat.
- Works via webhooks in production (HTTPS) and via a manual "Poll for Messages"
  button in local development.

### 🔐 Authentication & roles
- **Google-only sign-in** via Auth.js (NextAuth). No passwords to manage.
- Roles: `SUPER_ADMIN`, `ADMIN`, `CUSTOMER`.
- Role-gated dashboard routes; guests can still browse and order.

---

## 🧰 Tech stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/) (Radix primitives), Lucide icons |
| Auth | [Auth.js / NextAuth](https://authjs.dev/) v5 — Google OAuth 2.0 |
| Database | MongoDB with [Mongoose](https://mongoosejs.com/) |
| Forms & validation | React Hook Form + Zod |
| Testing | Jest + React Testing Library, Playwright (E2E) |

> Note: authentication is Google-only; there are no password-based accounts.

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 18+
- npm (or yarn / pnpm)
- A MongoDB instance (local, Docker, or MongoDB Atlas)
- A Google OAuth 2.0 Client ID (see below)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp env.example .env.local
```
At minimum set:
```env
AUTH_SECRET=            # generate with: openssl rand -base64 32
AUTH_GOOGLE_ID=         # Google OAuth Client ID
AUTH_GOOGLE_SECRET=     # Google OAuth Client Secret
MONGODB_URI=mongodb://localhost:27017/inventory-management
```
Telegram (optional, for the bot):
```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_STORE_URL=http://localhost:3000/shop
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=K_Force_Ethiopia_store
```
`env.example` documents every supported variable.

### 4. Google OAuth setup
1. Open <https://console.cloud.google.com/apis/credentials>.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add an authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
4. Put the generated client ID/secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

A step-by-step walkthrough is in [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md).

### 5. Run the app
```bash
npm run dev
```
Open <http://localhost:3000>. The storefront lives at `/shop` and the dashboard
at `/admin`. On first sign-in the user is created automatically; promote the
first account to `SUPER_ADMIN` in MongoDB to unlock the admin sections.

---

## 📁 Project structure
```
src/
├── app/
│   ├── shop/            # Public storefront (catalogue, product, orders)
│   ├── admin/           # Admin dashboard (orders, items, categories, users, …)
│   ├── dashboard/       # Signed-in user dashboard
│   ├── profile/         # User profile
│   ├── api/             # Route handlers (REST endpoints)
│   └── ...
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── layout/          # Sidebar, Header, DashboardLayout
│   ├── shop/            # ShopHeader
│   ├── i18n/            # LanguageProvider + LanguageSwitcher
│   └── ...
├── lib/                 # i18n dictionary, helpers, mongodb, telegram, price…
├── models/              # Mongoose models (Item, Category, Order, User, …)
└── ...
```

---

## 🌍 Editing translations

All UI text lives in [`src/lib/i18n.ts`](./src/lib/i18n.ts) as three dictionaries
(`en`, `am`, `ko`) keyed by the same identifiers. To add or change a string:

1. Add the key to the `en` object.
2. Add the matching `am` and `ko` values (the Amharic and Korean objects are
   typed against the English keys, so TypeScript will flag anything missing).
3. Use it in components with `const { t } = useLanguage();` → `t("yourKey")`.

Localized **store content** (item/category names, descriptions, etc.) is entered
directly in the admin item and category forms, one field per language.

---

## 🔌 API (overview)
All endpoints are under `/api`. Sessions are cookie-based (NextAuth), so no
manual authorization header is needed.

- `GET/POST /api/items`, `GET/PUT/DELETE /api/items/{id}`, `GET /api/items/export`
- `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`
- `GET/POST /api/orders`, `PATCH /api/orders/{id}`
- `GET /api/shop/items`, `GET /api/shop/items/{id}`, `GET /api/shop/categories`
- `GET /api/admin/users`, `POST /api/admin/users`, `GET /api/admin/inventory`,
  `GET /api/admin/analytics`
- `GET /api/telegram/webhook` (local polling), `POST /api/telegram/webhook`
  (production webhook)

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) and the bundled
`postman_collection.json` for details and examples.

---

## 🧪 Testing
```bash
npm test              # Jest unit + integration
npm run test:unit
npm run test:integration
npm run test:coverage
npm run test:e2e      # Playwright end-to-end
```
See [`TESTING.md`](./TESTING.md) for the full testing guide.

---

## 📜 Scripts
```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint
npm run type-check # TypeScript (tsc --noEmit)
npm run seed       # seed sample data
```

---

## 🤝 Contributing
1. Create a feature branch.
2. Make your changes and run `npm run lint` / `npm test`.
3. Open a pull request.

## 📝 License
MIT — see the [`LICENSE`](./LICENSE) file.
