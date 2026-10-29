<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'name_en',
        'slug',
        'sku',
        'category_id',
        'brand_id',
        'price',
        'compare_price',
        'stock',
        'images',
        'thumbnail',
        'short_description',
        'description',
        'specs',
        'features',
        'colors',
        'tags',
        'energy_grade',
        'warranty',
        'is_inverter',
        'has_installment',
        'is_ready_to_ship',
        'is_active',
        'views_count',
        'sales_count',
        'rating_cache',
        'reviews_count_cache',
    ];

    protected $casts = [
        'price' => 'integer',
        'compare_price' => 'integer',
        'stock' => 'integer',
        'images' => 'array',
        'specs' => 'array',
        'features' => 'array',
        'colors' => 'array',
        'tags' => 'array',
        'is_inverter' => 'boolean',
        'has_installment' => 'boolean',
        'is_ready_to_ship' => 'boolean',
        'is_active' => 'boolean',
        'views_count' => 'integer',
        'sales_count' => 'integer',
        'rating_cache' => 'float',
        'reviews_count_cache' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->where('status', 'APPROVED');
    }

    public function stockAlerts()
    {
        return $this->hasMany(StockAlert::class);
    }
}
