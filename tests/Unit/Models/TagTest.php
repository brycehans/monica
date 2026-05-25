<?php

namespace Tests\Unit\Models;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\Contact\Tag;
use App\Models\Account\Account;
use App\Models\Contact\Contact;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class TagTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_belongs_to_an_account()
    {
        $account = factory(Account::class)->create([]);
        $contact = factory(Contact::class)->create(['account_id' => $account->id]);
        $tag = factory(Tag::class)->create([
            'account_id' => $account->id,
        ]);

        $this->assertTrue($tag->account()->exists());
    }

    #[Test]
    public function it_belongs_to_many_contacts()
    {
        $account = factory(Account::class)->create([]);
        $contact = factory(Contact::class)->create(['account_id' => $account->id]);
        $tag = factory(Tag::class)->create(['account_id' => $account->id]);
        $contact->tags()->sync([$tag->id => ['account_id' => $account->id]]);

        $contact = factory(Contact::class)->create(['account_id' => $account->id]);
        $tag = factory(Tag::class)->create(['account_id' => $account->id]);
        $contact->tags()->sync([$tag->id => ['account_id' => $account->id]]);

        $this->assertTrue($tag->contacts()->exists());
    }
}
