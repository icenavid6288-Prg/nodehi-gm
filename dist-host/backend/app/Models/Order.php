<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'customer_name',
        'phone',
        'province',
        'city',
        'address',
        'postal_code',
        'subtotal',
        'discount',
        'shipping_cost',
        'total',
        'coupon_id',
        'status', // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
        'payment_status', // PENDING, PAID, FAILED, REFUNDED
        'payment_method', // zarinpal, snappay, cod, card_to_card
        'tracking_code',
        'payment_ref_id',
        'payment_redirect_url',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'discount' => 'integer',
        'shipping_cost' => 'integer',
        'total' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
