<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGateway extends Model
{
    protected $fillable = [
        'name',
        'title',
        'driver',
        'is_active',
        'config',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
        'order' => 'integer',
    ];
}
