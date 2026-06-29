<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $connection = 'pgsql_sales';
    protected $table = 'public.users';
    public $incrementing = true;

    protected $fillable = [
        'name',
        'email',
        'password',
        'kd_kariawan',
        'username',
        'level',
        'no_hp',
        'fk_dealer',
        'fk_provinsi',
        'it',
        'wing_dealer',
        'is_kacab',
        'flg_md_d',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'flg_md_d' => 'string',
        ];
    }

    public function getRoles(): array
    {
        $roles = [];
        if ($this->isIt()) $roles[] = 'IT';
        if ($this->isKacab()) $roles[] = 'KACAB';
        if ($this->isMd()) $roles[] = 'MD';
        return $roles;
    }

    public function isIt(): bool
    {
        return in_array($this->attributes['it'] ?? null, ['t', '1', 1, true], true);
    }

    public function isKacab(): bool
    {
        return in_array($this->attributes['is_kacab'] ?? null, ['t', '1', 1, true], true);
    }

    public function isMd(): bool
    {
        return $this->flg_md_d === 'MD' && !$this->isKacab();
    }

    public function flp()
    {
        return $this->hasOne(Flp::class, 'id_flp', 'kd_kariawan');
    }

    public function createToken($name)
    {
        $token = bin2hex(random_bytes(32));

        $accessToken = PersonalAccessToken::create([
            'tokenable_type' => self::class,
            'tokenable_id' => $this->id,
            'name' => $name,
            'token' => hash('sha256', $token),
            'abilities' => ['*'],
        ]);

        return (object) [
            'accessToken' => $accessToken,
            'plainTextToken' => $accessToken->id . '|' . $token,
        ];
    }

    public function tokens()
    {
        return $this->morphMany(PersonalAccessToken::class, 'tokenable');
    }

    public function currentAccessToken()
    {
        return $this->accessToken ?? null;
    }
}
