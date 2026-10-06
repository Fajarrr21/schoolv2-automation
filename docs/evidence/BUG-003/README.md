# BUG-003 — Data office bocor ke HTML list program tahfidz

Severity: **High** (kebocoran data, termasuk field berbentuk hash password).
Ditemukan: element analysis #1 (5 Okt 2026, extension Claude in Chrome, read-only).
Isi data sensitif SENGAJA tidak disalin ke repo ini.

## Lokasi di source (cazh-cards-dashboard, origin/staging)

`resources/views/student-affairs/tahfidz/table-row.blade.php`

```blade
{{-- baris 86 --}}
wire:click="$emit('set_edit_tahfidz', {{ json_encode(array_merge($row->toArray(), ['is_limit_locked' => $row->is_limit_locked])) }} )"
{{-- baris 89 --}}
wire:click="$emit('set_delete_tahfidz', {{ $row }}  )"
```

`$row->toArray()` / `{{ $row }}` ikut men-serialize relasi `offices` yang sudah dimuat,
dan model `App\Models\Office` tidak punya `$hidden`, sehingga seluruh kolom office
terkirim ke browser di setiap baris (±8.500 karakter per baris, ±170 KB untuk 10 baris).

## Cara memverifikasi (tanpa menyalin isinya)

1. Login admin, buka Kesiswaan > Tahfidz (`/student-affairs/tahfidz`).
2. DevTools > Elements, pilih tombol Aksi > Edit pada baris mana pun.
3. Lihat atribut `wire:click` → objek JSON memuat kunci `offices` beserta kolom-kolomnya
   (termasuk field berbentuk hash bcrypt, `main_user_id`, `end_date_support_access`).

Atau di Console (hanya menghitung, tidak menampilkan isi):

```js
[...document.querySelectorAll('a[wire\\:click*="set_edit_tahfidz"]')]
  .map(a => ({ panjang: a.getAttribute('wire:click').length,
               adaOffices: a.getAttribute('wire:click').includes('"offices"') }))
```

## Saran perbaikan

Kirim hanya field yang dibutuhkan form Edit/Hapus, misalnya
`$row->only(['id', 'name', 'office', 'type', 'tahfidz_type', 'target', 'tahfidz_limit', 'description'])`
ditambah `is_limit_locked`, atau cukup kirim `id` lalu muat ulang data di komponen Livewire.
Pertimbangkan juga `$hidden` pada model `Office` untuk kolom sensitif.

<!-- AUTO:START -->
## Evidence otomatis (2026-10-06)

**Judul:** Data office (termasuk field berbentuk hash password) bocor ke HTML list program tahfidz
**TC terkait:** -

Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).

<!-- AUTO:END -->
