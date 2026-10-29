<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\EngagementController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Storefront Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', [SettingController::class, 'health']);
Route::get('/settings/public', [SettingController::class, 'publicSettings']);
Route::get('/payments/methods', [SettingController::class, 'paymentMethods']);

// Catalog & Products
Route::get('/categories', [CatalogController::class, 'categories']);
Route::get('/categories/{slug}', [CatalogController::class, 'categoryBySlug']);
Route::get('/brands', [CatalogController::class, 'brands']);
Route::get('/brands/{slug}', [CatalogController::class, 'brandBySlug']);
Route::get('/filters', [CatalogController::class, 'filters']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/products/{slug}/reviews', [ProductController::class, 'reviews']);
Route::post('/products/{slug}/reviews', [ProductController::class, 'submitReview']);

Route::get('/search', [SearchController::class, 'search']);

// Checkout & Orders
Route::post('/checkout', [CheckoutController::class, 'checkout']);
Route::post('/checkout/validate-coupon', [CheckoutController::class, 'validateCoupon']);
Route::post('/orders/track', [OrderController::class, 'track']);

// Content & Pages
Route::get('/articles', [ContentController::class, 'articles']);
Route::get('/articles/{slug}', [ContentController::class, 'articleBySlug']);
Route::get('/faqs', [ContentController::class, 'faqs']);
Route::get('/legal/{slug}', [ContentController::class, 'legal']);
Route::get('/loyalty', [ContentController::class, 'loyalty']);

// Engagement
Route::post('/contact', [EngagementController::class, 'contact']);
Route::post('/stock-alerts', [EngagementController::class, 'stockAlert']);

// Auth (OTP)
Route::post('/auth/otp/request', [AuthController::class, 'requestOtp']);
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);

/*
|--------------------------------------------------------------------------
| Authenticated User Routes (Bearer Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth.token')->group(function () {
    Route::get('/auth/session', [AuthController::class, 'session']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // User Profile & Addresses
    Route::get('/account/addresses', [AuthController::class, 'getAddresses']);
    Route::post('/account/addresses', [AuthController::class, 'storeAddress']);
    Route::delete('/account/addresses/{id}', [AuthController::class, 'deleteAddress']);

    // User Orders
    Route::get('/account/orders', [OrderController::class, 'userOrders']);
    Route::get('/account/orders/{orderNumber}', [OrderController::class, 'userOrderDetail']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes (auth.token + admin)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth.token', 'admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/orders', [AdminController::class, 'orders']);
    Route::put('/orders/{id}', [AdminController::class, 'updateOrderStatus']);
    Route::get('/products', [AdminController::class, 'products']);
    Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
    Route::get('/reviews', [AdminController::class, 'reviews']);
    Route::put('/reviews/{id}', [AdminController::class, 'moderateReview']);
    Route::get('/messages', [AdminController::class, 'messages']);
    Route::get('/coupons', [AdminController::class, 'coupons']);
    Route::post('/settings', [AdminController::class, 'updateSettings']);
    Route::put('/settings', [AdminController::class, 'updateSettings']);
});

