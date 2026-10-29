<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyInstallment extends Model
{
    protected $fillable = [
        'provider',
        'title',
        'months',
        'prepayment_percent',
        'interest_rate',
        'max_amount',
        'requirements',
        'is_active',
        'order',
    ];

    protected $casts = [
        'months' => 'integer',
        'prepayment_percent' => 'integer',
        'interest_rate' => 'float',
        'max_amount' => 'integer',
        'requirements' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];
}
