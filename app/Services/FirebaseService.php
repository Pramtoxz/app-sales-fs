<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class FirebaseService
{
    private ?string $projectId = null;
    private ?string $clientEmail = null;
    private ?string $privateKey = null;
    private ?string $accessToken = null;
    private int $tokenExpiresAt = 0;
    private bool $initialized = false;

    public function __construct() {}

    private function init(): void
    {
        if ($this->initialized) {
            return;
        }

        $credentialsPath = base_path(env('FCM_CREDENTIALS_PATH', 'firebase/salesfirebase.json'));

        if (!file_exists($credentialsPath)) {
            throw new \Exception("Firebase credentials file not found: {$credentialsPath}");
        }

        $credentials = json_decode(file_get_contents($credentialsPath), true);

        $this->projectId   = $credentials['project_id'];
        $this->clientEmail = $credentials['client_email'];
        $this->privateKey  = $credentials['private_key'];
        $this->initialized = true;
    }

    public function sendToDevice(string $fcmToken, string $title, string $body, array $data = []): array
    {
        $this->init();
        $data = $this->normalizeData($data);

        $message = [
            'message' => [
                'token'        => $fcmToken,
                'notification' => ['title' => $title, 'body' => $body],
                'data'         => $data,
            ],
        ];

        return $this->sendRequest($message);
    }

    public function sendToMultipleDevices(array $fcmTokens, string $title, string $body, array $data = []): array
    {
        $this->init();
        $data = $this->normalizeData($data);
        $successCount = 0;
        $failureCount = 0;

        foreach ($fcmTokens as $token) {
            $result = $this->sendToDevice($token, $title, $body, $data);
            $result['success'] ? $successCount++ : $failureCount++;
        }

        return [
            'success'    => true,
            'successful' => $successCount,
            'failed'     => $failureCount,
        ];
    }

    public function sendToTopic(string $topic, string $title, string $body, array $data = []): array
    {
        $this->init();
        $data = $this->normalizeData($data);

        $message = [
            'message' => [
                'topic'        => $topic,
                'notification' => ['title' => $title, 'body' => $body],
                'data'         => $data,
            ],
        ];

        return $this->sendRequest($message);
    }

    private function sendRequest(array $payload): array
    {
        try {
            $accessToken = $this->getAccessToken();
            $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

            $context = stream_context_create([
                'http' => [
                    'method'        => 'POST',
                    'header'        => "Authorization: Bearer {$accessToken}\r\nContent-Type: application/json",
                    'content'       => json_encode($payload),
                    'ignore_errors' => true,
                    'timeout'       => 10,
                ],
            ]);

            $response = file_get_contents($url, false, $context);
            $httpCode = $this->parseHttpCode($http_response_header ?? []);
            $result   = json_decode($response, true);

            if ($httpCode === 200) {
                Log::info('FCM sent', ['name' => $result['name'] ?? '']);
                return ['success' => true, 'message' => 'Notification sent successfully'];
            }

            $error = $result['error']['message'] ?? 'Unknown FCM error';
            Log::error('FCM failed', ['code' => $httpCode, 'error' => $error]);

            if ($httpCode === 404) {
                return ['success' => false, 'message' => 'FCM token not found or expired', 'error_type' => 'token_not_found'];
            }
            if ($httpCode === 400) {
                return ['success' => false, 'message' => 'Invalid FCM token', 'error_type' => 'invalid_token'];
            }

            return ['success' => false, 'message' => $error, 'error_type' => 'general_error'];
        } catch (\Exception $e) {
            Log::error('FCM Error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage(), 'error_type' => 'general_error'];
        }
    }

    private function getAccessToken(): string
    {
        if ($this->accessToken && time() < $this->tokenExpiresAt - 60) {
            return $this->accessToken;
        }

        $now     = time();
        $header  = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode(json_encode([
            'iss'   => $this->clientEmail,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));

        $signingInput = $header . '.' . $payload;
        $key = openssl_pkey_get_private($this->privateKey);
        openssl_sign($signingInput, $signature, $key, 'SHA256');
        $jwt = $signingInput . '.' . $this->base64UrlEncode($signature);

        $context = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => 'Content-Type: application/x-www-form-urlencoded',
                'content'       => http_build_query([
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion'  => $jwt,
                ]),
                'ignore_errors' => true,
                'timeout'       => 10,
            ],
        ]);

        $response = file_get_contents('https://oauth2.googleapis.com/token', false, $context);
        $data     = json_decode($response, true);

        if (empty($data['access_token'])) {
            throw new \Exception('Failed to get Firebase access token: ' . ($data['error_description'] ?? $response));
        }

        $this->accessToken    = $data['access_token'];
        $this->tokenExpiresAt = $now + ($data['expires_in'] ?? 3600);

        return $this->accessToken;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function normalizeData(array $data): array
    {
        if (!isset($data['type'])) {
            $data['type'] = 'general';
        }
        if (!isset($data['notification_id'])) {
            $data['notification_id'] = '0';
        }
        return array_map('strval', $data);
    }

    private function parseHttpCode(array $headers): int
    {
        foreach ($headers as $header) {
            if (preg_match('/HTTP\/[\d.]+\s+(\d{3})/', $header, $matches)) {
                return (int) $matches[1];
            }
        }
        return 0;
    }
}
