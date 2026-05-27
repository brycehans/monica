<?php

namespace Tests\Unit\Services\Smoke;

use Google2FA;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class BaconQrSmokeTest extends TestCase
{
    use DatabaseTransactions;

    public function test_google2fa_facade_renders_an_svg_qr_via_bacon_v3(): void
    {
        $dataUri = Google2FA::getQRCodeInline(
            'Monica',
            'test@example.com',
            'JBSWY3DPEHPK3PXP',
        );

        $this->assertIsString($dataUri);
        $this->assertNotEmpty($dataUri);
        $this->assertStringContainsString('<svg', $dataUri);
    }
}
