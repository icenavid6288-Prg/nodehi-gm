<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('type', 20)->default('PERCENT'); // PERCENT, FIXED
            $table->bigInteger('value');
            $table->bigInteger('min_order_amount')->nullable();
            $table->bigInteger('max_discount_amount')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 50)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name', 100);
            $table->string('phone', 20)->index();
            $table->string('province', 50);
            $table->string('city', 50);
            $table->text('address');
            $table->string('postal_code', 20);
            $table->bigInteger('subtotal');
            $table->bigInteger('discount')->default(0);
            $table->bigInteger('shipping_cost')->default(0);
            $table->bigInteger('total');
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 30)->default('PENDING'); // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
            $table->string('payment_status', 30)->default('PENDING'); // PENDING, PAID, FAILED, REFUNDED
            $table->string('payment_method', 30)->default('zarinpal');
            $table->string('tracking_code', 100)->nullable();
            $table->string('payment_ref_id', 100)->nullable();
            $table->text('payment_redirect_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name', 255);
            $table->string('product_slug', 255);
            $table->string('thumbnail', 255)->nullable();
            $table->bigInteger('price');
            $table->unsignedInteger('quantity')->default(1);
            $table->bigInteger('total');
            $table->string('color', 50)->nullable();
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_name', 100);
            $table->unsignedTinyInteger('rating')->default(5);
            $table->string('title', 150)->nullable();
            $table->text('comment');
            $table->string('status', 30)->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->boolean('is_verified_purchase')->default(false);
            $table->timestamps();

            $table->unique(['product_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('coupons');
    }
};
