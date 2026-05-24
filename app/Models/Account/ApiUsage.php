<?php

namespace App\Models\Account;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $url
 * @property string $method
 * @property string $client_ip
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage whereClientIp($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage whereMethod($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ApiUsage whereUrl($value)
 * @mixin \Eloquent
 */
class ApiUsage extends Model
{
    protected $table = 'api_usage';

    /**
     * Log a request made through the API.
     */
    public function log(\Illuminate\Http\Request $request)
    {
        $this->url = $request->fullUrl();
        $this->method = $request->getMethod();
        $this->client_ip = $request->getClientIp();
        $this->save();
    }
}
