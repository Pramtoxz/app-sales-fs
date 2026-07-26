<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::connection('pgsql')->create('prospek_daily_summary', function (Blueprint $table) {
            $table->date('tanggal');
            $table->string('kd_dealer', 20);
            $table->string('id_flp', 30)->nullable();
            $table->integer('jml_prospek')->default(0);
            $table->integer('jml_deal')->default(0);
            $table->timestamps();

            $table->unique(['tanggal', 'kd_dealer', 'id_flp']);
            $table->index(['kd_dealer', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('prospek_daily_summary');
    }
};
