<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Page and route tests must run with isolated PHP dependencies; the
        // frontend compile is verified separately in the CI frontend job.
        $this->withoutVite();
    }
}
