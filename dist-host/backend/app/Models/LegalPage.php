<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LegalPage extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'effective_date',
        'sections',
        'contacts',
    ];

    protected $casts = [
        'sections' => 'array',
        'contacts' => 'array',
    ];
}
