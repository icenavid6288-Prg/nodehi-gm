<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyTier extends Model
{
    protected $fillable = [
        'name',
        'min_points',
        'cashback_percent',
        'free_shipping',
        'exclusive_discounts',
        'priority_support',
        'color',
    ];

    protected $casts = [
        'min_points' => 'integer',
        'cashback_percent' => 'integer',
        'free_shipping' => 'boolean',
        'exclusive_discounts' => 'boolean',
        'priority_support' => 'boolean',
    ];
}
