<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->longText('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->string('title', 100);
            $table->string('driver', 50);
            $table->boolean('is_active')->default(true);
            $table->json('config')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('automation_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_name', 100);
            $table->json('payload')->nullable();
            $table->string('status', 30)->default('PENDING'); // PENDING, PROCESSED, FAILED
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 100);
            $table->string('entity_type', 100)->nullable();
            $table->string('entity_id', 100)->nullable();
            $table->json('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('automation_events');
        Schema::dropIfExists('payment_gateways');
        Schema::dropIfExists('settings');
    }
};
