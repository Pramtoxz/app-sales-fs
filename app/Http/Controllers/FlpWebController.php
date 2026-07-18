<?php

namespace App\Http\Controllers;

use App\Models\Flp;
use App\Models\M_Dealer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FlpWebController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $dealerQuery = M_Dealer::select('kd_dealer_md', 'nm_alias_dealer')
            ->where('jenis_dealer', 'like', '%H1%');
        if ($user->isKacab()) {
            $dealerQuery->where('kd_dealer_md', $user->fk_dealer);
        }
        $dealers = $dealerQuery->orderBy('nm_alias_dealer')->get();

        return Inertia::render('flp/Index', [
            'dealers' => $dealers,
            'isKacab' => $user->isKacab(),
        ]);
    }

    public function getData(Request $request)
    {
        $request->validate([
            'kode_dealer' => 'required|string',
        ]);

        $user = Auth::user();

        if ($user->isKacab() && $user->fk_dealer !== $request->kode_dealer) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak'], 403);
        }

        $flps = Flp::where('kode_dealer', $request->kode_dealer)
            ->select('id_flp', 'nama', 'jabatan', 'is_active', 'last_login', 'foto')
            ->orderBy('nama')
            ->get()
            ->map(function ($flp) {
                return [
                    'id_flp' => $flp->id_flp,
                    'nama' => $flp->nama ?? '-',
                    'jabatan' => $flp->jabatan ?? '-',
                    'is_active' => $flp->is_active,
                    'last_login' => $flp->last_login ? \Carbon\Carbon::parse($flp->last_login)->format('d M Y H:i') : '-',
                    'foto' => $flp->foto ? Storage::disk('public')->url($flp->foto) : null,
                ];
            });

        return response()->json(['success' => true, 'data' => $flps]);
    }
}
