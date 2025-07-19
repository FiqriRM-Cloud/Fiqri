let db;

// Inisialisasi IndexedDB
const request = indexedDB.open("WarKasDB", 2); // Versi 2 agar index "nama" pasti dibuat

request.onupgradeneeded = (event) => {
    db = event.target.result;
    let store;
    if (!db.objectStoreNames.contains("produk")) {
        store = db.createObjectStore("produk", { keyPath: "id" });
    } else {
        store = event.target.transaction.objectStore("produk");
    }
    // Buat index "nama" jika belum ada
    if (!store.indexNames.contains("nama")) {
        store.createIndex("nama", "nama", { unique: true });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    muatProduk();
};

function tambahProduk() {
    if (!navigator.onLine) {
        showAlert('warning', 'Tambah produk hanya bisa dilakukan saat online!');
        return;
    }

    const nama = document.getElementById("nama").value.trim();
    const harga = parseInt(document.getElementById("harga").value);
    const stok = parseInt(document.getElementById("stok").value);

    if (!nama || isNaN(harga) || isNaN(stok) || harga <= 0 || stok < 0) {
        showAlert('warning', 'Mohon isi semua kolom dengan benar!');
        return;
    }

    // Kirim data ke server (URL backend lokal)
    fetch('https://warkas-backend.onrender.com/api/tambah-produk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, harga, stok })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Simpan juga ke IndexedDB agar offline tetap update
            simpanProdukOffline(nama, harga, stok);
            showAlert('success', 'Produk berhasil ditambahkan!');
            document.getElementById("form-tambah").reset();
            muatProduk();
        } else {
            showAlert('error', 'Gagal tambah produk ke server!');
        }
    })
    .catch(() => showAlert('error', 'Gagal terhubung ke server!'));
}

function simpanProdukOffline(nama, harga, stok) {
    const tx = db.transaction("produk", "readwrite");
    const store = tx.objectStore("produk");
    const index = store.index("nama");
    const getReq = index.get(nama);

    getReq.onsuccess = () => {
        let produk = getReq.result;
        if (produk) {
            produk.batches.push({ qty: stok, harga: harga });
            store.put(produk);
        } else {
            produk = {
                id: Date.now(),
                nama: nama,
                batches: [{ qty: stok, harga: harga }]
            };
            store.add(produk);
        }
    };
}

function sinkronkanLaporan() {
    const tx = db.transaction("produk", "readonly");
    const store = tx.objectStore("produk");
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
        const data = getAllReq.result.map(produk => ({
            nama: produk.nama,
            harga: produk.batches[produk.batches.length - 1].harga,
            stok: produk.batches[produk.batches.length - 1].qty
        }));

        // Kirim data ke server (URL backend lokal)
        fetch('https://warkas-backend.onrender.com/api/sinkron-laporan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert('success', 'Laporan berhasil disinkronkan!');
            } else {
                showAlert('error', 'Gagal sinkronkan laporan ke server!');
            }
        })
        .catch(() => showAlert('error', 'Gagal terhubung ke server!'));
    };
}
