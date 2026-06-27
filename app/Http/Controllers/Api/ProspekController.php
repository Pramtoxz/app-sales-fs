<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuestBook;
use App\Http\Requests\StoreProspekRequest;
use App\Http\Requests\UpdateProspekRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProspekController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $perPage = $request->query('per_page', 15);
        $bulan = $request->query('bulan');
        $tahun = $request->query('tahun');
        $status = $request->query('status');

        $query = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->select(
                'guestbook.IDGuestBook',
                'guestbook.Tanggal',
                'guestbook.NamaCustomer',
                'guestbook.NoHp',
                'guestbook.KodeType',
                'guestbook.KodeWarna',
                'guestbook.DeskripsiWarnaMotor',
                'setupjenispembayaran.JenisPembayaran as rencana_pembayaran',
                'SetupTipeCustomer.tipe_customer',
                'guestbook.AlamatProspect',
                'guestbook.AlamatKantorProspect',
                'master_source_leads.deskripsi as source',
                'guestbook.Keterangan',
                'guestbook.Status_guestbook',
                'guestbook.created_at'
            )
            ->leftJoin('H1_DOS.setupjenispembayaran', 'setupjenispembayaran.IDJenisPembayaran', '=', 'guestbook.RencanaPembayaran')
            ->leftJoin('Master_Schema.SetupTipeCustomer', 'SetupTipeCustomer.id_tipe', '=', 'guestbook.TipeCustomer')
            ->leftJoin('Master_Schema.master_source_leads', 'master_source_leads.id', '=', 'guestbook.Source')
            ->where('guestbook.id_flp', $flp->id_flp)
            ->orderBy('guestbook.Tanggal', 'desc');

        if ($bulan) {
            $query->whereRaw('EXTRACT(MONTH FROM "Tanggal") = ?', [$bulan]);
        }

        if ($tahun) {
            $query->whereRaw('EXTRACT(YEAR FROM "Tanggal") = ?', [$tahun]);
        }

        if ($status) {
            $query->where('guestbook.Status_guestbook', $status);
        }

        $prospek = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $prospek->items(),
            'meta' => [
                'current_page' => $prospek->currentPage(),
                'last_page' => $prospek->lastPage(),
                'per_page' => $prospek->perPage(),
                'total' => $prospek->total(),
            ],
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $id = $request->query('id');

        if (!$id) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter id diperlukan',
            ], 422);
        }

        $prospek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->select(
                'guestbook.IDGuestBook',
                'guestbook.Tanggal',
                'guestbook.NamaCustomer',
                'guestbook.NoHp',
                'guestbook.KodeType',
                'guestbook.KodeWarna',
                'guestbook.DeskripsiWarnaMotor',
                'setupjenispembayaran.JenisPembayaran as rencana_pembayaran',
                'SetupTipeCustomer.tipe_customer',
                'guestbook.AlamatProspect',
                'guestbook.AlamatKantorProspect',
                'master_source_leads.deskripsi as source',
                'guestbook.Keterangan',
                'guestbook.Status_guestbook',
                'guestbook.created_at',
                'guestbook.updated_at'
            )
            ->leftJoin('H1_DOS.setupjenispembayaran', 'setupjenispembayaran.IDJenisPembayaran', '=', 'guestbook.RencanaPembayaran')
            ->leftJoin('Master_Schema.SetupTipeCustomer', 'SetupTipeCustomer.id_tipe', '=', 'guestbook.TipeCustomer')
            ->leftJoin('Master_Schema.master_source_leads', 'master_source_leads.id', '=', 'guestbook.Source')
            ->where('guestbook.IDGuestBook', $id)
            ->where('guestbook.id_flp', $flp->id_flp)
            ->first();

        if (!$prospek) {
            return response()->json([
                'success' => false,
                'message' => 'Prospek tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $prospek,
        ]);
    }

    public function cekLeads(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json(['success' => false, 'message' => 'User tidak terdaftar sebagai FLP'], 403);
        }

        $noHp = $request->query('no_hp');

        if (!$noHp || strlen($noHp) < 8 || !in_array(substr($noHp, 0, 2), ['08', '07'])) {
            return response()->json(['success' => false, 'message' => 'Format nomor HP tidak valid (min 8 digit, awali 07/08)'], 422);
        }

        $lead = DB::connection('pgsql_sales')
            ->table('H1_HC3.FUProspek')
            ->join('H1_DOS.guestbook', 'guestbook.IDGuestBook', '=', 'FUProspek.fk_prospek')
            ->join('HC3.master_kons_ve', 'guestbook.IDGuestBook', '=', 'master_kons_ve.id_guestbook')
            ->leftJoin('H1_DOS.spk', 'spk.IDGuestBook', '=', 'guestbook.IDGuestBook')
            ->leftJoin('Master_Schema.master_source_leads', 'master_source_leads.id', '=', 'guestbook.Source')
            ->where('guestbook.fk_dealer', $flp->kode_dealer)
            ->whereNull('spk.IDGuestBook')
            ->where('master_kons_ve.no_hp', $noHp)
            ->whereIn('master_kons_ve.stage_id', ['5', '6', '7', '8'])
            ->orderBy('master_kons_ve.created_at', 'DESC')
            ->select(
                'master_kons_ve.nama',
                'guestbook.NoHp as no_hp',
                'master_kons_ve.id_guestbook',
                'master_source_leads.deskripsi as deskripsi_source',
                'master_kons_ve.id_leads'
            )
            ->first();

        DB::connection('pgsql_sales')->table('HC3.log_search_guestbook')->insert([
            'id_flp' => $flp->id_flp,
            'no_hp' => $noHp,
            'status_ditemukan' => $lead ? 't' : 'f',
            'created_at' => date('Y-m-d H:i:s'),
            'id_guestbook' => $lead->id_guestbook ?? null,
            'fk_dealer' => $flp->kode_dealer,
        ]);

        if (!$lead) {
            return response()->json([
                'success' => true,
                'data' => ['result' => false],
            ]);
        }

        $riwayatFu = DB::connection('pgsql_sales')
            ->table('H1_HC3.FUProspek')
            ->leftJoin('Master_Schema.master_fu_status', 'master_fu_status.id', '=', 'FUProspek.jenis_fu_ve')
            ->leftJoin('public.flp', 'flp.id_flp', '=', 'FUProspek.id_flp')
            ->where('FUProspek.fk_prospek', $lead->id_guestbook)
            ->where('FUProspek.is_ve', 't')
            ->select(
                'FUProspek.updated_at as tanggal_fu',
                'master_fu_status.media',
                'master_fu_status.deskripsi',
                'flp.nama as nama_flp'
            )
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'result' => true,
                'lead' => [
                    'id_leads' => $lead->id_leads,
                    'id_guestbook' => $lead->id_guestbook,
                    'nama' => $lead->nama,
                    'no_hp' => $lead->no_hp,
                    'sumber_data' => $lead->deskripsi_source,
                ],
                'riwayat_fu' => $riwayatFu ? [
                    'tanggal_fu' => $riwayatFu->tanggal_fu,
                    'media' => $riwayatFu->media,
                    'deskripsi' => $riwayatFu->deskripsi,
                    'nama_flp' => $riwayatFu->nama_flp,
                ] : null,
            ],
        ]);
    }

    public function generateLeads(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json(['success' => false, 'message' => 'User tidak terdaftar sebagai FLP'], 403);
        }

        $idLeads = $request->input('id_leads');

        if (!$idLeads) {
            return response()->json(['success' => false, 'message' => 'Parameter id_leads diperlukan'], 422);
        }

        $tglNextFu = date('Y-m-d', strtotime('+1 day'));
        $idLeads = $this->duplicateLeadsIfExpired((string) $idLeads);

        try {
            DB::connection('pgsql_sales')->beginTransaction();

            $dataLeads = DB::connection('pgsql_sales')
                ->table('HC3.master_kons_ve')
                ->where('id_leads', $idLeads)
                ->select('id_guestbook', 'nama', 'no_hp', 'no_telp', 'email')
                ->first();

            if (!$dataLeads) {
                throw new \Exception('Tidak Ada Data Leads');
            }

            $dataFuProspek = DB::connection('pgsql_sales')
                ->table('H1_HC3.FUProspek')
                ->where('fk_prospek', $dataLeads->id_guestbook)
                ->select('batas_fu_sla', 'ontime_sla2_ve', 'id_flp_own')
                ->first();

            $waktuAwal = strtotime(date('Y-m-d H:i:s'));
            $waktuAkhir = $dataFuProspek ? strtotime($dataFuProspek->batas_fu_sla) : 0;
            $sla = $waktuAkhir >= $waktuAwal ? '1' : '0';

            DB::connection('pgsql_sales')->table('H1_HC3.FUProspek')
                ->where('fk_prospek', $dataLeads->id_guestbook)
                ->update([
                    'hasil_fu' => 7,
                    'hasil_fu_ve' => 1,
                    'keterangan_hasil_ve' => 0,
                    'jenis_fu_ve' => 8,
                    'is_ve' => 't',
                    'from_guestbook_fu' => 't',
                    'tgl_next_fu' => $tglNextFu,
                    'ontime_sla2_ve' => $dataFuProspek->ontime_sla2_ve ?? $sla,
                    'id_flp' => $flp->id_flp,
                    'keterangan_lainnya_ve' => 'Data Generate Guestbook',
                ]);

            $idFuDetil = DB::connection('pgsql_sales')->table('H1_HC3.FUProspek_Detil')->insertGetId([
                'fk_prospek' => $dataLeads->id_guestbook,
                'fk_dealer' => $flp->kode_dealer,
                'jenis_fu' => 1,
                'tgl_fu' => date('Y-m-d'),
                'status_fu' => 3,
                'hasil_fu' => 7,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
                'tgl_next_fu' => $tglNextFu,
                'jenis_fu_ve' => 8,
                'status_fu_ve' => 3,
                'hasil_fu_ve' => 1,
            ]);

            DB::connection('pgsql_sales')->table('H1_DOS.guestbook')
                ->where('IDGuestBook', $dataLeads->id_guestbook)
                ->update([
                    'Tanggal' => date('Y-m-d'),
                    'Status_guestbook' => 't',
                    'id_flp' => $flp->id_flp,
                    'NamaKariawan' => $flp->nama,
                ]);

            $stage8Count = DB::connection('pgsql_sales')
                ->table('Master_Schema.tbl_ve_log')
                ->where('lead_id', $idLeads)
                ->where('stage_id', '8')
                ->count();

            if ($stage8Count === 0) {
                DB::connection('pgsql_sales')->table('Master_Schema.tbl_ve_log')->insert([
                    'lead_id' => $idLeads,
                    'stage_id' => 8,
                    'nama' => $dataLeads->nama,
                    'no_hp' => $dataLeads->no_hp,
                    'no_hp2' => $dataLeads->no_telp,
                    'email' => $dataLeads->email,
                    'kd_md' => 'C10',
                    'assigned_dealer' => $flp->kode_dealer,
                    'id_follow_up' => $idFuDetil,
                    'tgl_follow_up' => date('Y-m-d H:i:s'),
                    'kd_status_kontak_fu' => 8,
                    'kd_hasil_status_fu' => 1,
                    'tgl_next_fu' => $tglNextFu,
                    'status_prospek' => 3,
                    'keterangan_next_fu' => null,
                    'kd_tipe_motor_prospek' => null,
                    'kd_warna_prospek' => null,
                    'ontime_sla_2' => $sla,
                    'pic_fu_d' => $flp->id_flp,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

                DB::connection('pgsql_sales')->table('HC3.master_kons_ve')
                    ->where('id_leads', $idLeads)
                    ->update(['stage_id' => 8, 'close_fu' => 't']);
            }

            DB::connection('pgsql_sales')->table('HC3.log_generate_guestbook')->insert([
                'id_prospek' => $dataLeads->id_guestbook,
                'id_flp_generate' => $flp->id_flp,
                'id_flp_own' => $dataFuProspek->id_flp_own ?? null,
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            DB::connection('pgsql_sales')->commit();

            return response()->json([
                'success' => true,
                'message' => 'Data Buku Tamu Berhasil Digenerate, Silahkan Gunakan Pada SPK',
                'data' => ['id_guestbook' => $dataLeads->id_guestbook],
            ]);
        } catch (\Exception $e) {
            DB::connection('pgsql_sales')->rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(StoreProspekRequest $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $validated = $request->validated();

        $year = date('y');
        $month = date('m');
        $dealer = $flp->kode_dealer;

        $lastId = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->where('IDGuestBook', 'like', "C10/{$dealer}/{$year}/{$month}/%")
            ->orderBy('IDGuestBook', 'desc')
            ->value('IDGuestBook');

        if ($lastId) {
            $parts = explode('/', $lastId);
            $lastNumber = (int)end($parts);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        $idGuestBook = "C10/{$dealer}/{$year}/{$month}/PSP/{$validated['source']}/{$newNumber}";

        $prospek = GuestBook::create([
            'IDGuestBook' => $idGuestBook,
            'Tanggal' => $validated['tanggal'],
            'NamaCustomer' => $validated['nama_customer'],
            'NoHp' => $validated['no_hp'],
            'KodeType' => $validated['kode_type'],
            'KodeWarna' => $validated['kode_warna'],
            'RencanaPembayaran' => $validated['rencana_pembayaran'],
            'TipeCustomer' => $validated['tipe_customer'],
            'AlamatProspect' => $validated['alamat_prospect'],
            'AlamatKantorProspect' => $validated['alamat_kantor_prospect'] ?? null,
            'Source' => $validated['source'],
            'Keterangan' => $validated['keterangan'] ?? null,
            'id_flp' => $flp->id_flp,
            'NamaKariawan' => $flp->nama,
            'fk_dealer' => $flp->kode_dealer,
            'Status_guestbook' => 'f',
            'created_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prospek berhasil dibuat',
            'data' => [
                'id' => $prospek->IDGuestBook,
            ],
        ], 201);
    }

    public function update(UpdateProspekRequest $request, string $id): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $prospek = GuestBook::where('IDGuestBook', $id)
            ->where('id_flp', $flp->id_flp)
            ->first();

        if (!$prospek) {
            return response()->json([
                'success' => false,
                'message' => 'Prospek tidak ditemukan',
            ], 404);
        }

        if ($prospek->Status_guestbook === 't') {
            return response()->json([
                'success' => false,
                'message' => 'Prospek yang sudah approved tidak dapat diubah',
            ], 403);
        }

        $validated = $request->validated();

        $updateData = [];
        if (isset($validated['tanggal'])) $updateData['Tanggal'] = $validated['tanggal'];
        if (isset($validated['nama_customer'])) $updateData['NamaCustomer'] = $validated['nama_customer'];
        if (isset($validated['no_hp'])) $updateData['NoHp'] = $validated['no_hp'];
        if (isset($validated['kode_type'])) $updateData['KodeType'] = $validated['kode_type'];
        if (isset($validated['kode_warna'])) $updateData['KodeWarna'] = $validated['kode_warna'];
        if (isset($validated['rencana_pembayaran'])) $updateData['RencanaPembayaran'] = $validated['rencana_pembayaran'];
        if (isset($validated['tipe_customer'])) $updateData['TipeCustomer'] = $validated['tipe_customer'];
        if (isset($validated['alamat_prospect'])) $updateData['AlamatProspect'] = $validated['alamat_prospect'];
        if (isset($validated['alamat_kantor_prospect'])) $updateData['AlamatKantorProspect'] = $validated['alamat_kantor_prospect'];
        if (isset($validated['source'])) $updateData['Source'] = $validated['source'];
        if (isset($validated['keterangan'])) $updateData['Keterangan'] = $validated['keterangan'];

        $prospek->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Prospek berhasil diupdate',
        ]);
    }

    private function duplicateLeadsIfExpired(string $idLeads): string
    {
        $cekTanggal = DB::connection('pgsql_sales')
            ->table('HC3.master_kons_ve')
            ->leftJoin('HC3.crm_ve_log', 'crm_ve_log.id_leads', '=', 'master_kons_ve.id_leads')
            ->where('master_kons_ve.id_leads', $idLeads)
            ->whereRaw(
                '(EXTRACT(MONTH FROM master_kons_ve.created_at) != ? OR EXTRACT(YEAR FROM master_kons_ve.created_at) != ?)',
                [date('m'), date('Y')]
            )
            ->first();

        if (!$cekTanggal) {
            return $idLeads;
        }

        $newIdLeads = $this->generateNewIdLeads($idLeads);
        $now = date('Y-m-d H:i:s');
        $tanggalCustom = $this->generateTanggalCustom();
        $tanggalCustomFu = date('Y-m-d H:i:s', strtotime($tanggalCustom) + rand(5, 60) * 60);
        $tanggalCustomVe = date('Y-m-d H:i:s', strtotime($tanggalCustom) - rand(5, 60) * 60);
        $tanggalCustomFuSla = date('Y-m-d H:i:s', strtotime($tanggalCustomFu) + (2880 * 60));
        $tanggalCustomFuSla1 = date('Y-m-d H:i:s', strtotime($tanggalCustomVe) + (1440 * 60));
        $tanggalNextFu = date('Y-m-d H:i:s', strtotime($tanggalCustomFu . ' +7 days'));

        foreach (DB::connection('pgsql_sales')->table('HC3.master_kons_ve')->where('id_leads', $idLeads)->get() as $data) {
            $duplikat = (array) $data;
            unset($duplikat['id']);
            $duplikat['id_leads'] = $newIdLeads;
            $duplikat['created_at'] = $tanggalCustomVe;
            $duplikat['updated_at'] = $tanggalCustomVe;
            DB::connection('pgsql_sales')->table('HC3.master_kons_ve')->insert($duplikat);
        }

        foreach (DB::connection('pgsql_sales')->table('HC3.crm_ve_log')->where('id_leads', $idLeads)->get() as $log) {
            $logArray = (array) $log;
            unset($logArray['id']);
            $logArray['id_leads'] = $newIdLeads;
            $logArray['created_at'] = $tanggalCustomVe;
            $logArray['updated_at'] = $tanggalCustomVe;
            DB::connection('pgsql_sales')->table('HC3.crm_ve_log')->insert($logArray);
        }

        foreach (DB::connection('pgsql_sales')->table('HC3.crm_ve')->where('id_leads', $idLeads)->get() as $ve) {
            $veArray = (array) $ve;
            unset($veArray['id']);
            $veArray['id_leads'] = $newIdLeads;
            $veArray['created_at'] = $tanggalCustomVe;
            $veArray['updated_at'] = $tanggalCustomVe;
            $veArray['tgl_masuk_ve'] = $tanggalCustomVe;
            $veArray['tgl_assign_dealer'] = $tanggalCustomVe;
            $veArray['batas_waktu_sla1'] = $tanggalCustomFuSla1;
            DB::connection('pgsql_sales')->table('HC3.crm_ve')->insert($veArray);
        }

        $lastVelog = null;
        foreach (DB::connection('pgsql_sales')->table('Master_Schema.tbl_ve_log')->where('lead_id', $idLeads)->get() as $velog) {
            $velogArray = (array) $velog;
            unset($velogArray['id']);
            $velogArray['lead_id'] = $newIdLeads;

            if (in_array($velog->stage_id, ['1', '4', '5', '6'])) {
                $tanggal = $tanggalCustomVe;
                $fields = ['customer_action_date', 'tgl_assign'];
            } elseif (in_array($velog->stage_id, ['7', '8', '9'])) {
                $tanggal = $tanggalCustomFu;
                $fields = ['tgl_follow_up', 'tgl_next_fu'];
            } else {
                $tanggal = null;
                $fields = [];
            }

            if ($tanggal) {
                $velogArray['created_at'] = $tanggal;
                $velogArray['updated_at'] = $tanggal;
                foreach ($fields as $field) {
                    if (!is_null($velog->$field)) {
                        $velogArray[$field] = $tanggal;
                    }
                }
            }

            DB::connection('pgsql_sales')->table('Master_Schema.tbl_ve_log')->insert($velogArray);
            $lastVelog = $velog;
        }

        foreach (DB::connection('pgsql_sales')->table('H1_DOS.guestbook')->where('leads_id_ve', $idLeads)->get() as $guest) {
            $guestArray = (array) $guest;
            $oldIdGuestbook = $guestArray['IDGuestBook'] ?? '';
            $newIdGuestbook = $oldIdGuestbook;

            if (
                str_starts_with($oldIdGuestbook, 'VE/') ||
                str_starts_with($oldIdGuestbook, 'GB/') ||
                str_starts_with($oldIdGuestbook, 'C10/')
            ) {
                $newIdGuestbook = $this->generateNewIdGuestBook($oldIdGuestbook);
                $guestArray['IDGuestBook'] = $newIdGuestbook;
            }

            $guestArray['leads_id_ve'] = $newIdLeads;
            $guestArray['created_at'] = $tanggalCustom;
            $guestArray['updated_at'] = $now;
            DB::connection('pgsql_sales')->table('H1_DOS.guestbook')->insert($guestArray);

            foreach (DB::connection('pgsql_sales')->table('H1_HC3.FUProspek')->where('fk_prospek', $oldIdGuestbook)->get() as $fu) {
                $fuArray = (array) $fu;
                unset($fuArray['id']);
                $fuArray['fk_prospek'] = $newIdGuestbook;
                $fuArray['created_at'] = $tanggalCustomFu;
                $fuArray['updated_at'] = $tanggalNextFu;
                if ($lastVelog && !is_null($lastVelog->tgl_next_fu)) {
                    $fuArray['tgl_next_fu'] = $tanggalNextFu;
                }
                $fuArray['batas_fu_sla'] = $tanggalCustomFuSla;
                DB::connection('pgsql_sales')->table('H1_HC3.FUProspek')->insert($fuArray);
            }
        }

        return $newIdLeads;
    }

    private function generateNewIdLeads(string $oldIdLeads): string
    {
        $tahunSekarang = date('Y');
        $bulanSekarang = date('m');
        $tahun2Digit = date('y');

        if (str_starts_with($oldIdLeads, 'MD/')) {
            $prefix = "MD/{$tahunSekarang}/{$bulanSekarang}/";
            $records = DB::connection('pgsql_sales')
                ->table('HC3.master_kons_ve')
                ->where('id_leads', 'LIKE', $prefix . '%')
                ->get(['id_leads']);

            if ($records->isEmpty()) {
                return "MD/{$tahunSekarang}/{$bulanSekarang}/1";
            }

            $maxNourut = 0;
            foreach ($records as $record) {
                $parts = explode('/', $record->id_leads);
                $nourut = (int) end($parts);
                if ($nourut > $maxNourut) {
                    $maxNourut = $nourut;
                }
            }

            return "MD/{$tahunSekarang}/{$bulanSekarang}/" . ($maxNourut + 1);
        }

        if (str_starts_with($oldIdLeads, 'D/')) {
            $partsLama = explode('/', $oldIdLeads);
            $kode5digit = $partsLama[1] ?? '00000';
            $prefixD = "D/{$kode5digit}/{$tahun2Digit}/{$bulanSekarang}/";

            $records = DB::connection('pgsql_sales')
                ->table('HC3.master_kons_ve')
                ->where('id_leads', 'LIKE', $prefixD . '%')
                ->get(['id_leads']);

            $existingKodeUnik = [];
            $maxNourut = 0;

            foreach ($records as $record) {
                $p = explode('/', $record->id_leads);
                $nourut = isset($p[4]) ? (int) $p[4] : 0;
                if ($nourut > $maxNourut) {
                    $maxNourut = $nourut;
                }
                if (isset($p[5])) {
                    $existingKodeUnik[] = $p[5];
                }
            }

            $newNourut = $maxNourut + 1;

            do {
                $kodeUnik = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            } while (in_array($kodeUnik, $existingKodeUnik));

            return "D/{$kode5digit}/{$tahun2Digit}/{$bulanSekarang}/{$newNourut}/{$kodeUnik}";
        }

        return $oldIdLeads;
    }

    private function generateNewIdGuestBook(string $oldIdGuestBook): string
    {
        $tahun2Digit = date('y');
        $bulanSekarang = date('m');
        $tahunSekarang = date('Y');
        $parts = explode('/', $oldIdGuestBook);

        if (str_starts_with($oldIdGuestBook, 'VE/')) {
            $kode5digit = $parts[1] ?? '00000';
            $prefixGb = "VE/{$kode5digit}/{$tahun2Digit}/{$bulanSekarang}/";
            $records = DB::connection('pgsql_sales')
                ->table('H1_DOS.guestbook')
                ->where('IDGuestBook', 'LIKE', $prefixGb . '%')
                ->get(['IDGuestBook']);

            if ($records->isEmpty()) {
                return $prefixGb . '1';
            }

            $maxNourut = 0;
            foreach ($records as $record) {
                $p = explode('/', $record->IDGuestBook);
                $nourut = isset($p[4]) ? (int) $p[4] : 0;
                if ($nourut > $maxNourut) {
                    $maxNourut = $nourut;
                }
            }

            return $prefixGb . ($maxNourut + 1);
        }

        if (str_starts_with($oldIdGuestBook, 'GB/')) {
            $kode5digit = $parts[2] ?? '00000';
            $prefixGb = "GB/{$tahunSekarang}/{$kode5digit}/";
            $records = DB::connection('pgsql_sales')
                ->table('H1_DOS.guestbook')
                ->where('IDGuestBook', 'LIKE', $prefixGb . '%')
                ->get(['IDGuestBook']);

            if ($records->isEmpty()) {
                return $prefixGb . '1';
            }

            $maxNourut = 0;
            foreach ($records as $record) {
                $p = explode('/', $record->IDGuestBook);
                $nourut = isset($p[3]) ? (int) $p[3] : 0;
                if ($nourut > $maxNourut) {
                    $maxNourut = $nourut;
                }
            }

            return $prefixGb . ($maxNourut + 1);
        }

        if (str_starts_with($oldIdGuestBook, 'C10/')) {
            $kode5digit = $parts[1] ?? '00000';
            $kode3huruf = $parts[4] ?? 'PSP';
            $kode4digit = $parts[5] ?? '0000';
            $prefixGb = "C10/{$kode5digit}/{$tahun2Digit}/{$bulanSekarang}/{$kode3huruf}/{$kode4digit}/";

            $records = DB::connection('pgsql_sales')
                ->table('H1_DOS.guestbook')
                ->where('IDGuestBook', 'LIKE', $prefixGb . '%')
                ->get(['IDGuestBook']);

            if ($records->isEmpty()) {
                return $prefixGb . '1';
            }

            $maxNourut = 0;
            foreach ($records as $record) {
                $p = explode('/', $record->IDGuestBook);
                $nourut = isset($p[6]) ? (int) $p[6] : 0;
                if ($nourut > $maxNourut) {
                    $maxNourut = $nourut;
                }
            }

            return $prefixGb . ($maxNourut + 1);
        }

        return $oldIdGuestBook;
    }

    private function generateTanggalCustom(): string
    {
        $today = (int) date('j');
        $month = date('Y-m');

        if ($today === 1) {
            $randomSecond = rand(0, 3600);
            $baseTime = strtotime(date('Y-m-01') . ' 08:30:00');
            $finalTime = $baseTime + $randomSecond;
        } else {
            $poolSebelumnya = range(1, $today - 1);
            $weightedPool = $poolSebelumnya;
            $weightedPool[] = $today;
            $selectedDay = $weightedPool[array_rand($weightedPool)];

            if ($selectedDay === $today) {
                $randomSecond = rand(0, 3600);
            } else {
                $randomSecond = rand(0, 25200);
            }

            $baseTime = strtotime($month . '-' . str_pad($selectedDay, 2, '0', STR_PAD_LEFT) . ' 08:30:00');
            $finalTime = $baseTime + $randomSecond;
        }

        return date('Y-m-d H:i:s', $finalTime);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $prospek = GuestBook::where('IDGuestBook', $id)
            ->where('id_flp', $flp->id_flp)
            ->first();

        if (!$prospek) {
            return response()->json([
                'success' => false,
                'message' => 'Prospek tidak ditemukan',
            ], 404);
        }

        if ($prospek->Status_guestbook === 't') {
            return response()->json([
                'success' => false,
                'message' => 'Prospek yang sudah approved tidak dapat dihapus',
            ], 403);
        }

        $prospek->delete();

        return response()->json([
            'success' => true,
            'message' => 'Prospek berhasil dihapus',
        ]);
    }
}
