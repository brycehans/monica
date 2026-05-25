<?php

namespace Tests\Unit\Models;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\Contact\Pet;
use App\Models\Account\Account;
use App\Models\Contact\Contact;
use App\Models\Contact\PetCategory;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class PetTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_belongs_to_an_account()
    {
        $account = factory(Account::class)->create([]);
        $contact = factory(Contact::class)->create(['account_id' => $account->id]);
        $pet = factory(Pet::class)->create([
            'account_id' => $account->id,
            'contact_id' => $contact->id,
        ]);

        $this->assertTrue($pet->account()->exists());
    }

    #[Test]
    public function it_belongs_to_a_contact()
    {
        $contact = factory(Contact::class)->create([]);
        $pet = factory(Pet::class)->create([
            'account_id' => $contact->account_id,
            'contact_id' => $contact->id,
        ]);

        $this->assertTrue($pet->contact()->exists());
    }

    #[Test]
    public function it_belongs_to_a_pet_category()
    {
        $petCategory = factory(PetCategory::class)->create([]);
        $pet = factory(Pet::class)->create([
            'pet_category_id' => $petCategory->id,
        ]);

        $this->assertTrue($pet->petCategory()->exists());
    }

    #[Test]
    public function it_sets_name()
    {
        $pet = new Pet;
        $this->assertNull($pet->name);

        $pet->name = 'henri';
        $this->assertEquals(
            'henri',
            $pet->name
        );
    }
}
