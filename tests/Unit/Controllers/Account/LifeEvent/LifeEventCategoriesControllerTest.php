<?php

namespace Tests\Unit\Controllers\Account\LifeEvent;

use PHPUnit\Framework\Attributes\Test;
use Tests\FeatureTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class LifeEventCategoriesControllerTest extends FeatureTestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_gets_the_list_of_life_event_categories()
    {
        $user = $this->signin();

        $response = $this->get('settings/personalization/lifeeventcategories');

        $response->assertStatus(200);
    }
}
