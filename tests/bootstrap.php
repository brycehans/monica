<?php

require __DIR__.'/../vendor/autoload.php';

foreach ($_ENV as $key => $value) {
    if (! array_key_exists($key, $_SERVER) || $_SERVER[$key] !== $value) {
        $_SERVER[$key] = $value;
    }
}
