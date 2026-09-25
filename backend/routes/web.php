<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'application' => 'Dapur Ina Aina API',
    'status' => 'ok',
    'api' => '/api',
]));
