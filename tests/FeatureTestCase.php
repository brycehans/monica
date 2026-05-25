<?php

namespace Tests;

use Laravel\Cashier\Cashier;
use Tests\Traits\SignIn;
use Tests\Traits\Asserts;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class FeatureTestCase extends TestCase
{
    use SignIn,
        Asserts,
        DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        Cashier::$apiBaseUrl = env('STRIPE_API_BASE', 'http://stripe-mock:12111');
        config([
            'cashier.secret' => env('STRIPE_SECRET', 'sk_test_stripemockkey'),
            'cashier.key' => env('STRIPE_KEY', 'pk_test_stripemockkey'),
            'services.stripe.secret' => env('STRIPE_SECRET', 'sk_test_stripemockkey'),
        ]);
    }
}
