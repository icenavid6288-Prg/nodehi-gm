<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\AuthSession;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function requestOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
        ]);

        $phone = $request->phone;

        // Rate limit: check if recent active code exists within last 60 seconds
        $recent = OtpCode::where('phone', $phone)
            ->where('created_at', '>', now()->subSeconds(60))
            ->whereNull('consumed_at')
            ->first();

        if ($recent) {
            return response()->json([
                'ok' => false,
                'error' => [
                    'code' => 'rate_limited',
                    'message' => 'لطفاً ۶۰ ثانیه صبر کرده و مجدداً تلاش نمایید.',
                ],
            ], 429);
        }

        // Generate 5-digit OTP code
        $code = (string) random_int(10000, 99999);
        $codeHash = hash('sha256', $code);

        OtpCode::create([
            'phone' => $phone,
            'code_hash' => $codeHash,
            'expires_at' => now()->addMinutes(3),
            'attempts' => 0,
        ]);

        $data = [
            'ok' => true,
            'message' => 'کد تأیید برای شما پیامک شد.',
            'expiresIn' => 180,
        ];

        // If debug mode or local testing, include the code for easy login
        if (config('app.debug') || env('AUTH_OTP_DEV_MODE', false)) {
            $data['devCode'] = $code;
        }

        return response()->json($data);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
            'code' => ['required', 'string', 'size:5'],
        ]);

        $phone = $request->phone;
        $code = trim($request->code);
        $codeHash = hash('sha256', $code);

        $otp = OtpCode::where('phone', $phone)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderBy('id', 'desc')
            ->first();

        if (!$otp) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'invalid_input', 'message' => 'کد تأیید منقضی شده یا درخواست نشده است.'],
            ], 400);
        }

        if ($otp->attempts >= 5) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'too_many_attempts', 'message' => 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.'],
            ], 429);
        }

        if ($otp->code_hash !== $codeHash) {
            $otp->increment('attempts');
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'invalid_code', 'message' => 'کد وارد شده صحیح نمی‌باشد.'],
            ], 400);
        }

        // Mark OTP consumed
        $otp->update(['consumed_at' => now()]);

        // Find or create user
        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => 'کاربر نودهی',
                'role' => ($phone === '09120000000') ? 'ADMIN' : 'USER',
                'phone_verified_at' => now(),
            ]
        );

        // Generate Bearer token
        $rawToken = Str::random(64);
        $tokenHash = hash('sha256', $rawToken);

        AuthSession::create([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'expires_at' => now()->addDays(30),
        ]);

        return response()->json([
            'ok' => true,
            'token' => $rawToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
            'message' => 'خوش آمدید.',
        ]);
    }

    public function session(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'ok' => false,
                'user' => null,
            ]);
        }

        return response()->json([
            'ok' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'role' => $user->role,
                'email' => $user->email,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $session = $request->attributes->get('current_session');
        if ($session) {
            $session->delete();
        }

        return response()->json([
            'ok' => true,
            'message' => 'با موفقیت خارج شدید.',
        ]);
    }

    public function getAddresses(Request $request): JsonResponse
    {
        $user = auth()->user();
        $addresses = Address::where('user_id', $user->id)->get();

        return response()->json([
            'ok' => true,
            'addresses' => $addresses,
        ]);
    }

    public function storeAddress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:50',
            'recipient_name' => 'required|string|max:100',
            'phone' => ['required', 'regex:/^09[0-9]{9}$/'],
            'province' => 'required|string|max:50',
            'city' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'postal_code' => ['required', 'regex:/^[0-9]{10}$/'],
            'is_default' => 'nullable|boolean',
        ]);

        $user = auth()->user();

        if ($request->boolean('is_default')) {
            Address::where('user_id', $user->id)->update(['is_default' => false]);
        }

        $address = Address::create([
            'user_id' => $user->id,
            ...$validated,
            'is_default' => $request->boolean('is_default'),
        ]);

        return response()->json([
            'ok' => true,
            'address' => $address,
            'message' => 'آدرس با موفقیت ذخیره شد.',
        ], 201);
    }

    public function deleteAddress(int $id): JsonResponse
    {
        $user = auth()->user();
        $address = Address::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $address->delete();

        return response()->json([
            'ok' => true,
            'message' => 'آدرس حذف شد.',
        ]);
    }
}
