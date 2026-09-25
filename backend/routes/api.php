<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::get('/products', [ProductController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:20,1');
Route::get('/orders/{code}', [OrderController::class, 'show'])->where('code', 'INA-[A-Z0-9]+');

Route::middleware(['auth:sanctum', 'role:kasir,admin'])->group(function (): void {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{code}', [OrderController::class, 'updateStatus'])->where('code', 'INA-[A-Z0-9]+');
    Route::post('/orders/{code}/payment', [OrderController::class, 'confirmPayment'])->where('code', 'INA-[A-Z0-9]+');
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function (): void {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');
});
