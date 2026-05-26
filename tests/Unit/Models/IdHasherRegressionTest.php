<?php

namespace Tests\Unit\Models;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Vinkla\Hashids\Facades\Hashids;

/**
 * Regression gate for vinkla/hashids 12 → 13 (and any future vinkla/hashids
 * major bump). Asserts deterministic encoding under a pinned config — if
 * vinkla renames a config key (e.g., salt → key) or changes default alphabet
 * behaviour, this test fails BEFORE the bump goes to prod.
 *
 * Captured 2026-05-26 against vinkla/hashids v12.0.0 → hashids/hashids 5.0.2.
 * Salt: "d3-regression-test-salt", length: 18.
 */
class IdHasherRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'hashids.connections.main.salt' => 'd3-regression-test-salt',
            'hashids.connections.main.length' => 18,
        ]);
        // Force the manager to re-read config under the new keys
        $this->app->forgetInstance('hashids');
    }

    #[Test]
    public function it_encodes_id_12345_to_the_captured_golden_hash()
    {
        $this->assertEquals('9ojgBpy84KRyrn01wZ', Hashids::encode(12345));
    }

    #[Test]
    public function it_encodes_id_1_to_the_captured_golden_hash()
    {
        $this->assertEquals('M9ojgBpy8e5rn01wZ8', Hashids::encode(1));
    }

    #[Test]
    public function it_encodes_id_99999999_to_the_captured_golden_hash()
    {
        $this->assertEquals('z89ogJPnOg8dyEV1a2', Hashids::encode(99999999));
    }

    #[Test]
    public function it_roundtrips_the_golden_hash()
    {
        $hash = Hashids::encode(12345);
        $decoded = Hashids::decode($hash);
        $this->assertEquals(12345, $decoded[0]);
    }
}
