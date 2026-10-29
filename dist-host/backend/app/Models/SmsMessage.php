<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsMessage extends Model
{
    protected $fillable = [
        'phone',
        'message',
        'gateway',
        'status', // SENT, FAILED, DELIVERED
        'reference_id',
        'error_message',
    ];
}
