<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = Category::withCount('products')
            ->orderBy('order')
            ->get();

        return response()->json([
            'ok' => true,
            'categories' => $categories,
        ]);
    }

    public function categoryBySlug(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)
            ->with(['children', 'products' => function ($q) {
                $q->where('is_active', true)->take(20);
            }])
            ->first();

        if (!$category) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'not_found', 'message' => 'دسته‌بندی مورد نظر یافت نشد.'],
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'category' => $category,
        ]);
    }

    public function brands(): JsonResponse
    {
        $brands = Brand::withCount('products')
            ->orderBy('order')
            ->get();

        return response()->json([
            'ok' => true,
            'brands' => $brands,
        ]);
    }

    public function brandBySlug(string $slug): JsonResponse
    {
        $brand = Brand::where('slug', $slug)
            ->with(['products' => function ($q) {
                $q->where('is_active', true)->take(20);
            }])
            ->first();

        if (!$brand) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'not_found', 'message' => 'برند مورد نظر یافت نشد.'],
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'brand' => $brand,
        ]);
    }

    public function filters(): JsonResponse
    {
        $minPrice = Product::where('is_active', true)->min('price') ?? 0;
        $maxPrice = Product::where('is_active', true)->max('price') ?? 100000000;
        $categories = Category::select('id', 'name', 'name_fa', 'slug')->get();
        $brands = Brand::select('id', 'name', 'name_fa', 'slug')->get();

        return response()->json([
            'ok' => true,
            'filters' => [
                'price' => [
                    'min' => $minPrice,
                    'max' => $maxPrice,
                ],
                'categories' => $categories,
                'brands' => $brands,
                'energyGrades' => ['A+++', 'A++', 'A+', 'A', 'B'],
                'sortOptions' => [
                    ['id' => 'relevance', 'label' => 'مرتبط‌ترین'],
                    ['id' => 'newest', 'label' => 'جدیدترین'],
                    ['id' => 'price-asc', 'label' => 'ارزان‌ترین'],
                    ['id' => 'price-desc', 'label' => 'گران‌ترین'],
                    ['id' => 'rating', 'label' => 'بیشترین امتیاز'],
                    ['id' => 'popular', 'label' => 'محبوب‌ترین'],
                ],
            ],
        ]);
    }
}
