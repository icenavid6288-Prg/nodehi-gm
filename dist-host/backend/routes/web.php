<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }
    return response()->json([
        'name' => 'Nodehi Store API',
        'status' => 'running',
        'version' => '1.0.0',
    ]);
});

// Fallback for SPA routing
Route::fallback(function () {
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }
    return response()->json(['message' => 'API endpoint not found.'], 404);
});
