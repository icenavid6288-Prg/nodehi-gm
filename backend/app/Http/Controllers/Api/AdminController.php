<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $totalOrders = Order::count();
        $totalRevenue = Order::where('payment_status', 'PAID')->sum('total');
        $pendingOrders = Order::where('status', 'PENDING')->count();
        $totalProducts = Product::count();
        $outOfStock = Product::where('stock', 0)->count();
        $totalUsers = User::count();
        $recentOrders = Order::with('items')->orderBy('created_at', 'desc')->take(5)->get();

        return response()->json([
            'ok' => true,
            'stats' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue,
                'pendingOrders' => $pendingOrders,
                'totalProducts' => $totalProducts,
                'outOfStock' => $outOfStock,
                'totalUsers' => $totalUsers,
            ],
            'recentOrders' => $recentOrders,
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $query = Order::with('items')->orderBy('created_at', 'desc');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $orders = $query->paginate(20);

        return response()->json([
            'ok' => true,
            'orders' => $orders->items(),
            'pagination' => [
                'total' => $orders->total(),
                'page' => $orders->currentPage(),
                'lastPage' => $orders->lastPage(),
            ],
        ]);
    }

    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:PENDING,PROCESSING,SHIPPED,DELIVERED,CANCELLED',
            'tracking_code' => 'nullable|string|max:100',
        ]);

        $order = Order::findOrFail($id);
        $order->update([
            'status' => $request->status,
            'tracking_code' => $request->tracking_code ?? $order->tracking_code,
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_ORDER_STATUS',
            'entity_type' => 'Order',
            'entity_id' => $order->id,
            'details' => ['new_status' => $request->status],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'ok' => true,
            'order' => $order,
            'message' => 'وضعیت سفارش به‌روزرسانی شد.',
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'brand'])->orderBy('created_at', 'desc');
        $products = $query->paginate(20);

        return response()->json([
            'ok' => true,
            'products' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'page' => $products->currentPage(),
                'lastPage' => $products->lastPage(),
            ],
        ]);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'price' => 'sometimes|integer|min:0',
            'compare_price' => 'nullable|integer|min:0',
            'stock' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'ok' => true,
            'product' => $product,
            'message' => 'محصول به‌روزرسانی شد.',
        ]);
    }

    public function reviews(Request $request): JsonResponse
    {
        $reviews = Review::with(['product', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'ok' => true,
            'reviews' => $reviews->items(),
            'pagination' => [
                'total' => $reviews->total(),
                'page' => $reviews->currentPage(),
                'lastPage' => $reviews->lastPage(),
            ],
        ]);
    }

    public function moderateReview(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,PENDING',
        ]);

        $review = Review::findOrFail($id);
        $review->update(['status' => $request->status]);

        // Recalculate product rating
        $product = $review->product;
        if ($product) {
            $avg = Review::where('product_id', $product->id)->where('status', 'APPROVED')->avg('rating') ?? 5.0;
            $count = Review::where('product_id', $product->id)->where('status', 'APPROVED')->count();
            $product->update([
                'rating_cache' => round($avg, 1),
                'reviews_count_cache' => $count,
            ]);
        }

        return response()->json([
            'ok' => true,
            'message' => 'وضعیت نظر تغییر کرد.',
        ]);
    }

    public function messages(Request $request): JsonResponse
    {
        $messages = ContactMessage::orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'ok' => true,
            'messages' => $messages->items(),
            'pagination' => [
                'total' => $messages->total(),
                'page' => $messages->currentPage(),
                'lastPage' => $messages->lastPage(),
            ],
        ]);
    }

    public function coupons(): JsonResponse
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();

        return response()->json([
            'ok' => true,
            'coupons' => $coupons,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $values = $request->input('values', $request->all());
        if (is_array($values)) {
            foreach ($values as $key => $val) {
                if (!is_string($key) || in_array($key, ['values', 'group'], true)) {
                    continue;
                }
                \App\Models\Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => is_array($val) ? json_encode($val, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : (string) $val,
                        'group' => 'general',
                        'is_public' => true,
                    ]
                );
            }
        }

        return response()->json([
            'ok' => true,
            'message' => 'تنظیمات ظاهر، لوگو، رنگ و اسلایدشو ذخیره شد.',
        ]);
    }
}

