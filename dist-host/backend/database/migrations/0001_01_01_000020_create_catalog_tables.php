<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('name_fa', 100);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable();
            $table->string('image', 255)->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('name_fa', 100);
            $table->string('slug', 100)->unique();
            $table->string('logo', 255)->nullable();
            $table->string('country', 100)->nullable();
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('name_en', 255)->nullable();
            $table->string('slug', 255)->unique();
            $table->string('sku', 100)->nullable()->unique();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('price');
            $table->bigInteger('compare_price')->nullable();
            $table->integer('stock')->default(0);
            $table->json('images')->nullable();
            $table->string('thumbnail', 255)->nullable();
            $table->text('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->json('specs')->nullable();
            $table->json('features')->nullable();
            $table->json('colors')->nullable();
            $table->json('tags')->nullable();
            $table->string('energy_grade', 20)->nullable();
            $table->string('warranty', 255)->nullable();
            $table->boolean('is_inverter')->default(false);
            $table->boolean('has_installment')->default(false);
            $table->boolean('is_ready_to_ship')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('sales_count')->default(0);
            $table->decimal('rating_cache', 3, 1)->default(5.0);
            $table->unsignedInteger('reviews_count_cache')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('categories');
    }
};
