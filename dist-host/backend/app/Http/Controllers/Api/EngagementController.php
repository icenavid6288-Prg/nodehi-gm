<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\StockAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EngagementController extends Controller
{
    public function contact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
            'email' => 'nullable|email|max:100',
            'subject' => 'required|string|max:150',
            'message' => 'required|string|min:10|max:2000',
        ]);

        $contact = ContactMessage::create([
            ...$validated,
            'status' => 'NEW',
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'پیام شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
        ], 201);
    }

    public function stockAlert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
            'email' => 'nullable|email|max:100',
        ]);

        $alert = StockAlert::firstOrCreate([
            'product_id' => $validated['product_id'],
            'phone' => $validated['phone'],
        ], [
            'email' => $validated['email'] ?? null,
            'is_notified' => false,
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'درخواست شما ثبت شد. به محض موجود شدن کالا، از طریق پیامک به شما اطلاع داده خواهد شد.',
        ]);
    }
}
