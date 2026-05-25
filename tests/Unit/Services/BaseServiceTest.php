<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\Attributes\Test;
use Carbon\Carbon;
use Tests\TestCase;
use App\Services\BaseService;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class BaseServiceTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_returns_an_empty_rule_array(): void
    {
        $stub = new class extends BaseService {};

        $this->assertIsArray(
            $stub->rules()
        );
    }

    #[Test]
    public function it_validates_rules(): void
    {
        $rules = [
            'street' => 'nullable|string|max:255',
        ];

        $stub = new class extends BaseService {};
        $stub->rules([$rules]);

        $this->assertTrue(
            $stub->validate([
                'street' => 'la rue du bonheur',
            ])
        );
    }

    #[Test]
    public function it_returns_null_or_the_actual_value(): void
    {
        $stub = new class extends BaseService {};
        $array = [
            'value' => 'this',
        ];

        $this->assertEquals(
            'this',
            $stub->nullOrValue($array, 'value')
        );

        $array = [
            'otherValue' => '',
        ];

        $this->assertNull(
            $stub->nullOrValue($array, 'otherValue')
        );

        $array = [];

        $this->assertNull(
            $stub->nullOrValue($array, 'value')
        );
    }

    #[Test]
    public function it_returns_null_or_the_actual_date(): void
    {
        $stub = new class extends BaseService {};
        $array = [
            'value' => '1990-01-01',
        ];

        $this->assertInstanceOf(
            Carbon::class,
            $stub->nullOrDate($array, 'value')
        );

        $array = [
            'otherValue' => '',
        ];

        $this->assertNull(
            $stub->nullOrDate($array, 'otherValue')
        );

        $array = [];

        $this->assertNull(
            $stub->nullOrDate($array, 'value')
        );
    }

    #[Test]
    public function it_returns_the_default_value_or_the_given_value(): void
    {
        $stub = new class extends BaseService {};
        $array = [
            'value' => true,
        ];

        $this->assertTrue(
            $stub->valueOrFalse($array, 'value')
        );

        $array = [
            'value' => false,
        ];

        $this->assertFalse(
            $stub->valueOrFalse($array, 'value')
        );

        $this->assertFalse(
            $stub->valueOrFalse([], 'value')
        );
    }
}
