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

        // Cashier::$apiBaseUrl is symmetric across the suite: every Feature
        // test writes the same stripe-mock pointer, so there is no value to
        // restore to and no tearDown is needed here. AccountSubscriptionTest
        // does restore the underlying \Stripe\Stripe statics it mutates.
        Cashier::$apiBaseUrl = env('STRIPE_API_BASE', 'http://stripe-mock:12111');
        config([
            'cashier.secret' => env('STRIPE_SECRET', 'sk_test_stripemockkey'),
            'cashier.key' => env('STRIPE_KEY', 'pk_test_stripemockkey'),
            'services.stripe.secret' => env('STRIPE_SECRET', 'sk_test_stripemockkey'),
        ]);
    }
}
