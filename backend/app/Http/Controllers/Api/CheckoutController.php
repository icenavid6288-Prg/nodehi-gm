<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:100',
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
            'province' => 'required|string|max:50',
            'city' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'postal_code' => ['required', 'regex:/^[0-9]{10}$/'],
            'payment_method' => 'required|string|in:zarinpal,snappay,card_to_card,cod',
            'coupon_code' => 'nullable|string|max:30',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.color' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $orderItemsData = [];

            // 1. Validate items and stock
            foreach ($validated['items'] as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);
                if (!$product || !$product->is_active) {
                    return response()->json([
                        'ok' => false,
                        'error' => ['code' => 'not_found', 'message' => "محصول انتخاب شده یافت نشد."],
                    ], 404);
                }

                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'ok' => false,
                        'error' => [
                            'code' => 'insufficient_stock',
                            'message' => "موجودی کالای «{$product->name}» کافی نیست (موجودی فعلی: {$product->stock}).",
                        ],
                    ], 409);
                }

                $itemTotal = $product->price * $item['quantity'];
                $subtotal += $itemTotal;

                $orderItemsData[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'total' => $itemTotal,
                    'color' => $item['color'] ?? null,
                ];
            }

            // 2. Validate Coupon
            $discount = 0;
            $couponId = null;
            if (!empty($validated['coupon_code'])) {
                $coupon = Coupon::where('code', trim($validated['coupon_code']))
                    ->where('is_active', true)
                    ->first();

                if ($coupon && $coupon->isValid($subtotal)) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $couponId = $coupon->id;
                    $coupon->increment('used_count');
                }
            }

            // Shipping cost: free for orders over 5,000,000 Tomans, otherwise 150,000 Tomans
            $freeShippingThreshold = 5000000;
            $shippingCost = ($subtotal >= $freeShippingThreshold) ? 0 : 150000;
            $total = max(0, $subtotal - $discount + $shippingCost);

            // Generate order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => auth()->id(),
                'customer_name' => $validated['customer_name'],
                'phone' => $validated['phone'],
                'province' => $validated['province'],
                'city' => $validated['city'],
                'address' => $validated['address'],
                'postal_code' => $validated['postal_code'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'coupon_id' => $couponId,
                'status' => 'PENDING',
                'payment_status' => 'PENDING',
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Save order items and decrement stock
            foreach ($orderItemsData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product']->id,
                    'product_name' => $itemData['product']->name,
                    'product_slug' => $itemData['product']->slug,
                    'thumbnail' => $itemData['product']->thumbnail,
                    'price' => $itemData['price'],
                    'quantity' => $itemData['quantity'],
                    'total' => $itemData['total'],
                    'color' => $itemData['color'],
                ]);

                $itemData['product']->decrement('stock', $itemData['quantity']);
                $itemData['product']->increment('sales_count', $itemData['quantity']);
            }

            // Determine payment redirect or completion
            $paymentUrl = null;
            if ($validated['payment_method'] === 'zarinpal') {
                $paymentUrl = route('api.payments.zarinpal.pay', ['order' => $order->order_number], false) ?? "/checkout/result?order={$order->order_number}&status=success";
            } elseif ($validated['payment_method'] === 'snappay') {
                $paymentUrl = "/checkout/result?order={$order->order_number}&status=success";
            } else {
                $paymentUrl = "/checkout/result?order={$order->order_number}&status=success";
            }

            $order->update(['payment_redirect_url' => $paymentUrl]);

            return response()->json([
                'ok' => true,
                'order_number' => $order->order_number,
                'total' => $order->total,
                'payment_method' => $order->payment_method,
                'payment_url' => $paymentUrl,
                'message' => 'سفارش شما با موفقیت ثبت شد.',
            ], 201);
        });
    }

    public function validateCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|integer|min:0',
        ]);

        $coupon = Coupon::where('code', trim($request->code))
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'invalid_coupon', 'message' => 'کد تخفیف وارد شده معتبر نیست.'],
            ], 404);
        }

        if (!$coupon->isValid((int) $request->subtotal)) {
            $msg = 'شرایط استفاده از این کد تخفیف برقرار نیست.';
            if ($coupon->min_order_amount && $request->subtotal < $coupon->min_order_amount) {
                $msg = 'حداقل مبلغ سفارش برای این کد تخفیف ' . number_format($coupon->min_order_amount) . ' تومان است.';
            }
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'invalid_coupon', 'message' => $msg],
            ], 400);
        }

        $discount = $coupon->calculateDiscount((int) $request->subtotal);

        return response()->json([
            'ok' => true,
            'discount' => $discount,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'message' => 'کد تخفیف با موفقیت اعمال شد.',
        ]);
    }
}
