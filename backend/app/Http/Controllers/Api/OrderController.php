<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function track(Request $request): JsonResponse
    {
        $request->validate([
            'order_number' => 'required|string',
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
        ]);

        $order = Order::with('items')
            ->where('order_number', trim($request->order_number))
            ->where('phone', trim($request->phone))
            ->first();

        if (!$order) {
            return response()->json([
                'ok' => false,
                'error' => [
                    'code' => 'not_found',
                    'message' => 'سفارشی با این مشخصات یافت نشد. لطفاً شماره سفارش و موبایل را بررسی فرمایید.',
                ],
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'order' => $order,
        ]);
    }

    public function userOrders(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'unauthorized', 'message' => 'ابتدا وارد شوید.'],
            ], 401);
        }

        $orders = Order::with('items')
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('phone', $user->phone);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

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

    public function userOrderDetail(Request $request, string $orderNumber): JsonResponse
    {
        $user = auth()->user();
        $order = Order::with('items')
            ->where('order_number', $orderNumber)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('phone', $user->phone);
            })
            ->first();

        if (!$order) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'not_found', 'message' => 'سفارش یافت نشد.'],
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'order' => $order,
        ]);
    }
}
