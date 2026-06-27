<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExternalApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $secretKey = config('app.external_secret_key');

        if (empty($secretKey) || !hash_equals($secretKey, (string) $request->header('X-Secret-Key'))) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Invalid or missing secret key.',
            ], 401);
        }

        return $next($request);
    }
}
