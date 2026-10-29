<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'ok' => false,
                'error' => [
                    'code' => 'forbidden',
                    'message' => 'شما دسترسی لازم برای این عملیات را ندارید.',
                ],
            ], 403);
        }

        return $next($request);
    }
}
