import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Package, 
  MapPin, 
  LogOut, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPrice, toPersianDigits } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Account: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newTitle, setNewTitle] = useState('منزل');
  const [newName, setNewName] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newProvince, setNewProvince] = useState('تهران');
  const [newCity, setNewCity] = useState('تهران');
  const [newAddress, setNewAddress] = useState('');
  const [newPostal, setNewPostal] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadAccountData() {
      setLoading(true);
      try {
        const [ordersRes, addrRes] = await Promise.all([
          api.getUserOrders(),
          api.getAddresses(),
        ]);
        if (ordersRes.ok) setOrders(ordersRes.orders || []);
        if (addrRes.ok) setAddresses(addrRes.addresses || []);
      } catch (err) {
        console.error('Account load error', err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !newPostal.trim()) return;

    try {
      const res = await api.storeAddress({
        title: newTitle,
        recipient_name: newName,
        phone: newPhone,
        province: newProvince,
        city: newCity,
        address: newAddress,
        postal_code: newPostal,
      });

      if (res.ok && res.address) {
        setAddresses([...addresses, res.address]);
        setShowAddAddress(false);
        setNewAddress('');
        setNewPostal('');
      }
    } catch {
      // Local fallback
      setAddresses([
        ...addresses,
        {
          id: Date.now(),
          title: newTitle,
          recipient_name: newName,
          phone: newPhone,
          province: newProvince,
          city: newCity,
          address: newAddress,
          postal_code: newPostal,
        },
      ]);
      setShowAddAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch {
      setAddresses(addresses.filter((a) => a.id !== id));
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs items={[{ label: 'حساب کاربری من' }]} />

      {/* Account Header Banner */}
      <div className="bg-primary text-white p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <UserIcon className="w-8 h-8 text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-black">{user.name || 'کاربر نودهی'}</h1>
            <p className="text-xs text-slate-300 mt-1">
              شماره همراه: {toPersianDigits(user.phone)}
            </p>
            {isAdmin && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-primary font-bold text-[10px] mt-2">
                مدیر کل فروشگاه
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 bg-secondary text-primary font-bold text-xs rounded-xl hover:bg-secondary-light transition-colors"
            >
              ورود به پنل مدیریت
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'border-secondary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>سفارش‌های من ({toPersianDigits(orders.length)})</span>
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'addresses'
              ? 'border-secondary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>آدرس‌های تحویل ({toPersianDigits(addresses.length)})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">هنوز سفارشی ثبت نکرده‌اید</h3>
              <p className="text-xs text-slate-500">
                می‌توانید همین حالا محصولات مورد نظر خود را از فروشگاه خریداری نمایید.
              </p>
              <Link
                to="/shop"
                className="inline-block mt-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl"
              >
                رفتن به فروشگاه
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id || o.order_number}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400">کد سفارش: </span>
                      <span className="font-mono font-bold text-primary">{o.order_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">وضعیت: </span>
                      <span className="font-bold text-secondary">
                        {o.status === 'PENDING'
                          ? 'در انتظار بررسی'
                          : o.status === 'PROCESSING'
                          ? 'در حال پردازش'
                          : o.status === 'SHIPPED'
                          ? 'ارسال شده'
                          : 'تحویل داده شده'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">مبلغ کل: </span>
                      <span className="font-bold text-slate-800">{formatPrice(o.total)}</span>
                    </div>
                    <Link
                      to={`/track?order=${o.order_number}&phone=${o.phone || user.phone}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                    >
                      جزئیات و پیگیری
                    </Link>
                  </div>

                  {o.items && o.items.length > 0 && (
                    <div className="text-xs text-slate-600 space-y-1">
                      {o.items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>{it.product_name}</span>
                          <span>{toPersianDigits(it.quantity)} عدد</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">نشانی‌های ثبت‌شده</h3>
            <button
              onClick={() => setShowAddAddress(true)}
              className="px-4 py-2 bg-secondary text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-secondary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن آدرس جدید</span>
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">هیچ آدرسی ثبت نشده است</h3>
              <p className="text-xs text-slate-500">برای تسریع در فرآیند خرید، یک نشانی پستی ثبت فرمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col justify-between"
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary text-sm">{a.title}</span>
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="text-slate-400 hover:text-rose-500"
                        title="حذف آدرس"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {a.province}، {a.city}، {a.address}
                    </p>
                    <div className="text-slate-400 space-y-0.5">
                      <p>تحویل‌گیرنده: {a.recipient_name} ({toPersianDigits(a.phone)})</p>
                      <p>کد پستی: {toPersianDigits(a.postal_code)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Address Modal */}
          {showAddAddress && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
                <h3 className="font-bold text-base text-slate-800">افزودن آدرس پستی جدید</h3>
                <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">عنوان آدرس (منزل، محل کار...)</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">استان</label>
                      <input
                        type="text"
                        required
                        value={newProvince}
                        onChange={(e) => setNewProvince(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">شهر</label>
                      <input
                        type="text"
                        required
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">نشانی کامل</label>
                    <textarea
                      required
                      rows={2}
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">کد پستی ۱۰ رقمی</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={newPostal}
                      onChange={(e) => setNewPostal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary-dark"
                    >
                      ذخیره آدرس
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
