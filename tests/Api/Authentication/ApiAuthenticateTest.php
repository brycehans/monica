<?php

namespace Tests\Api\Authentication;

use Tests\ApiTestCase;

class ApiAuthenticateTest extends ApiTestCase
{
    #[\PHPUnit\Framework\Attributes\Test]
    public function guest_is_rejected()
    {
        $response = $this->json('GET', '/api/contacts');

        $response->assertStatus(401);
        $response->assertJsonFragment([
            'message' => 'Unauthenticated.',
        ]);
    }
}
