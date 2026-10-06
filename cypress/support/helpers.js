// helpers.js — utilitas murni (tanpa state) yang dipakai lintas POM & spec.
//
// V2 = Laravel + Blade + Livewire v2 + Bootstrap 5 (tema Metronic). BUKAN
// shadcn/Radix seperti V3: tidak ada data-slot, svg.lucide-*, atau toast Sonner.
//
// Semua fungsi di sini deterministik & bebas efek samping supaya aman dipakai
// di dalam .should(callback) yang sinkron.

/** Modal Bootstrap yang sedang terbuka (class `show` dipasang Bootstrap). */
export const MODAL_OPEN = '.modal.show';

/**
 * Regex exact-match (abaikan spasi tepi). Wajib dipakai untuk memilih opsi /
 * label supaya "Juz 1" tidak ikut match "Juz 16", dan "Ayat 5" tidak match
 * "Ayat 50".
 */
export const rx = (text) =>
  new RegExp(`^\\s*${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

/**
 * Container sebuah field berdasarkan teks <label>-nya, di dalam scope.
 *
 * Di V2 label selalu anak LANGSUNG dari container field-nya (crosschecked
 * source staging member-detail.blade.php):
 *   Tanggal / Deskripsi / Capaian Hafalan -> <div class="fv-row"> <label> ...
 *   Pilih Juz / Halaman / Surah           -> <div class="col-* mb-4"> <label> ...
 *   Dari Ayat / Sampai Ayat               -> <div class="col-md-5"> <label> ...
 * jadi `.parent()` dari label = container field. Label-scoped, bukan posisi.
 */
export const formItem = (label, scope = MODAL_OPEN) =>
  cy.contains(`${scope} label`, rx(label)).parent();

/**
 * Generator penanda rerun-safe: QA<6 digit terakhir timestamp><seq 2 digit>.
 * Dipakai untuk field Deskripsi riwayat (penanda cleanup).
 *
 *   const uniq = makeUniq('QA')
 *   uniq()  // QA48211201
 */
export const makeUniq = (prefix = 'QA') => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  return () => `${prefix}${ts}${String(++seq).padStart(2, '0')}`;
};

/** Teks ter-normalisasi (spasi beruntun -> satu spasi, trim). */
export const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

// ===========================================================================
// FORMAT CAPAIAN — "ayat 1-3, 7, 10"
// ===========================================================================
// Aturan DoD "Penulisan capaian": nomor berurutan digabung jadi rentang, yang
// loncat dipisah koma; rentang 1-10 HANYA dipakai bila seluruh ayatnya memang
// tercatat. Port dari TahfidzUnit::compactNumbers() (source staging), dipakai
// spec untuk menyusun EXPECTED dari data uji — bukan menyalin teks dari layar.

/**
 * [3, 1, 2, 7, 10] -> "1-3, 7, 10". Duplikat dibuang, urut numerik.
 * @param {Array<number|string>} numbers
 */
export const compactNumbers = (numbers) => {
  const ns = [...new Set((numbers || []).map((n) => parseInt(n, 10)))]
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (!ns.length) return '';
  const out = [];
  let start = ns[0];
  let end = ns[0];
  for (const n of ns.slice(1)) {
    if (n === end + 1) {
      end = n;
      continue;
    }
    out.push(start === end ? `${start}` : `${start}-${end}`);
    start = end = n;
  }
  out.push(start === end ? `${start}` : `${start}-${end}`);
  return out.join(', ');
};

/**
 * Penulisan capaian satu riwayat.
 *
 * @param {Array<{no:number, nama:string, ayat:number[]}>} surat  urutan bebas;
 *        diurutkan ulang mengikuti urutan mushaf (nomor surat).
 * @param {object} opts
 * @param {string} opts.template  pola per surat, default PRD "QS. {surat} ayat {ayat}".
 *        Ambil dari fixture (tahfidz.json -> format.capaianPerSurat) supaya
 *        kalau PM memutuskan pola lain, cukup satu baris yang diubah.
 * @param {number} [opts.max]     batasi jumlah surat (list = 2) lalu tambah "+n surat".
 *        Tanpa max = ditulis lengkap (export).
 */
export const formatCapaian = (surat, { template = 'QS. {surat} ayat {ayat}', max } = {}) => {
  const parts = [...surat]
    .sort((a, b) => a.no - b.no)
    .map((s) => template.replace('{surat}', s.nama).replace('{ayat}', compactNumbers(s.ayat)));
  if (max && parts.length > max) {
    return `${parts.slice(0, max).join(', ')} +${parts.length - max} surat`;
  }
  return parts.join(', ');
};

/** [1..n] inklusif — pembantu data uji rentang ayat. */
export const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ===========================================================================
// DATA UJI TAHFIDZ
// ===========================================================================

/** Kunci satuan ayat "surah:ayat" (format value checkbox & wire:key di V2). */
export const key = (surah, ayat) => `${surah}:${ayat}`;

/** ["19:1", "19:2", ...] untuk ayat from..to pada satu surah. */
export const keys = (surah, from, to) => range(from, to).map((a) => key(surah, a));

/** Urutkan kunci ayat mengikuti urutan mushaf (surah lalu ayat, numerik). */
export const sortKeys = (list) =>
  [...list].sort((a, b) => {
    const [sa, aa] = a.split(':').map(Number);
    const [sb, ab] = b.split(':').map(Number);
    return sa - sb || aa - ab;
  });

/** Kunci ayat -> struktur formatCapaian: [{no, nama, ayat:[...]}]. */
export const keysToSurat = (list, surahMap) => {
  const by = {};
  list.forEach((k) => {
    const [s, a] = k.split(':').map(Number);
    (by[s] = by[s] || []).push(a);
  });
  return Object.keys(by).map((s) => ({ no: Number(s), nama: surahMap[s].nama, ayat: by[s] }));
};

/** Tanggal hari ini (zona waktu browser/mesin) format yyyy-mm-dd untuk input date. */
export const hariIni = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/**
 * Persentase seperti Helpers::formatPercentage (source staging): bulat -> tanpa
 * desimal, selain itu 2 desimal. round() di PHP = 2 desimal lebih dulu.
 */
export const formatPersen = (done, total) => {
  if (!total) return '0';
  const p = Math.round((done / total) * 100 * 100) / 100;
  return Number.isInteger(p) ? String(p) : p.toFixed(2);
};

/** "5.13% (20 dari 390 ayat)" — pola dari fixture format.pencapaian. */
export const formatPencapaian = (done, total, satuan, pola = '{persen}% ({done} dari {total} {satuan})') =>
  pola
    .replace('{persen}', formatPersen(done, total))
    .replace('{done}', done)
    .replace('{total}', total)
    .replace('{satuan}', satuan);

/** Isi template "{n} ayat ditambahkan." dengan nilai. */
export const fill = (tpl, vals) =>
  Object.keys(vals).reduce((s, k) => s.split(`{${k}}`).join(vals[k]), tpl);

/** Path route dari template "/x/{tahfidzId}/member/{memberId}". */
export const route = (tpl, vals) => fill(tpl, vals);

/**
 * Blok `staging` fixture tahfidz.json. FAIL-FAST: kalau data QA wajib belum
 * diisi, lempar error yang jelas (bukan error selector yang menyesatkan).
 *
 * @param {object} fx       isi tahfidz.json
 * @param {string[]} wajib  nama program wajib, default programUtama + programSurahAyat
 */
export const stagingData = (fx, wajib = ['programUtama', 'programSurahAyat']) => {
  const s = (fx && fx.staging) || {};
  const kurang = [];
  if (!s.siswa || !s.siswa.id) kurang.push('staging.siswa.id');
  wajib.forEach((p) => {
    if (!s[p] || !s[p].id) kurang.push(`staging.${p}.id`);
  });
  if (kurang.length) {
    throw new Error(
      [
        'DATA QA BELUM LENGKAP di cypress/fixtures/tahfidz.json:',
        ...kurang.map((k) => `  - ${k}`),
        'Isi dengan program/siswa KHUSUS QA (lihat sheet "Data Uji" di docs/test-cases).',
        'Jangan pakai program atau siswa milik tim lain.',
      ].join('\n'),
    );
  }
  return s;
};

/**
 * Untuk data OPSIONAL (PRG-J/H/S, RS): kalau belum ada, test di-skip (Blocked)
 * dengan alasan di log. Panggil di dalam `function () {}` (butuh `this`).
 */
export const perluData = (ctx, ada, alasan) => {
  if (!ada) {
    Cypress.log({ name: 'BLOCKED', message: alasan });
    ctx.skip();
  }
};
