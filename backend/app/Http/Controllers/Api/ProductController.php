<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    private const CATEGORIES = [
        'Makanan Utama' => 'makanan_utama',
        'Appetizer' => 'appetizer',
        'Minuman' => 'minuman',
    ];

    public function index(): JsonResponse
    {
        return response()->json(Product::query()->where('aktif', true)->orderBy('kategori')->orderBy('nama_produk')->get()->map(
            fn (Product $product) => $this->present($product),
        ));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $product = Product::query()->create($this->toDatabase($data));

        return response()->json($this->present($product), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->where('aktif', true)->findOrFail($id);
        $product->update($this->toDatabase($this->validated($request)));

        return response()->json($this->present($product->refresh()));
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::query()->where('aktif', true)->findOrFail($id);
        $product->update(['aktif' => false]);

        return response()->json(['message' => 'Produk dinonaktifkan.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', Rule::in(array_keys(self::CATEGORIES))],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);
    }

    private function toDatabase(array $data): array
    {
        return [
            'nama_produk' => $data['name'],
            'kategori' => self::CATEGORIES[$data['category']],
            'deskripsi' => $data['description'] ?? null,
            'foto_url' => $data['image'] ?? null,
            'harga' => $data['price'],
            'stok' => $data['stock'],
            'aktif' => true,
        ];
    }

    private function present(Product $product): array
    {
        return [
            'id' => $product->id_produk,
            'name' => $product->nama_produk,
            'category' => array_search($product->kategori, self::CATEGORIES, true) ?: 'Makanan Utama',
            'description' => $product->deskripsi ?? '',
            'image' => $product->foto_url,
            'price' => (int) $product->harga,
            'stock' => (int) $product->stok,
        ];
    }
}
