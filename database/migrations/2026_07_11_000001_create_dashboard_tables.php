<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('pgsql')->create('dashboard_widget_types', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('label', 100);
            $table->string('component', 100);
            $table->string('icon', 50)->nullable();
            $table->timestamps();
        });

        Schema::connection('pgsql')->create('dashboard_data_sources', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('label', 100);
            $table->string('endpoint', 255);
            $table->text('description')->nullable();
            $table->json('default_config')->nullable();
            $table->timestamps();
        });

        Schema::connection('pgsql')->create('dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreignId('widget_type_id')->constrained('dashboard_widget_types');
            $table->foreignId('data_source_id')->constrained('dashboard_data_sources');
            $table->string('title', 255);
            $table->json('config')->nullable();
            $table->integer('pos_x')->default(0);
            $table->integer('pos_y')->default(0);
            $table->integer('width')->default(6);
            $table->integer('height')->default(4);
            $table->boolean('visible')->default(true);
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::connection('pgsql')->create('dashboard_templates', function (Blueprint $table) {
            $table->id();
            $table->string('role', 20);
            $table->foreignId('widget_type_id')->constrained('dashboard_widget_types');
            $table->foreignId('data_source_id')->constrained('dashboard_data_sources');
            $table->string('title', 255);
            $table->json('config')->nullable();
            $table->integer('pos_x')->default(0);
            $table->integer('pos_y')->default(0);
            $table->integer('width')->default(6);
            $table->integer('height')->default(4);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('role');
        });

        $this->seedWidgetTypes();
        $this->seedDataSources();
        $this->seedTemplates();
    }

    private function seedWidgetTypes(): void
    {
        $now = now();
        $types = [
            ['key' => 'stat_card', 'label' => 'Kartu Stat', 'component' => 'StatCard', 'icon' => 'Hash', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'bar_chart', 'label' => 'Grafik Bar', 'component' => 'BarChartWidget', 'icon' => 'BarChart3', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pie_chart', 'label' => 'Grafik Pie', 'component' => 'PieChartWidget', 'icon' => 'PieChart', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'line_chart', 'label' => 'Grafik Line', 'component' => 'LineChartWidget', 'icon' => 'TrendingUp', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'leaderboard', 'label' => 'Leaderboard', 'component' => 'LeaderboardWidget', 'icon' => 'Trophy', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'progress_bar', 'label' => 'Progress Bar', 'component' => 'ProgressWidget', 'icon' => 'Percent', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'table', 'label' => 'Tabel Data', 'component' => 'TableWidget', 'icon' => 'Table', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::connection('pgsql')->table('dashboard_widget_types')->insert($types);
    }

    private function seedDataSources(): void
    {
        $now = now();
        $sources = [
            [
                'key' => 'summary_cards',
                'label' => 'Ringkasan (Cards)',
                'endpoint' => '/dashboard/data/summary',
                'description' => 'Kartu ringkasan: total FLP, target, terjual, prospek',
                'default_config' => json_encode(['kode_dealer' => null]),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'flp_performance',
                'label' => 'Performa FLP',
                'endpoint' => '/dashboard/data/flp-performance',
                'description' => 'Perbandingan target vs terjual per FLP',
                'default_config' => json_encode(['kode_dealer' => null, 'bulan_tahun' => null, 'limit' => 10]),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'target_vs_actual',
                'label' => 'Target vs Actual Dealer',
                'endpoint' => '/dashboard/data/target-vs-actual',
                'description' => 'Perbandingan target dan penjualan aktual per dealer',
                'default_config' => json_encode(['bulan_tahun' => null]),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'prospek_summary',
                'label' => 'Ringkasan Prospek',
                'endpoint' => '/dashboard/data/prospek',
                'description' => 'Jumlah prospek dan deal bulan ini',
                'default_config' => json_encode(['kode_dealer' => null, 'bulan_tahun' => null]),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'stock_summary',
                'label' => 'Stock Unit',
                'endpoint' => '/dashboard/data/stock',
                'description' => 'Ringkasan stock unit per tipe',
                'default_config' => json_encode(['kode_dealer' => null]),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'indent_summary',
                'label' => 'Indent',
                'endpoint' => '/dashboard/data/indent',
                'description' => 'Ringkasan indent per tipe',
                'default_config' => json_encode(['kode_dealer' => null]),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'dealer_list',
                'label' => 'Daftar Dealer',
                'endpoint' => '/dashboard/data/dealers',
                'description' => 'Daftar dealer dengan jumlah FLP',
                'default_config' => json_encode(['limit' => 10]),
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        DB::connection('pgsql')->table('dashboard_data_sources')->insert($sources);
    }

    private function seedTemplates(): void
    {
        $now = now();

        $statCard = 1; $barChart = 2; $pieChart = 3; $lineChart = 4; $leaderboard = 5; $progressBar = 6; $tableType = 7;

        $summaryCards = 1; $flpPerf = 2; $targetActual = 3; $prospek = 4; $stock = 5; $indent = 6; $dealerList = 7;

        $templates = [
            // IT
            ['role' => 'IT', 'widget_type_id' => $statCard, 'data_source_id' => $summaryCards, 'title' => 'Ringkasan', 'config' => json_encode(['kode_dealer' => null]), 'pos_x' => 0, 'pos_y' => 0, 'width' => 12, 'height' => 3, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'IT', 'widget_type_id' => $barChart, 'data_source_id' => $targetActual, 'title' => 'Target vs Actual', 'config' => json_encode(['bulan_tahun' => null, 'show_legend' => true, 'show_label' => true, 'colors' => ['#3b82f6', '#22c55e']]), 'pos_x' => 0, 'pos_y' => 3, 'width' => 8, 'height' => 5, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'IT', 'widget_type_id' => $leaderboard, 'data_source_id' => $flpPerf, 'title' => 'Top FLP', 'config' => json_encode(['kode_dealer' => null, 'limit' => 10, 'show_legend' => false, 'show_label' => false]), 'pos_x' => 8, 'pos_y' => 3, 'width' => 4, 'height' => 5, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],

            // MD
            ['role' => 'MD', 'widget_type_id' => $statCard, 'data_source_id' => $summaryCards, 'title' => 'Ringkasan', 'config' => json_encode(['kode_dealer' => null]), 'pos_x' => 0, 'pos_y' => 0, 'width' => 12, 'height' => 3, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'MD', 'widget_type_id' => $pieChart, 'data_source_id' => $flpPerf, 'title' => 'Performa FLP', 'config' => json_encode(['kode_dealer' => null, 'limit' => 10, 'show_legend' => true, 'show_label' => true, 'colors' => ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']]), 'pos_x' => 0, 'pos_y' => 3, 'width' => 6, 'height' => 5, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'MD', 'widget_type_id' => $tableType, 'data_source_id' => $stock, 'title' => 'Stock Unit', 'config' => json_encode(['kode_dealer' => null, 'limit' => 10, 'show_legend' => false, 'show_label' => false]), 'pos_x' => 6, 'pos_y' => 3, 'width' => 6, 'height' => 5, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],

            // KACAB
            ['role' => 'KACAB', 'widget_type_id' => $statCard, 'data_source_id' => $summaryCards, 'title' => 'Ringkasan Dealer', 'config' => json_encode(['kode_dealer' => null]), 'pos_x' => 0, 'pos_y' => 0, 'width' => 12, 'height' => 3, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'KACAB', 'widget_type_id' => $barChart, 'data_source_id' => $flpPerf, 'title' => 'Performa Sales', 'config' => json_encode(['kode_dealer' => null, 'limit' => 10, 'show_legend' => true, 'show_label' => true, 'colors' => ['#3b82f6', '#22c55e']]), 'pos_x' => 0, 'pos_y' => 3, 'width' => 8, 'height' => 5, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'KACAB', 'widget_type_id' => $tableType, 'data_source_id' => $indent, 'title' => 'Indent Aktif', 'config' => json_encode(['kode_dealer' => null, 'limit' => 10, 'show_legend' => false, 'show_label' => false]), 'pos_x' => 8, 'pos_y' => 3, 'width' => 4, 'height' => 5, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::connection('pgsql')->table('dashboard_templates')->insert($templates);
    }

    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('dashboard_templates');
        Schema::connection('pgsql')->dropIfExists('dashboard_widgets');
        Schema::connection('pgsql')->dropIfExists('dashboard_data_sources');
        Schema::connection('pgsql')->dropIfExists('dashboard_widget_types');
    }
};
