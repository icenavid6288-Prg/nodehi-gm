<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutomationEvent extends Model
{
    protected $fillable = [
        'event_name',
        'payload',
        'status', // PENDING, PROCESSED, FAILED
        'attempts',
        'error',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'attempts' => 'integer',
        'processed_at' => 'datetime',
    ];
}
