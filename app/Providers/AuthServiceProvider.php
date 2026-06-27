<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Auth::viaRequest('custom-token', function ($request) {
            $token = $request->bearerToken();

            if (!$token) {
                return null;
            }

            [$id, $plainToken] = explode('|', $token, 2);

            $accessToken = PersonalAccessToken::where('id', $id)->first();

            if (!$accessToken) {
                return null;
            }

            if (!hash_equals($accessToken->token, hash('sha256', $plainToken))) {
                return null;
            }

            $accessToken->update(['last_used_at' => now()]);

            $user = User::where('id', $accessToken->tokenable_id)->first();

            if ($user) {
                $user->accessToken = $accessToken;
            }

            return $user;
        });
    }
}
