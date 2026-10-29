<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $fillable = [
        'name',
        'name_fa',
        'slug',
        'logo',
        'country',
        'description',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
