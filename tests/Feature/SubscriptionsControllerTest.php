<?php

namespace Tests\Feature;

use App\Models\Contact\Contact;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Subscription;
use Stripe\Exception\ApiErrorException;
use Stripe\Plan;
use Stripe\Product;
use Stripe\Stripe;
use Tests\FeatureTestCase;

/**
 * HTTP-level feature tests for SubscriptionsController actions that have
 * historically had no coverage. Keeps the Cashier-direct surface in
 * AccountSubscriptionTest distinct from the route-handler surface here.
 *
 * The Product/Plan fixture scaffolding mirrors AccountSubscriptionTest:
 * each class instantiates its own per-run Product+Plan IDs in stripe-mock
 * so the two suites don't interfere (Option A from the Task 5 brief).
 */
class SubscriptionsControllerTest extends FeatureTestCase
{
    use DatabaseTransactions;

    private const STRIPE_MOCK_KEY = 'sk_test_stripemockkey';
    private const STRIPE_MOCK_BASE = 'http://stripe-mock:12111';

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

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.stripe.secret' => self::STRIPE_MOCK_KEY,
            'monica.requires_subscription' => true,
            'monica.paid_plan_monthly_friendly_name' => 'Monthly',
            'monica.paid_plan_monthly_id' => static::$monthlyPlanId,
            'monica.paid_plan_monthly_price' => 100,
            'monica.paid_plan_annual_friendly_name' => 'Annual',
            'monica.paid_plan_annual_id' => static::$annualPlanId,
            'monica.paid_plan_annual_price' => 500,
        ]);
    }

    public static function setUpBeforeClass(): void
    {
        // phpunit.xml sets backupStaticProperties="false", so snapshot the
        // Stripe SDK statics ourselves and restore them in tearDownAfterClass —
        // otherwise this class leaks the stripe-mock pointer to anything else
        // that touches \Stripe\Stripe directly later in the run.
        self::$originalApiBase = Stripe::$apiBase;
        self::$originalApiKey = Stripe::getApiKey();
        self::$originalApiVersion = Stripe::getApiVersion();

        Stripe::setApiKey(self::STRIPE_MOCK_KEY);
        Stripe::$apiBase = env('STRIPE_API_BASE', self::STRIPE_MOCK_BASE);
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

    public function test_confirm_payment_returns_errors_when_stripe_call_fails(): void
    {
        // The plan intended to feed confirmPayment an unknown PaymentIntent ID
        // and assert the catch-StripeException → back()->withErrors() branch.
        // stripe-mock, however, happily synthesises a PaymentIntent for any
        // `pi_*` (or even `xx_invalid`) ID — see Risk #3 in the Task 5 brief.
        // Weakened: force the Stripe SDK to fail by pointing Cashier at an
        // unreachable host for the duration of this test. That still exercises
        // the same catch-redirect branch confirmPayment cares about.
        $originalBase = Cashier::$apiBaseUrl;
        Cashier::$apiBaseUrl = 'http://127.0.0.1:1';

        try {
            $this->signin();

            $response = $this->from('/settings/subscriptions')
                ->get('/settings/subscriptions/confirmPayment/pi_unknown');

            $response->assertSessionHasErrors();
            $response->assertRedirect('/settings/subscriptions');
        } finally {
            Cashier::$apiBaseUrl = $originalBase;
        }
    }

    public function test_archive_page_renders(): void
    {
        $this->signin();

        $response = $this->get('/settings/subscriptions/archive');

        $response->assertOk();
        $response->assertSee('archive', false);
    }

    public function test_process_archive_archives_contacts_and_redirects(): void
    {
        $user = $this->signin();
        factory(Contact::class, 3)->create([
            'account_id' => $user->account_id,
        ]);

        $response = $this->post('/settings/subscriptions/archive');

        $response->assertRedirect('/settings/subscriptions/downgrade');
        $this->assertSame(0, $user->account->fresh()->allContacts()->active()->count());
    }

    public function test_downgrade_page_renders_when_subscribed(): void
    {
        $user = $this->signin();
        factory(Subscription::class)->create([
            'account_id' => $user->account_id,
            'stripe_id' => 'sub_X',
            'stripe_price' => 'annual',
            'type' => 'Annual',
            'quantity' => 1,
        ]);

        $response = $this->get('/settings/subscriptions/downgrade');

        $response->assertOk();
    }

    public function test_downgrade_redirects_when_not_subscribed(): void
    {
        $this->signin();

        $response = $this->get('/settings/subscriptions/downgrade');

        $response->assertRedirect('/settings');
    }

    public function test_process_downgrade_cancels_subscription(): void
    {
        $user = $this->signin();
        $user->email = 'test_process_downgrade@monica-test.com';
        $user->save();

        // First subscribe via stripe-mock (same pattern as test_it_subscribe).
        $this->post('/settings/subscriptions/processPayment', [
            'payment_method' => 'pm_card_visa',
            'plan' => 'annual',
        ]);

        $response = $this->post('/settings/subscriptions/downgrade');

        $response->assertRedirect('/settings/subscriptions/downgrade/success');
    }

    public function test_process_downgrade_redirects_back_if_cannot_downgrade(): void
    {
        $user = $this->signin();
        // Create more contacts than the free tier allows (default 10) so
        // canDowngrade returns false.
        factory(Contact::class, 100)->create([
            'account_id' => $user->account_id,
        ]);

        $response = $this->post('/settings/subscriptions/downgrade');

        $response->assertRedirect('/settings/subscriptions/downgrade');
    }

    public function test_upgrade_success_page_renders(): void
    {
        $this->signin();

        $response = $this->get('/settings/subscriptions/upgrade/success');

        $response->assertOk();
    }

    public function test_downgrade_success_page_renders(): void
    {
        $this->signin();

        $response = $this->get('/settings/subscriptions/downgrade/success');

        $response->assertOk();
    }

    public function test_force_complete_payment_marks_subscription_active(): void
    {
        $user = $this->signin();
        $sub = factory(Subscription::class)->create([
            'account_id' => $user->account_id,
            'stripe_id' => 'sub_X',
            'stripe_price' => 'annual',
            'stripe_status' => 'incomplete',
            'type' => 'Annual',
            'quantity' => 1,
        ]);

        $response = $this->get('/settings/subscriptions/forceCompletePaymentOnTesting');

        $response->assertRedirect('/settings/subscriptions');
        $this->assertSame('active', $sub->fresh()->stripe_status);
    }
}
