<?php

namespace Tests\Unit\Models;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\Account\Account;
use App\Models\Contact\Contact;
use App\Models\Contact\Document;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class DocumentTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_belongs_to_an_account()
    {
        $account = factory(Account::class)->create([]);
        $document = factory(Document::class)->create([
            'account_id' => $account->id,
        ]);

        $this->assertTrue($document->account()->exists());
    }

    #[Test]
    public function it_belongs_to_a_contact()
    {
        $contact = factory(Contact::class)->create();
        $document = factory(Document::class)->create([
            'contact_id' => $contact->id,
        ]);

        $this->assertTrue($document->contact()->exists());
    }

    #[Test]
    public function it_gets_the_download_link()
    {
        $document = factory(Document::class)->create();

        $this->assertEquals(
            config('app.url').'/store/'.$document->new_filename,
            $document->getDownloadLink()
        );
    }
}
