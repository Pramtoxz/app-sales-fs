<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;

class WhatsAppGateway
{
    protected $baseUrl;
    protected $token;
    protected $session;
    protected $groupId;

    public function __construct(?int $configId = null)
    {
        if ($configId) {
            $config = DB::table('config_wa')->where('id', $configId)->first();
        } else {
            $config = DB::table('config_wa')->first();
        }
        
        if (!$config) {
            throw new \RuntimeException('Konfigurasi WhatsApp tidak ditemukan di database.');
        }

        $this->baseUrl = rtrim($config->wa_gateway_url ?? '', '/');
        $this->token   = $config->wa_gateway_secret ?? '';
        $this->session = $config->wa_session_name ?? '';
        $this->groupId = '';

        $missing = [];
        if (!$this->baseUrl) $missing[] = 'wa_gateway_url';
        if (!$this->token) $missing[] = 'wa_gateway_secret';
        if (!$this->session) $missing[] = 'wa_session_name';

        if (!empty($missing)) {
            throw new \RuntimeException('Config WhatsApp belum lengkap. Field kosong: ' . implode(', ', $missing));
        }
    }

    public function sendText(string $to, string $message, bool $isGroup = false): void
    {
        $payload = [
            'session' => $this->session,
            'to'      => $isGroup ? $to : preg_replace('/\D+/', '', $to),
            'text'    => $message,
        ];

        if ($isGroup) {
            $payload['is_group'] = true;
        }

        $url = $this->baseUrl.'/message/send-text';

        $ch = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer '.$this->token,
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $body   = curl_exec($ch);
        $errno  = curl_errno($ch);
        $error  = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($errno !== 0) {
            throw new \RuntimeException('WhatsApp Gateway tidak bisa dihubungi: '.$error);
        }

        if ($status >= 400) {
            throw new \RuntimeException("WhatsApp Gateway error ({$status}): ".$body);
        }

        $decoded = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Respons gateway tidak valid: '.$body);
        }

        if (!empty($decoded['success']) || isset($decoded['message'])) {
            return;
        }

        throw new \RuntimeException('Gateway tidak mengembalikan status sukses: '.$body);
    }

    public function sendToGroup(string $groupId = null, string $message): void
    {
        $targetGroupId = $groupId ?? $this->groupId;
        
        if (!$targetGroupId) {
            throw new \RuntimeException('Group ID tidak ditemukan.');
        }
        
        $this->sendText($targetGroupId, $message, true);
    }

    public function getGroups(): array
    {
        $url = $this->baseUrl.'/session/groups?session='.$this->session;

        $ch = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer '.$this->token,
                'Accept: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $body   = curl_exec($ch);
        $errno  = curl_errno($ch);
        $error  = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($errno !== 0) {
            throw new \RuntimeException('WhatsApp Gateway tidak bisa dihubungi: '.$error);
        }

        if ($status >= 400) {
            throw new \RuntimeException("WhatsApp Gateway error ({$status}): ".$body);
        }

        $decoded = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Respons gateway tidak valid: '.$body);
        }

        return $decoded['data'] ?? [];
    }
}
