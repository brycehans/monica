<?php

namespace Tests\Unit\Services\DavClient\Utils\Model;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\DavClient\Utils\Model\ContactUpdateDto;

class ContactUpdateDtoTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_create_dto_string()
    {
        $dto = new ContactUpdateDto('uri', 'etag', 'card');
        $this->assertEquals('uri', $dto->uri);
        $this->assertEquals('etag', $dto->etag);
        $this->assertEquals('card', $dto->card);
    }

    #[Test]
    public function it_create_dto_resource()
    {
        $resource = fopen(__DIR__.'/stub.vcf', 'r');
        $dto = new ContactUpdateDto('uri', 'etag', $resource);
        $this->assertEquals('uri', $dto->uri);
        $this->assertEquals('etag', $dto->etag);
        $this->assertEquals('card', $dto->card);
    }
}
