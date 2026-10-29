<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'brand'])->where('is_active', true);

        // Keyword search (name, name_en, sku, description)
        if ($q = $request->query('q')) {
            $qClean = trim(str_replace(['ي', 'ك'], ['ی', 'ک'], $q));
            $query->where(function ($sub) use ($qClean) {
                $sub->where('name', 'like', "%{$qClean}%")
                    ->orWhere('name_en', 'like', "%{$qClean}%")
                    ->orWhere('sku', 'like', "%{$qClean}%")
                    ->orWhere('short_description', 'like', "%{$qClean}%");
            });
        }

        // Category filter (slugs or IDs, comma separated)
        if ($cats = $request->query('category')) {
            $catList = is_array($cats) ? $cats : explode(',', $cats);
            $catIds = Category::whereIn('slug', $catList)->orWhereIn('id', $catList)->pluck('id');
            $query->whereIn('category_id', $catIds);
        }

        // Brand filter (slugs or IDs, comma separated)
        if ($brands = $request->query('brand')) {
            $brandList = is_array($brands) ? $brands : explode(',', $brands);
            $brandIds = Brand::whereIn('slug', $brandList)->orWhereIn('id', $brandList)->pluck('id');
            $query->whereIn('brand_id', $brandIds);
        }

        // Price range
        if ($minPrice = $request->query('minPrice')) {
            $query->where('price', '>=', (int) $minPrice);
        }
        if ($maxPrice = $request->query('maxPrice')) {
            $query->where('price', '<=', (int) $maxPrice);
        }

        // Energy grade
        if ($energy = $request->query('energy')) {
            $energyList = is_array($energy) ? $energy : explode(',', $energy);
            $query->whereIn('energy_grade', $energyList);
        }

        // Booleans
        if ($request->boolean('inverter') || $request->query('inverter') === '1') {
            $query->where('is_inverter', true);
        }
        if ($request->boolean('installment') || $request->query('installment') === '1') {
            $query->where('has_installment', true);
        }
        if ($request->boolean('ready') || $request->query('ready') === '1') {
            $query->where('is_ready_to_ship', true);
        }
        if ($request->boolean('instock') || $request->query('instock') === '1') {
            $query->where('stock', '>', 0);
        }
        if ($request->boolean('discounted') || $request->query('discounted') === '1') {
            $query->whereNotNull('compare_price')->whereColumn('compare_price', '>', 'price');
        }

        // Sorting
        $sort = $request->query('sort', 'newest');
        switch ($sort) {
            case 'price-asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price-desc':
                $query->orderBy('price', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating_cache', 'desc');
                break;
            case 'popular':
                $query->orderBy('sales_count', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = min((int) $request->query('perPage', 12), 48);
        $products = $query->paginate($perPage);

        return response()->json([
            'ok' => true,
            'products' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'page' => $products->currentPage(),
                'perPage' => $products->perPage(),
                'lastPage' => $products->lastPage(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::with(['category', 'brand'])
            ->where('slug', $slug)
            ->first();

        if (!$product) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'not_found', 'message' => 'محصول مورد نظر یافت نشد.'],
            ], 404);
        }

        // Increment view count
        $product->increment('views_count');

        // Related products in the same category
        $related = Product::with(['category', 'brand'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->take(6)
            ->get();

        // Approved reviews
        $reviews = Review::where('product_id', $product->id)
            ->where('status', 'APPROVED')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'ok' => true,
            'product' => $product,
            'related' => $related,
            'reviews' => $reviews,
        ]);
    }

    public function reviews(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $reviews = Review::where('product_id', $product->id)
            ->where('status', 'APPROVED')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'ok' => true,
            'reviews' => $reviews->items(),
            'total' => $reviews->total(),
        ]);
    }

    public function submitReview(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'author_name' => 'required|string|max:100',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:5|max:1000',
            'title' => 'nullable|string|max:150',
        ]);

        $product = Product::where('slug', $slug)->firstOrFail();
        $user = auth()->user();

        if ($user) {
            $already = Review::where('product_id', $product->id)->where('user_id', $user->id)->exists();
            if ($already) {
                return response()->json([
                    'ok' => false,
                    'error' => ['code' => 'already_reviewed', 'message' => 'شما قبلاً برای این محصول دیدگاه ثبت کرده‌اید.'],
                ], 409);
            }
        }

        $review = Review::create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'author_name' => $request->author_name,
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
            'status' => 'PENDING',
            'is_verified_purchase' => false,
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'دیدگاه شما با موفقیت ثبت شد و پس از بررسی منتشر خواهد شد.',
            'review' => $review,
        ], 201);
    }
}
