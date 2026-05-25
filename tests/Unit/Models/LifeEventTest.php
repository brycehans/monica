<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Contact\Reminder;
use App\Models\Contact\LifeEvent;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class LifeEventTest extends TestCase
{
    use DatabaseTransactions;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_an_account()
    {
        $lifeEvent = factory(LifeEvent::class)->create([]);

        $this->assertTrue($lifeEvent->account()->exists());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_a_contact()
    {
        $lifeEvent = factory(LifeEvent::class)->create([]);

        $this->assertTrue($lifeEvent->contact()->exists());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_a_type()
    {
        $lifeEvent = factory(LifeEvent::class)->create([]);

        $this->assertTrue($lifeEvent->lifeEventType()->exists());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_a_reminder()
    {
        $lifeEvent = factory(LifeEvent::class)->create([]);
        $reminder = factory(Reminder::class)->create([
            'account_id' => $lifeEvent->account_id,
        ]);
        $lifeEvent->reminder_id = $reminder->id;
        $lifeEvent->save();

        $this->assertTrue($lifeEvent->reminder()->exists());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_gets_the_name_attribute()
    {
        $lifeEvent = factory(LifeEvent::class)->create([
            'name' => 'Fake name',
        ]);

        $this->assertEquals(
            'Fake name',
            $lifeEvent->name
        );
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_gets_the_note_attribute()
    {
        $lifeEvent = factory(LifeEvent::class)->create([
            'note' => 'Fake note',
        ]);

        $this->assertEquals(
            'Fake note',
            $lifeEvent->note
        );
    }
}
