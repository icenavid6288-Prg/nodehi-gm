<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->foreignId('category_id')->constrained('article_categories')->cascadeOnDelete();
            $table->string('author', 100)->default('تحریریه نودهی');
            $table->string('read_time', 50)->default('۵ دقیقه');
            $table->string('date', 50)->nullable();
            $table->text('excerpt');
            $table->longText('content');
            $table->string('cover_image', 255)->nullable();
            $table->json('tags')->nullable();
            $table->json('related_slugs')->nullable();
            $table->json('related_product_slugs')->nullable();
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();
        });

        Schema::create('faq_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('icon', 100)->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('faq_categories')->cascadeOnDelete();
            $table->text('question');
            $table->longText('answer');
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('legal_pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('title', 255);
            $table->string('effective_date', 50)->nullable();
            $table->json('sections')->nullable();
            $table->json('contacts')->nullable();
            $table->timestamps();
        });

        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->integer('min_points')->default(0);
            $table->integer('cashback_percent')->default(1);
            $table->boolean('free_shipping')->default(false);
            $table->boolean('exclusive_discounts')->default(false);
            $table->boolean('priority_support')->default(false);
            $table->string('color', 50)->default('#12B5A5');
            $table->timestamps();
        });

        Schema::create('loyalty_installments', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 100);
            $table->string('title', 150);
            $table->integer('months')->default(4);
            $table->integer('prepayment_percent')->default(25);
            $table->decimal('interest_rate', 4, 1)->default(0);
            $table->bigInteger('max_amount')->default(50000000);
            $table->json('requirements')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('loyalty_steps', function (Blueprint $table) {
            $table->id();
            $table->integer('step_number')->default(1);
            $table->string('title', 150);
            $table->text('description');
            $table->string('icon', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_steps');
        Schema::dropIfExists('loyalty_installments');
        Schema::dropIfExists('loyalty_tiers');
        Schema::dropIfExists('legal_pages');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('faq_categories');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('article_categories');
    }
};
