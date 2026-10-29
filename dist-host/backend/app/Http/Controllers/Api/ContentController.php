<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\FaqCategory;
use App\Models\LegalPage;
use App\Models\LoyaltyInstallment;
use App\Models\LoyaltyStep;
use App\Models\LoyaltyTier;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function articles(Request $request): JsonResponse
    {
        $query = Article::with('category')->where('is_published', true);

        if ($categorySlug = $request->query('category')) {
            $cat = ArticleCategory::where('slug', $categorySlug)->first();
            if ($cat) {
                $query->where('category_id', $cat->id);
            }
        }

        if ($limit = $request->query('limit')) {
            $query->take((int) $limit);
        }

        $articles = $query->orderBy('created_at', 'desc')->get();
        $categories = ArticleCategory::withCount('articles')->get();

        return response()->json([
            'ok' => true,
            'articles' => $articles,
            'categories' => $categories,
        ]);
    }

    public function articleBySlug(string $slug): JsonResponse
    {
        $article = Article::with('category')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        if (!$article) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'not_found', 'message' => 'مقاله یافت نشد.'],
            ], 404);
        }

        $article->increment('views_count');

        // Related articles
        $relatedArticles = [];
        if (!empty($article->related_slugs)) {
            $relatedArticles = Article::whereIn('slug', $article->related_slugs)->get();
        }

        // Related products
        $relatedProducts = [];
        if (!empty($article->related_product_slugs)) {
            $relatedProducts = Product::whereIn('slug', $article->related_product_slugs)->get();
        }

        return response()->json([
            'ok' => true,
            'article' => $article,
            'relatedArticles' => $relatedArticles,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function faqs(): JsonResponse
    {
        $categories = FaqCategory::with('faqs')
            ->orderBy('order')
            ->get();

        return response()->json([
            'ok' => true,
            'categories' => $categories,
        ]);
    }

    public function legal(string $slug): JsonResponse
    {
        $page = LegalPage::where('slug', $slug)->first();

        if (!$page) {
            return response()->json([
                'ok' => false,
                'error' => ['code' => 'not_found', 'message' => 'صفحه حقوقی یافت نشد.'],
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'page' => $page,
        ]);
    }

    public function loyalty(): JsonResponse
    {
        $tiers = LoyaltyTier::orderBy('min_points')->get();
        $installments = LoyaltyInstallment::where('is_active', true)->orderBy('order')->get();
        $steps = LoyaltyStep::orderBy('step_number')->get();

        return response()->json([
            'ok' => true,
            'tiers' => $tiers,
            'installments' => $installments,
            'steps' => $steps,
        ]);
    }
}
