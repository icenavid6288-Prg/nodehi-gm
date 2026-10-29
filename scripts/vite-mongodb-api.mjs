/**
 * پلاگین میدل‌ور Vite برای پاسخ‌دهی به درخواست‌های /api/* در محیط پیش‌نمایش
 * با خواندن و نوشتن مستقیم روی کالکشن‌های دیتابیس سندگرای MongoDB / NoSQL در مسیر backend/database/mongodb/*.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedMongoCollections } from './seed-mongodb.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mongoDir = join(root, 'backend', 'database', 'mongodb');

function makeObjectId(seed = Date.now()) {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const rand = Math.floor(Math.random() * 0xffffffffff).toString(16).padStart(10, '0');
  const cnt = (seed & 0xffffff).toString(16).padStart(6, '0');
  return (ts + rand + cnt).slice(0, 24);
}

function readCollection(name) {
  const file = join(mongoDir, `${name}.json`);
  if (!existsSync(file)) return [];
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeCollection(name, docs) {
  mkdirSync(mongoDir, { recursive: true });
  const file = join(mongoDir, `${name}.json`);
  writeFileSync(file, JSON.stringify(docs, null, 2), 'utf8');
}

function insertOne(name, doc) {
  const docs = readCollection(name);
  const maxId = docs.reduce((m, d) => Math.max(m, Number(d.id || 0)), 0);
  const nextId = maxId + 1;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const newDoc = {
    _id: makeObjectId(nextId),
    id: nextId,
    ...doc,
    created_at: doc.created_at || now,
    updated_at: now,
  };
  docs.push(newDoc);
  writeCollection(name, docs);
  return newDoc;
}

function updateOne(name, predicate, patch, upsert = false) {
  const docs = readCollection(name);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const idx = docs.findIndex(predicate);
  if (idx !== -1) {
    docs[idx] = { ...docs[idx], ...patch, updated_at: now };
    writeCollection(name, docs);
    return docs[idx];
  }
  if (upsert) {
    return insertOne(name, patch);
  }
  return null;
}

function enrichProducts() {
  const products = readCollection('products');
  const categories = readCollection('categories');
  const brands = readCollection('brands');
  const catMap = new Map(categories.map((c) => [Number(c.id), c]));
  const brandMap = new Map(brands.map((b) => [Number(b.id), b]));

  return products.map((p) => ({
    ...p,
    category: catMap.get(Number(p.category_id)) || categories[0] || null,
    brand: brandMap.get(Number(p.brand_id)) || brands[0] || null,
  }));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, payload, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

function getAuthUser(req) {
  const auth = req.headers['authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(auth));
  if (!m) return null;
  const token = m[1].trim();
  const sessions = readCollection('auth_sessions');
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  const users = readCollection('users');
  return users.find((u) => Number(u.id) === Number(session.user_id)) || null;
}

export function viteMongoDbApiPlugin() {
  return {
    name: 'vite-mongodb-nosql-api',
    configureServer(server) {
      seedMongoCollections({ forceReset: false });

      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || '/';
        if (!urlStr.startsWith('/api')) {
          return next();
        }

        const parsed = new URL(urlStr, 'http://localhost:3000');
        const path = parsed.pathname.replace(/^\/api\/?/, '/').replace(/\/+$/, '') || '/';
        const method = (req.method || 'GET').toUpperCase();
        const query = Object.fromEntries(parsed.searchParams.entries());

        if (method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readJsonBody(req) : {};

        try {
          if (method === 'GET' && path === '/health') {
            const products = readCollection('products');
            return sendJson(res, {
              ok: true,
              status: 'healthy',
              service: 'Nodehi Laravel 12 + MongoDB Document Store',
              database: 'mongodb_document_store',
              catalogSize: products.filter((p) => p.is_active).length,
              timestamp: new Date().toISOString(),
            });
          }

          if (method === 'GET' && path === '/settings/public') {
            const rows = readCollection('settings');
            const map = {};
            for (const r of rows) {
              if (r.is_public !== false) map[r.key] = r.value;
            }
            return sendJson(res, {
              ok: true,
              settings: {
                store_name: map.store_name || 'فروشگاه لوازم خانگی نودهی',
                brand_name: map.brand_name || 'نودهی',
                tagline: map.tagline || 'لوازم خانگی اصیل',
                logo_url: map.logo_url || '',
                primary_color: map.primary_color || '#0F2A43',
                secondary_color: map.secondary_color || '#12B5A5',
                accent_color: map.accent_color || '#FF6B35',
                hero_slides: map.hero_slides || '',
                phone: map.phone || '۰۲۱-۹۱۰۰۰۰۰۰',
                mobile: map.mobile || '۰۹۱۲۰۰۰۰۰۰۰',
                email: map.email || 'info@nodehi.ir',
                address: map.address || 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم',
                free_shipping_threshold: Number(map.free_shipping_threshold || 5000000),
                working_hours: map.working_hours || 'شنبه تا پنجشنبه، ۹ صبح تا ۹ شب',
              },
            });
          }

          if (method === 'GET' && path === '/payments/methods') {
            const methods = readCollection('payment_gateways').filter((m) => m.is_active !== false);
            return sendJson(res, { ok: true, methods });
          }

          if (method === 'GET' && path === '/categories') {
            const categories = readCollection('categories');
            const products = readCollection('products');
            const withCounts = categories.map((c) => ({
              ...c,
              products_count: products.filter((p) => p.is_active && Number(p.category_id) === Number(c.id)).length,
            }));
            return sendJson(res, { ok: true, categories: withCounts });
          }

          if (method === 'GET' && path.startsWith('/categories/')) {
            const slug = decodeURIComponent(path.slice('/categories/'.length));
            const category = readCollection('categories').find((c) => c.slug === slug);
            if (!category) return sendJson(res, { ok: false, error: { message: 'دسته‌بندی یافت نشد' } }, 404);
            return sendJson(res, { ok: true, category });
          }

          if (method === 'GET' && path === '/brands') {
            const brands = readCollection('brands');
            const products = readCollection('products');
            const withCounts = brands.map((b) => ({
              ...b,
              products_count: products.filter((p) => p.is_active && Number(p.brand_id) === Number(b.id)).length,
            }));
            return sendJson(res, { ok: true, brands: withCounts });
          }

          if (method === 'GET' && path.startsWith('/brands/')) {
            const slug = decodeURIComponent(path.slice('/brands/'.length));
            const brand = readCollection('brands').find((b) => b.slug === slug);
            if (!brand) return sendJson(res, { ok: false, error: { message: 'برند یافت نشد' } }, 404);
            return sendJson(res, { ok: true, brand });
          }

          if (method === 'GET' && path === '/products') {
            let list = enrichProducts().filter((p) => p.is_active !== false);
            const q = (query.q || '').trim().toLowerCase();
            if (q) {
              list = list.filter((p) =>
                `${p.name} ${p.name_en || ''} ${p.short_description || ''} ${p.brand?.name_fa || ''}`
                  .toLowerCase()
                  .includes(q)
              );
            }
            if (query.category) list = list.filter((p) => p.category?.slug === query.category);
            if (query.brand) list = list.filter((p) => p.brand?.slug === query.brand);
            if (query.minPrice) list = list.filter((p) => Number(p.price) >= Number(query.minPrice));
            if (query.maxPrice) list = list.filter((p) => Number(p.price) <= Number(query.maxPrice));
            if (query.inverter === '1') list = list.filter((p) => Boolean(p.is_inverter));
            if (query.installment === '1') list = list.filter((p) => Boolean(p.has_installment));
            if (query.ready === '1') list = list.filter((p) => Boolean(p.is_ready_to_ship));
            if (query.instock === '1') list = list.filter((p) => Number(p.stock || 0) > 0);
            if (query.discounted === '1') {
              list = list.filter((p) => p.compare_price && Number(p.compare_price) > Number(p.price));
            }

            const sort = query.sort || 'newest';
            list.sort((a, b) => {
              if (sort === 'price-asc') return Number(a.price) - Number(b.price);
              if (sort === 'price-desc') return Number(b.price) - Number(a.price);
              if (sort === 'popular') return Number(b.sales_count || 0) - Number(a.sales_count || 0);
              if (sort === 'rating') return Number(b.rating_cache || 0) - Number(a.rating_cache || 0);
              return Number(b.id) - Number(a.id);
            });

            const page = Math.max(1, Number(query.page || 1));
            const perPage = Math.max(1, Math.min(48, Number(query.perPage || 12)));
            const total = list.length;
            const lastPage = Math.max(1, Math.ceil(total / perPage));
            const products = list.slice((page - 1) * perPage, page * perPage);

            return sendJson(res, {
              ok: true,
              products,
              pagination: { total, page, perPage, lastPage },
            });
          }

          if (method === 'POST' && /^\/products\/[^/]+\/reviews$/.test(path)) {
            const slug = decodeURIComponent(path.split('/')[2]);
            const prod = readCollection('products').find((p) => p.slug === slug);
            if (!prod) return sendJson(res, { ok: false, error: { message: 'محصول یافت نشد' } }, 404);
            const review = insertOne('reviews', {
              product_id: prod.id,
              author_name: body.author_name || 'کاربر نودهی',
              rating: Number(body.rating || 5),
              title: body.title || '',
              comment: body.comment || '',
              status: 'APPROVED',
              is_verified_purchase: true,
            });
            return sendJson(res, { ok: true, message: 'دیدگاه شما با موفقیت ثبت شد.', review });
          }

          if (method === 'GET' && path.startsWith('/products/')) {
            const slug = decodeURIComponent(path.slice('/products/'.length));
            const all = enrichProducts();
            const product = all.find((p) => p.slug === slug || String(p.id) === slug);
            if (!product) return sendJson(res, { ok: false, error: { message: 'محصول یافت نشد' } }, 404);
            const related = all
              .filter((p) => p.id !== product.id && p.category_id === product.category_id)
              .slice(0, 4);
            const reviews = readCollection('reviews').filter(
              (r) => Number(r.product_id) === Number(product.id) && r.status === 'APPROVED'
            );
            return sendJson(res, { ok: true, product, related, reviews });
          }

          if (method === 'GET' && path === '/search') {
            const q = (query.q || '').trim().toLowerCase();
            const products = q
              ? enrichProducts()
                  .filter((p) => `${p.name} ${p.name_en || ''}`.toLowerCase().includes(q))
                  .slice(0, 8)
              : [];
            const categories = q
              ? readCollection('categories').filter((c) => `${c.name_fa} ${c.name}`.toLowerCase().includes(q))
              : [];
            const brands = q
              ? readCollection('brands').filter((b) => `${b.name_fa} ${b.name}`.toLowerCase().includes(q))
              : [];
            return sendJson(res, { ok: true, products, categories, brands });
          }

          if (method === 'POST' && path === '/checkout/validate-coupon') {
            const code = String(body.code || '').trim().toUpperCase();
            const subtotal = Number(body.subtotal || 0);
            const coupon = readCollection('coupons').find((c) => c.code === code && c.is_active);
            if (!coupon) {
              return sendJson(res, { ok: false, error: { message: 'کد تخفیف معتبر نیست.' } }, 422);
            }
            if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
              return sendJson(
                res,
                { ok: false, error: { message: 'حداقل مبلغ سفارش برای این کد تخفیف رعایت نشده است.' } },
                422
              );
            }
            let discount =
              coupon.type === 'PERCENT'
                ? Math.round((subtotal * Number(coupon.value)) / 100)
                : Number(coupon.value);
            if (coupon.max_discount_amount) {
              discount = Math.min(discount, Number(coupon.max_discount_amount));
            }
            return sendJson(res, { ok: true, discount, coupon });
          }

          if (method === 'POST' && path === '/checkout') {
            const items = Array.isArray(body.items) ? body.items : [];
            if (items.length === 0) {
              return sendJson(res, { ok: false, error: { message: 'سبد خرید خالی است.' } }, 422);
            }
            let subtotal = 0;
            const orderItems = items.map((it) => {
              const price = Number(it.price || 0);
              const quantity = Math.max(1, Number(it.quantity || 1));
              const total = price * quantity;
              subtotal += total;
              return {
                product_id: it.product_id || it.id,
                product_name: it.name || 'کالای نودهی',
                product_slug: it.slug || '',
                thumbnail: it.thumbnail || '/icon.svg',
                price,
                quantity,
                total,
                color: it.color || null,
              };
            });
            const shipping_cost = subtotal >= 5000000 ? 0 : 150000;
            const discount = Number(body.discount || 0);
            const total = Math.max(0, subtotal - discount + shipping_cost);
            const order_number = `ORD-1403-${Math.floor(10000 + Math.random() * 90000)}`;
            const order = insertOne('orders', {
              order_number,
              customer_name: body.customer_name || 'مشتری نودهی',
              phone: body.phone || '',
              province: body.province || 'تهران',
              city: body.city || 'تهران',
              address: body.address || '',
              postal_code: body.postal_code || '',
              subtotal,
              discount,
              shipping_cost,
              total,
              status: 'PROCESSING',
              payment_status: 'PAID',
              payment_method: body.payment_method || 'zarinpal',
              items: orderItems,
            });
            return sendJson(res, {
              ok: true,
              order_number,
              total,
              order,
              payment_url: `/track?order=${encodeURIComponent(order_number)}&phone=${encodeURIComponent(body.phone || '')}`,
            });
          }

          if (method === 'POST' && path === '/orders/track') {
            const order = readCollection('orders').find(
              (o) => o.order_number === body.order_number && (!body.phone || o.phone === body.phone)
            );
            if (!order) {
              return sendJson(res, { ok: false, error: { message: 'سفارشی با این مشخصات یافت نشد.' } }, 404);
            }
            return sendJson(res, { ok: true, order });
          }

          if (method === 'POST' && path === '/auth/otp/request') {
            const phone = String(body.phone || '').replace(/[^0-9]/g, '');
            if (!/^09\d{9}$/.test(phone)) {
              return sendJson(res, { ok: false, error: { message: 'شماره موبایل معتبر نیست.' } }, 422);
            }
            return sendJson(res, {
              ok: true,
              devCode: '12345',
              message: 'کد تأیید ارسال شد (کد آزمایشی: 12345)',
            });
          }

          if (method === 'POST' && path === '/auth/otp/verify') {
            const phone = String(body.phone || '').replace(/[^0-9]/g, '');
            let user = readCollection('users').find((u) => u.phone === phone);
            if (!user) {
              const role = phone === '09120000000' ? 'SUPER_ADMIN' : 'USER';
              user = insertOne('users', {
                name: role === 'SUPER_ADMIN' ? 'مدیر فروشگاه نودهی' : 'کاربر نودهی',
                phone,
                role,
              });
            }
            const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            insertOne('auth_sessions', { user_id: user.id, token });
            return sendJson(res, { ok: true, token, user });
          }

          if (method === 'GET' && path === '/auth/session') {
            const user = getAuthUser(req);
            return sendJson(res, { ok: true, user });
          }

          if (method === 'POST' && path === '/auth/logout') {
            return sendJson(res, { ok: true });
          }

          if (path === '/account/addresses') {
            const user = getAuthUser(req);
            if (method === 'GET') {
              const addresses = user
                ? readCollection('addresses').filter((a) => Number(a.user_id) === Number(user.id))
                : [];
              return sendJson(res, { ok: true, addresses });
            }
            if (method === 'POST') {
              const address = insertOne('addresses', {
                user_id: user?.id || 1,
                title: body.title || 'منزل',
                recipient_name: body.recipient_name || user?.name || 'کاربر',
                phone: body.phone || user?.phone || '',
                province: body.province || 'تهران',
                city: body.city || 'تهران',
                address: body.address || '',
                postal_code: body.postal_code || '',
              });
              return sendJson(res, { ok: true, address });
            }
          }

          if (method === 'DELETE' && path.startsWith('/account/addresses/')) {
            const id = Number(path.split('/').pop());
            const nextList = readCollection('addresses').filter((a) => Number(a.id) !== id);
            writeCollection('addresses', nextList);
            return sendJson(res, { ok: true });
          }

          if (method === 'GET' && path === '/account/orders') {
            const user = getAuthUser(req);
            const orders = user
              ? readCollection('orders').filter((o) => o.phone === user.phone)
              : readCollection('orders');
            return sendJson(res, { ok: true, orders, pagination: { total: orders.length } });
          }

          if (method === 'GET' && path === '/articles') {
            return sendJson(res, {
              ok: true,
              articles: readCollection('articles'),
              categories: readCollection('article_categories'),
            });
          }

          if (method === 'GET' && path.startsWith('/articles/')) {
            const slug = decodeURIComponent(path.slice('/articles/'.length));
            const articles = readCollection('articles');
            const article = articles.find((a) => a.slug === slug) || articles[0] || null;
            return sendJson(res, {
              ok: true,
              article,
              relatedArticles: articles.slice(0, 2),
              relatedProducts: enrichProducts().slice(0, 4),
            });
          }

          if (method === 'GET' && path === '/faqs') {
            const cats = readCollection('faq_categories');
            const faqs = readCollection('faqs');
            return sendJson(res, {
              ok: true,
              categories: cats.map((c) => ({
                ...c,
                faqs: faqs.filter((f) => Number(f.category_id) === Number(c.id)),
              })),
            });
          }

          if (method === 'GET' && path.startsWith('/legal/')) {
            const slug = decodeURIComponent(path.slice('/legal/'.length));
            const page = readCollection('legal_pages').find((p) => p.slug === slug) || null;
            return sendJson(res, { ok: true, page });
          }

          if (method === 'GET' && path === '/loyalty') {
            return sendJson(res, {
              ok: true,
              tiers: readCollection('loyalty_tiers'),
              installments: readCollection('loyalty_installments'),
              steps: readCollection('loyalty_steps'),
            });
          }

          if (method === 'POST' && path === '/contact') {
            insertOne('contact_messages', { ...body, status: 'NEW' });
            return sendJson(res, { ok: true, message: 'پیام شما با موفقیت ثبت شد.' });
          }

          if (method === 'POST' && path === '/stock-alerts') {
            insertOne('stock_alerts', { ...body, is_notified: false });
            return sendJson(res, { ok: true, message: 'درخواست اطلاع‌رسانی ثبت شد.' });
          }

          if (method === 'GET' && path === '/admin/dashboard') {
            const orders = readCollection('orders');
            const products = readCollection('products');
            const users = readCollection('users');
            const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
            return sendJson(res, {
              ok: true,
              stats: {
                totalOrders: orders.length,
                totalRevenue,
                pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
                totalProducts: products.length,
                outOfStock: products.filter((p) => Number(p.stock || 0) <= 0).length,
                totalUsers: users.length,
              },
              recentOrders: orders.slice(0, 10),
            });
          }

          if (method === 'GET' && path === '/admin/orders') {
            const orders = readCollection('orders');
            return sendJson(res, {
              ok: true,
              orders,
              pagination: { total: orders.length, page: 1, lastPage: 1 },
            });
          }

          if (method === 'PUT' && path.startsWith('/admin/orders/')) {
            const id = Number(path.split('/').pop());
            const updated = updateOne(
              'orders',
              (o) => Number(o.id) === id,
              { status: body.status || 'PROCESSING', tracking_code: body.tracking_code || null }
            );
            return sendJson(res, { ok: true, order: updated });
          }

          if (method === 'POST' && path === '/admin/settings') {
            const values = body.values && typeof body.values === 'object' ? body.values : body;
            for (const [k, v] of Object.entries(values)) {
              const strVal = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
              updateOne(
                'settings',
                (s) => s.key === k,
                {
                  key: k,
                  value: strVal,
                  group: k === 'hero_slides' ? 'pages' : 'general',
                  is_public: true,
                },
                true
              );
            }
            return sendJson(res, {
              ok: true,
              message: 'تنظیمات با موفقیت در دیتابیس MongoDB ذخیره شد.',
            });
          }

          return sendJson(res, { ok: false, error: { message: `Not found: ${path}` } }, 404);
        } catch (err) {
          return sendJson(res, { ok: false, error: { message: err?.message || 'Server error' } }, 500);
        }
      });
    },
  };
}
