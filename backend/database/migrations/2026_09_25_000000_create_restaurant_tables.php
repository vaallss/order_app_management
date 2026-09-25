<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pelanggan')) {
            Schema::create('pelanggan', function (Blueprint $table) {
                $table->id('id_pelanggan');
                $table->string('nama_pelanggan', 150);
                $table->string('no_tlp', 25)->index();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('produk')) {
            Schema::create('produk', function (Blueprint $table) {
                $table->id('id_produk');
                $table->string('nama_produk', 150);
                $table->enum('kategori', ['makanan_utama', 'appetizer', 'minuman']);
                $table->text('deskripsi')->nullable();
                $table->string('foto_url', 500)->nullable();
                $table->unsignedBigInteger('harga');
                $table->unsignedInteger('stok')->default(0);
                $table->boolean('aktif')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('transaksi')) {
            Schema::create('transaksi', function (Blueprint $table) {
                $table->id('id_transaksi');
                $table->string('kode_transaksi', 30)->unique();
                $table->foreignId('id_pelanggan')->nullable()->constrained('pelanggan', 'id_pelanggan')->nullOnDelete();
                $table->foreignId('id_kasir')->nullable()->constrained('users')->nullOnDelete();
                $table->enum('jenis_pesanan', ['dine_in', 'takeaway']);
                $table->string('no_meja', 20)->nullable();
                $table->timestamp('tgl_transaksi')->useCurrent()->index();
                $table->unsignedBigInteger('subtotal');
                $table->unsignedBigInteger('pb1')->default(0);
                $table->unsignedBigInteger('total_bayar');
                $table->enum('status_pesanan', [
                    'pending_confirmation', 'diproses', 'siap_disajikan', 'selesai', 'dibatalkan',
                ])->default('pending_confirmation')->index();
                $table->text('catatan')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('detail_transaksi')) {
            Schema::create('detail_transaksi', function (Blueprint $table) {
                $table->id('id_detail');
                $table->foreignId('id_transaksi')->constrained('transaksi', 'id_transaksi')->restrictOnDelete();
                $table->foreignId('id_produk')->constrained('produk', 'id_produk')->restrictOnDelete();
                $table->string('nama_produk', 150);
                $table->unsignedBigInteger('harga_satuan');
                $table->unsignedInteger('jumlah');
                $table->string('catatan', 500)->nullable();
                $table->unsignedBigInteger('subtotal_item');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('pembayaran')) {
            Schema::create('pembayaran', function (Blueprint $table) {
                $table->id('id_pembayaran');
                $table->foreignId('id_transaksi')->unique()->constrained('transaksi', 'id_transaksi')->restrictOnDelete();
                $table->enum('metode_bayar', ['tunai', 'qris', 'e_wallet', 'debit', 'kredit']);
                $table->enum('status_pembayaran', ['menunggu', 'lunas', 'gagal', 'refund'])->default('menunggu');
                $table->unsignedBigInteger('jumlah_bayar');
                $table->unsignedBigInteger('uang_diterima')->nullable();
                $table->unsignedBigInteger('kembalian')->nullable();
                $table->string('no_referensi', 100)->nullable();
                $table->timestamp('dibayar_pada')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Preserve tables that may have been created manually before this migration.
    }
};
