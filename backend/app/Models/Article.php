<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'category_id',
        'author',
        'read_time',
        'date',
        'excerpt',
        'content',
        'cover_image',
        'tags',
        'related_slugs',
        'related_product_slugs',
        'is_published',
        'views_count',
    ];

    protected $casts = [
        'tags' => 'array',
        'related_slugs' => 'array',
        'related_product_slugs' => 'array',
        'is_published' => 'boolean',
        'views_count' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(ArticleCategory::class, 'category_id');
    }
}
