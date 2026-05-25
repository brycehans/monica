<?php

namespace Tests\Concerns;

use Stripe\Exception\ApiErrorException;
use Stripe\Plan;
use Stripe\Product;
use Stripe\Stripe;
use Illuminate\Support\Str;

/**
 * Shared stripe-mock fixture scaffolding for Cashier-touching feature tests.
 *
 * Each consuming class gets its own per-run Product+Plan IDs in stripe-mock
 * so the two suites don't collide on resource IDs. The trait also takes
 * responsibility for capturing and restoring the \Stripe\Stripe SDK statics
 * (phpunit.xml has backupStaticProperties="false", so unless we restore the
 * statics ourselves we leak the stripe-mock pointer into anything else that
 * touches \Stripe\Stripe later in the run).
 *
 * Consumers still own:
 * - their own setUp(), which overrides monica.paid_plan_*_id to point at the
 *   per-class IDs the trait populated in setUpBeforeClass.
 * - their own test methods.
 *
 * Consumers MUST call parent::setUpBeforeClass()/tearDownAfterClass() in any
 * methods they override (so PHPUnit's own bootstrapping still runs); the
 * trait's static lifecycle methods replace the test class's, not the parent.
 */
trait HasStripeMockFixtures
{
    protected const STRIPE_MOCK_KEY = 'sk_test_stripemockkey';
    protected const STRIPE_MOCK_BASE = 'http://stripe-mock:12111';

    /**
     * @var string
     */
    protected static $stripePrefix = 'cashier-test-';

    /**
     * @var string
     */
    protected static $productId;

    /**
     * @var string
     */
    protected static $monthlyPlanId;

    /**
     * @var string
     */
    protected static $annualPlanId;

    private static ?string $originalApiBase = null;
    private static ?string $originalApiKey = null;
    private static ?string $originalApiVersion = null;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        // phpunit.xml sets backupStaticProperties="false", so snapshot the
        // Stripe SDK statics ourselves and restore them in tearDownAfterClass —
        // otherwise the consuming class leaks the stripe-mock pointer to
        // anything else that touches \Stripe\Stripe directly later in the run.
        self::$originalApiBase = Stripe::$apiBase;
        self::$originalApiKey = Stripe::getApiKey();
        self::$originalApiVersion = Stripe::getApiVersion();

        Stripe::setApiKey(self::STRIPE_MOCK_KEY);
        Stripe::$apiBase = env('STRIPE_API_BASE', self::STRIPE_MOCK_BASE);
        // Pin a specific API version so stripe-mock's response shape stays
        // deterministic across stripe-php upgrades. Cashier-mediated calls
        // still use Cashier::STRIPE_VERSION internally — most of the test
        // surface goes through that, not this pin.
        Stripe::setApiVersion('2024-12-18.acacia');

        static::$productId = static::$stripePrefix.'product-'.Str::random(10);
        static::$monthlyPlanId = static::$stripePrefix.'monthly-'.Str::random(10);
        static::$annualPlanId = static::$stripePrefix.'annual-'.Str::random(10);

        Product::create([
            'id' => static::$productId,
            'name' => 'Monica Test Product',
        ]);

        Plan::create([
            'id' => static::$monthlyPlanId,
            'nickname' => 'Monthly',
            'currency' => 'USD',
            'interval' => 'month',
            'billing_scheme' => 'per_unit',
            'amount' => 100,
            'product' => static::$productId,
        ]);
        Plan::create([
            'id' => static::$annualPlanId,
            'nickname' => 'Annual',
            'currency' => 'USD',
            'interval' => 'year',
            'billing_scheme' => 'per_unit',
            'amount' => 500,
            'product' => static::$productId,
        ]);
    }

    public static function tearDownAfterClass(): void
    {
        parent::tearDownAfterClass();

        if (static::$monthlyPlanId) {
            static::deleteStripeResource(new Plan(static::$monthlyPlanId));
            static::$monthlyPlanId = null;
        }
        if (static::$annualPlanId) {
            static::deleteStripeResource(new Plan(static::$annualPlanId));
            static::$annualPlanId = null;
        }
        if (static::$productId) {
            static::deleteStripeResource(new Product(static::$productId));
            static::$productId = null;
        }

        if (self::$originalApiBase !== null) {
            Stripe::$apiBase = self::$originalApiBase;
        }
        if (self::$originalApiKey !== null) {
            Stripe::setApiKey(self::$originalApiKey);
        }
        if (self::$originalApiVersion !== null) {
            Stripe::setApiVersion(self::$originalApiVersion);
        }
    }

    protected static function deleteStripeResource($resource)
    {
        try {
            if (method_exists($resource, 'delete')) {
                $resource->delete();
            }
        } catch (ApiErrorException $e) {
            //
        }
    }
}
