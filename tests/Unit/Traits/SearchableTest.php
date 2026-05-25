<?php

namespace Tests\Unit\Traits;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\Contact\Contact;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SearchableTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function testSearchContactsReturnsCollection()
    {
        $contact = factory(Contact::class)->make();
        $searchResults = $contact->search($contact->first_name, $contact->account_id, 'created_at', 'desc')
            ->paginate(10);

        $this->assertInstanceOf('Illuminate\Pagination\LengthAwarePaginator', $searchResults);
    }

    #[Test]
    public function testSearchContactsThroughFirstNameAndResultContainsContact()
    {
        $contact = factory(Contact::class)->create(['first_name' => 'FirstName']);
        $searchResults = $contact->search($contact->first_name, $contact->account_id, 'created_at', 'desc')
            ->paginate(10);

        $this->assertTrue($searchResults->contains($contact));
    }

    #[Test]
    public function testSearchContactsThroughMiddleNameAndResultContainsContact()
    {
        $contact = factory(Contact::class)->create(['middle_name' => 'MiddleName']);
        $searchResults = $contact->search($contact->middle_name, $contact->account_id, 'created_at', 'desc')
            ->paginate(10);

        $this->assertTrue($searchResults->contains($contact));
    }

    #[Test]
    public function testSearchContactsThroughLastNameAndResultContainsContact()
    {
        $contact = factory(Contact::class)->create(['last_name' => 'LastName']);
        $searchResults = $contact->search($contact->last_name, $contact->account_id, 'created_at', 'desc')
            ->paginate(10);

        $this->assertTrue($searchResults->contains($contact));
    }

    /**
     * @psalm-suppress UndefinedFunction
     */
    #[Test]
    public function testFailingSearchContacts()
    {
        $contact = factory(Contact::class)->create(['first_name' => 'TestShouldFail']);
        $searchResults = $contact->search('TestWillSucceed', $contact->account_id, 'created_at', 'desc')
            ->paginate(10);

        $this->assertFalse($searchResults->contains($contact));
    }
}
