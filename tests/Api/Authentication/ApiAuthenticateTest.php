<?php

namespace Tests\Api\Authentication;

use PHPUnit\Framework\Attributes\Test;
use Tests\ApiTestCase;

class ApiAuthenticateTest extends ApiTestCase
{
    #[Test]
    public function guest_is_rejected()
    {
        $response = $this->json('GET', '/api/contacts');

        $response->assertStatus(401);
        $response->assertJsonFragment([
            'message' => 'Unauthenticated.',
        ]);
    }
}
