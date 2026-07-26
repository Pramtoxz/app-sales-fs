<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::connection('pgsql')->table('prospek_daily_summary', function (Blueprint $table) {
            $table->date('tanggal')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql')->table('prospek_daily_summary', function (Blueprint $table) {
            $table->date('tanggal')->nullable(false)->change();
        });
    }
};
