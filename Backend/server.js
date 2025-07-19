const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simpan data di memori (untuk demo, gunakan database untuk produksi)
let produkList = [];
let laporanList = [];

// Endpoint tambah produk (POST)
app.post('/api/tambah-produk', (req, res) => {
    const { nama, harga, stok } = req.body;
    if (!nama || !harga || !stok) {
        return res.json({ success: false, message: 'Data tidak lengkap!' });
    }
    // Cek produk sudah ada
    let produk = produkList.find(p => p.nama === nama);
    if (produk) {
        produk.batches.push({ qty: stok, harga: harga });
    } else {
        produk = {
            id: Date.now(),
            nama: nama,
            batches: [{ qty: stok, harga: harga }]
        };
        produkList.push(produk);
    }
    res.json({ success: true });
});

// Endpoint ambil produk terbaru (GET)
app.get('/api/produk-terbaru', (req, res) => {
    res.json(produkList);
});

// Endpoint sinkron laporan penjualan (POST)
app.post('/api/sinkron-laporan', (req, res) => {
    const laporan = req.body;
    if (!Array.isArray(laporan)) {
        return res.json({ success: false, message: 'Format data salah!' });
    }
    laporanList = laporanList.concat(laporan);
    res.json({ success: true });
});

// Endpoint ambil laporan penjualan (GET)
app.get('/api/laporan', (req, res) => {
    res.json(laporanList);
});

// Jalankan server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`WarKas backend running at http://localhost:${PORT}`);
});