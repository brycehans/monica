<?php

namespace Tests\Unit\Traits;

use App\Exceptions\StripeException;
use App\Traits\StripeCall;
use Laravel\Cashier\Exceptions\IncompletePayment;
use Laravel\Cashier\Payment;
use PHPUnit\Framework\Attributes\Test;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\AuthenticationException;
use Stripe\Exception\CardException;
use Stripe\Exception\InvalidRequestException;
use Stripe\Exception\RateLimitException;
use Stripe\Exception\UnknownApiErrorException;
use Stripe\PaymentIntent;
use Tests\TestCase;

class StripeCallTest extends TestCase
{
    private object $caller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->caller = new class
        {
            use StripeCall {
                stripeCall as public;
            }
        };
    }

    #[Test]
    public function test_it_returns_callback_value_on_success(): void
    {
        $result = $this->caller->stripeCall(fn () => 'ok');

        $this->assertSame('ok', $result);
    }

    #[Test]
    public function test_it_wraps_card_exception_with_translated_message(): void
    {
        $this->expectException(StripeException::class);

        $this->caller->stripeCall(function () {
            $body = ['error' => ['message' => 'Your card was declined.']];
            throw CardException::factory('Card declined', 402, null, $body);
        });
    }

    #[Test]
    public function test_it_wraps_rate_limit_exception(): void
    {
        $this->expectException(StripeException::class);

        $this->caller->stripeCall(function () {
            throw RateLimitException::factory('Too many requests', 429, null, ['error' => ['message' => 'rate limit']]);
        });
    }

    #[Test]
    public function test_it_wraps_invalid_request_exception(): void
    {
        $this->expectException(StripeException::class);

        $this->caller->stripeCall(function () {
            throw InvalidRequestException::factory('Invalid params', 400, null, ['error' => ['message' => 'invalid']]);
        });
    }

    #[Test]
    public function test_it_wraps_authentication_exception(): void
    {
        $this->expectException(StripeException::class);

        $this->caller->stripeCall(function () {
            throw AuthenticationException::factory('Bad key', 401, null, ['error' => ['message' => 'auth failed']]);
        });
    }

    #[Test]
    public function test_it_wraps_api_connection_exception(): void
    {
        $this->expectException(StripeException::class);

        $this->caller->stripeCall(function () {
            throw ApiConnectionException::factory('Network down', 0, null, ['error' => ['message' => 'connection']]);
        });
    }

    #[Test]
    public function test_it_wraps_api_error_exception(): void
    {
        $this->expectException(StripeException::class);

        $this->caller->stripeCall(function () {
            throw UnknownApiErrorException::factory('Unknown error', 500, null, ['error' => ['message' => 'oops']]);
        });
    }

    #[Test]
    public function test_it_rethrows_incomplete_payment_exception(): void
    {
        $this->expectException(IncompletePayment::class);

        $this->caller->stripeCall(function () {
            $payment = new Payment(new PaymentIntent('pi_test'));
            throw new IncompletePayment($payment, 'incomplete');
        });
    }

    #[Test]
    public function test_it_wraps_generic_exception_with_original_message(): void
    {
        $this->expectException(StripeException::class);
        $this->expectExceptionMessage('boom');

        $this->caller->stripeCall(function () {
            throw new \RuntimeException('boom');
        });
    }
}
