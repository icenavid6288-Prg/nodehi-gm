<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FaqCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'icon',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function faqs()
    {
        return $this->hasMany(Faq::class, 'category_id')->orderBy('order');
    }
}
