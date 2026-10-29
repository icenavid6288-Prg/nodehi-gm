<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json([
                'ok' => true,
                'products' => [],
                'categories' => [],
                'brands' => [],
            ]);
        }

        $qClean = str_replace(['ي', 'ك'], ['ی', 'ک'], $q);

        $products = Product::where('is_active', true)
            ->where(function ($sub) use ($qClean) {
                $sub->where('name', 'like', "%{$qClean}%")
                    ->orWhere('name_en', 'like', "%{$qClean}%")
                    ->orWhere('sku', 'like', "%{$qClean}%");
            })
            ->select('id', 'name', 'slug', 'price', 'compare_price', 'thumbnail', 'stock')
            ->take(6)
            ->get();

        $categories = Category::where('name_fa', 'like', "%{$qClean}%")
            ->orWhere('name', 'like', "%{$qClean}%")
            ->select('id', 'name', 'name_fa', 'slug', 'icon')
            ->take(3)
            ->get();

        $brands = Brand::where('name_fa', 'like', "%{$qClean}%")
            ->orWhere('name', 'like', "%{$qClean}%")
            ->select('id', 'name', 'name_fa', 'slug', 'logo')
            ->take(3)
            ->get();

        return response()->json([
            'ok' => true,
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }
}
