<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyStep extends Model
{
    protected $fillable = [
        'step_number',
        'title',
        'description',
        'icon',
    ];

    protected $casts = [
        'step_number' => 'integer',
    ];
}
