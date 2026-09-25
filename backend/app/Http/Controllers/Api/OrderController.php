<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\RestaurantOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    private const ORDER_STATUSES = [
        'Pending Confirmation' => 'pending_confirmation',
        'Diproses' => 'diproses',
        'Siap Disajikan' => 'siap_disajikan',
        'Selesai' => 'selesai',
    ];

    public function index(): JsonResponse
    {
        $orders = RestaurantOrder::query()
            ->with(['customer', 'items', 'payment'])
            ->latest('tgl_transaksi')
            ->limit(300)
            ->get();

        return response()->json($orders->map(fn (RestaurantOrder $order) => $this->present($order)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:25'],
            'service' => ['required', Rule::in(['Dine-in', 'Takeaway'])],
            'table' => ['nullable', 'string', 'max:20'],
            'payment' => ['required', 'string', 'max:40'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.id' => ['required', 'integer', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'items.*.note' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['service'] === 'Dine-in' && blank($data['table'] ?? null)) {
            throw ValidationException::withMessages(['table' => ['Nomor meja wajib diisi untuk dine-in.']]);
        }

        $order = DB::transaction(function () use ($data): RestaurantOrder {
            $quantities = collect($data['items'])->keyBy('id');
            $products = Product::query()
                ->whereIn('id_produk', $quantities->keys())
                ->where('aktif', true)
                ->lockForUpdate()
                ->get()
                ->keyBy('id_produk');

            if ($products->count() !== $quantities->count()) {
                throw ValidationException::withMessages(['items' => ['Ada menu yang sudah tidak tersedia. Muat ulang katalog.']]);
            }

            $subtotal = 0;
            foreach ($quantities as $productId => $item) {
                $product = $products->get($productId);
                if ($product->stok < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Stok {$product->nama_produk} tidak mencukupi. Muat ulang katalog."],
                    ]);
                }
                $subtotal += (int) $product->harga * (int) $item['quantity'];
            }

            $customer = Customer::query()->where('no_tlp', $data['phone'])->first();
            if (! $customer) {
                $customer = Customer::query()->create([
                    'nama_pelanggan' => $data['customer'],
                    'no_tlp' => $data['phone'],
                ]);
            } elseif ($customer->nama_pelanggan !== $data['customer']) {
                $customer->update(['nama_pelanggan' => $data['customer']]);
            }

            $tax = (int) round($subtotal * 0.10);
            $order = RestaurantOrder::query()->create([
                'kode_transaksi' => 'INA-'.Str::upper(Str::random(10)),
                'id_pelanggan' => $customer->id_pelanggan,
                'jenis_pesanan' => $data['service'] === 'Dine-in' ? 'dine_in' : 'takeaway',
                'no_meja' => $data['service'] === 'Dine-in' ? $data['table'] : null,
                'tgl_transaksi' => now(),
                'subtotal' => $subtotal,
                'pb1' => $tax,
                'total_bayar' => $subtotal + $tax,
                'status_pesanan' => 'pending_confirmation',
            ]);

            foreach ($quantities as $productId => $item) {
                /** @var Product $product */
                $product = $products->get($productId);
                $quantity = (int) $item['quantity'];
                OrderItem::query()->create([
                    'id_transaksi' => $order->id_transaksi,
                    'id_produk' => $product->id_produk,
                    'nama_produk' => $product->nama_produk,
                    'harga_satuan' => $product->harga,
                    'jumlah' => $quantity,
                    'catatan' => $item['note'] ?? null,
                    'subtotal_item' => (int) $product->harga * $quantity,
                ]);
                $product->decrement('stok', $quantity);
            }

            Payment::query()->create([
                'id_transaksi' => $order->id_transaksi,
                'metode_bayar' => $this->paymentMethod($data['payment']),
                'status_pembayaran' => 'menunggu',
                'jumlah_bayar' => $subtotal + $tax,
            ]);

            return $order;
        }, 3);

        return response()->json($this->present($order->load(['customer', 'items', 'payment'])), 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['phone' => ['required', 'string', 'max:25']]);
        $order = RestaurantOrder::query()
            ->with(['customer', 'items', 'payment'])
            ->where('kode_transaksi', $code)
            ->firstOrFail();

        if (! $order->customer || ! hash_equals($order->customer->no_tlp, $data['phone'])) {
            return response()->json(['message' => 'Invoice tidak ditemukan.'], 404);
        }

        return response()->json($this->present($order));
    }

    public function updateStatus(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(array_keys(self::ORDER_STATUSES))]]);
        $order = RestaurantOrder::query()->with('payment')->where('kode_transaksi', $code)->firstOrFail();
        $next = self::ORDER_STATUSES[$data['status']];
        $transitions = [
            'pending_confirmation' => 'diproses',
            'diproses' => 'siap_disajikan',
            'siap_disajikan' => 'selesai',
        ];

        if (($transitions[$order->status_pesanan] ?? null) !== $next) {
            return response()->json(['message' => 'Status pesanan hanya bisa maju satu tahap.'], 422);
        }
        if ($order->payment?->status_pembayaran !== 'lunas') {
            return response()->json(['message' => 'Konfirmasi pembayaran sebelum pesanan diproses.'], 422);
        }

        $order->update(['status_pesanan' => $next]);

        return response()->json($this->present($order->fresh(['customer', 'items', 'payment'])));
    }

    public function confirmPayment(Request $request, string $code): JsonResponse
    {
        $order = RestaurantOrder::query()->with('payment')->where('kode_transaksi', $code)->firstOrFail();
        $payment = $order->payment;

        if (! $payment || $payment->status_pembayaran === 'lunas') {
            return response()->json(['message' => 'Pembayaran tidak ditemukan atau sudah lunas.'], 422);
        }

        $data = $request->validate([
            'cashReceived' => ['required', 'integer', 'min:'.$payment->jumlah_bayar],
        ]);

        $received = (int) $data['cashReceived'];
        $payment->update([
            'status_pembayaran' => 'lunas',
            'uang_diterima' => $payment->metode_bayar === 'tunai' ? $received : null,
            'kembalian' => $payment->metode_bayar === 'tunai' ? $received - $payment->jumlah_bayar : null,
            'dibayar_pada' => now(),
        ]);
        $order->update(['id_kasir' => $request->user()->id]);

        return response()->json($this->present($order->fresh(['customer', 'items', 'payment'])));
    }

    private function present(RestaurantOrder $order): array
    {
        $order->loadMissing(['customer', 'items', 'payment']);

        return [
            'id' => $order->kode_transaksi,
            'createdAt' => $order->tgl_transaksi?->toISOString(),
            'customer' => $order->customer?->nama_pelanggan ?? 'Pelanggan',
            'phone' => $order->customer?->no_tlp ?? '',
            'service' => $order->jenis_pesanan === 'dine_in' ? 'Dine-in' : 'Takeaway',
            'table' => $order->no_meja ?? 'Takeaway',
            'payment' => $this->paymentLabel($order->payment?->metode_bayar),
            'paymentStatus' => $this->paymentStatusLabel($order->payment?->status_pembayaran, $order->payment?->metode_bayar),
            'items' => $order->items->map(fn (OrderItem $item) => [
                'id' => $item->id_produk,
                'name' => $item->nama_produk,
                'price' => (int) $item->harga_satuan,
                'quantity' => (int) $item->jumlah,
                'note' => $item->catatan ?? '',
            ])->values(),
            'subtotal' => (int) $order->subtotal,
            'tax' => (int) $order->pb1,
            'total' => (int) $order->total_bayar,
            'status' => $this->orderStatusLabel($order->status_pesanan),
            'cashReceived' => $order->payment?->uang_diterima === null ? null : (int) $order->payment->uang_diterima,
            'change' => $order->payment?->kembalian === null ? null : (int) $order->payment->kembalian,
        ];
    }

    private function paymentMethod(string $value): string
    {
        $value = strtolower($value);
        return match (true) {
            str_contains($value, 'tunai') => 'tunai',
            str_contains($value, 'wallet') => 'e_wallet',
            str_contains($value, 'debit') => 'debit',
            str_contains($value, 'kredit') => 'kredit',
            default => 'qris',
        };
    }

    private function paymentLabel(?string $method): string
    {
        return match ($method) {
            'tunai' => 'Tunai / Bayar di Kasir',
            'qris' => 'QRIS',
            'e_wallet' => 'E-Wallet',
            'debit' => 'Debit',
            'kredit' => 'Kredit',
            default => 'Belum dipilih',
        };
    }

    private function paymentStatusLabel(?string $status, ?string $method): string
    {
        return match ($status) {
            'lunas' => 'Lunas',
            'gagal' => 'Gagal',
            'refund' => 'Refund',
            default => $method === 'tunai' ? 'Belum dibayar' : 'Menunggu verifikasi',
        };
    }

    private function orderStatusLabel(string $status): string
    {
        return array_search($status, self::ORDER_STATUSES, true) ?: 'Pending Confirmation';
    }
}
