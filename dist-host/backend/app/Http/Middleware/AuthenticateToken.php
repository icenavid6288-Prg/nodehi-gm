<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuthSession;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'ok' => false,
                'error' => [
                    'code' => 'unauthorized',
                    'message' => 'برای دسترسی به این بخش، لطفاً وارد حساب کاربری خود شوید.',
                ],
            ], 401);
        }

        $tokenHash = hash('sha256', $token);
        $session = AuthSession::with('user')
            ->where('token_hash', $tokenHash)
            ->where('expires_at', '>', now())
            ->first();

        if (!$session || !$session->user) {
            return response()->json([
                'ok' => false,
                'error' => [
                    'code' => 'unauthorized',
                    'message' => 'نشست کاربری نامعتبر است یا منقضی شده است.',
                ],
            ], 401);
        }

        auth()->setUser($session->user);
        $request->attributes->set('current_session', $session);

        return $next($request);
    }
}
