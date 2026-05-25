<?php

namespace Tests\Unit\Services\Contact\Occupation;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\Contact\Occupation;
use App\Services\Contact\Occupation\DestroyOccupation;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class DestroyOccupationTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_destroys_a_occupation()
    {
        $occupation = factory(Occupation::class)->create([]);

        $request = [
            'account_id' => $occupation->account_id,
            'occupation_id' => $occupation->id,
        ];

        $this->assertDatabaseHas('occupations', [
            'id' => $occupation->id,
        ]);

        app(DestroyOccupation::class)->execute($request);

        $this->assertDatabaseMissing('occupations', [
            'id' => $occupation->id,
        ]);
    }
}
