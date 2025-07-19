// --- Inisialisasi IndexedDB ---
let db;
const request = indexedDB.open("WarKasDB", 1);
let keranjangBelanja = [];

// Handler database
request.onerror = (event) => {
    console.error("Database error: " + event.target.error);
};

request.onsuccess = (event) => {
    db = event.target.result;
    muatProduk();
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("produk")) {
        db.createObjectStore("produk", { keyPath: "id" });
    }
};

// Fungsi untuk memuat produk dari IndexedDB
function muatProduk() {
    const daftarProduk = document.getElementById("daftar-produk");
    daftarProduk.innerHTML = '';

    const tx = db.transaction("produk", "readonly");
    const store = tx.objectStore("produk");
    const request = store.getAll();

    request.onsuccess = () => {
        const produkList = request.result;
        produkList.forEach(item => {
            // Hitung total stok dari semua batch
            const totalStok = item.batches ? item.batches.reduce((sum, b) => sum + b.qty, 0) : 0;
            // Ambil harga batch terakhir (stok terbaru)
            const hargaTerbaru = item.batches && item.batches.length > 0 ? item.batches[item.batches.length - 1].harga : 0;

            const div = document.createElement("div");
            div.className = "product-card";
            div.innerHTML = `
                <h5 class="mb-2">${item.nama}</h5>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-primary fw-bold">Rp ${hargaTerbaru.toLocaleString('id-ID')}</span>
                    <span class="badge bg-secondary">Stok: ${totalStok}</span>
                </div>
                <button class="btn btn-primary w-100" onclick="tambahKeKeranjang(${item.id})"
                    ${totalStok === 0 ? 'disabled' : ''}>
                    <i class="fas fa-plus-circle me-2"></i>Tambah
                </button>
            `;
            daftarProduk.appendChild(div);
        });
    };
}

// Fungsi untuk menambah produk ke keranjang
function tambahKeKeranjang(idProduk) {
    const tx = db.transaction("produk", "readonly");
    const store = tx.objectStore("produk");
    const request = store.get(idProduk);

    request.onsuccess = () => {
        const produk = request.result;
        if (!produk || !produk.batches || produk.batches.length === 0) return;

        // Cari batch pertama yang masih ada qty
        let batchIndex = 0;
        while (batchIndex < produk.batches.length && produk.batches[batchIndex].qty === 0) {
            batchIndex++;
        }
        if (batchIndex >= produk.batches.length) {
            showAlert('warning', 'Stok produk habis!');
            return;
        }

        const batch = produk.batches[batchIndex];
        // Cari di keranjang apakah sudah ada item dengan batch yang sama
        let itemKeranjang = keranjangBelanja.find(item => item.id === idProduk && item.batchIndex === batchIndex);
        if (itemKeranjang) {
            // Pastikan tidak melebihi qty batch
            if (itemKeranjang.jumlah < batch.qty) {
                itemKeranjang.jumlah++;
            } else {
                showAlert('warning', 'Stok batch ini sudah habis!');
            }
        } else {
            keranjangBelanja.push({
                id: produk.id,
                nama: produk.nama,
                harga: batch.harga,
                jumlah: 1,
                batchIndex: batchIndex
            });
        }
        updateKeranjang();
    };
}

// Fungsi untuk mengupdate tampilan keranjang
function updateKeranjang() {
    const keranjangEl = document.getElementById("keranjang");
    if (keranjangEl) keranjangEl.innerHTML = '';

    let total = 0;
    keranjangBelanja.forEach(item => {
        const subtotal = item.harga * item.jumlah;
        total += subtotal;

        const li = document.createElement("li");
        li.className = 'cart-item';
        li.innerHTML = `
            <div>
                <strong>${item.nama}</strong>
                <div class="text-muted">Batch ${item.batchIndex + 1} - Rp ${item.harga.toLocaleString('id-ID')}</div>
            </div>
            <div class="d-flex align-items-center">
                <div class="qty-control me-2">
                    <button class="qty-btn" onclick="ubahJumlah(${item.id}, -1, ${item.batchIndex})">-</button>
                    <span class="mx-2">${item.jumlah}</span>
                    <button class="qty-btn" onclick="ubahJumlah(${item.id}, 1, ${item.batchIndex})">+</button>
                </div>
                <strong>Rp ${subtotal.toLocaleString('id-ID')}</strong>
            </div>
        `;
        if (keranjangEl) keranjangEl.appendChild(li);
    });

    const totalEl = document.getElementById("total");
    if (totalEl) totalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    hitungKembalian();

    // Badge & tombol keranjang
    const badge = document.getElementById("keranjangBadge");
    const btnKeranjang = document.getElementById("btnKeranjang");
    const jumlahItem = keranjangBelanja.reduce((sum, item) => sum + item.jumlah, 0);

    if (badge && btnKeranjang) {
        if (jumlahItem > 0) {
            badge.textContent = jumlahItem;
            badge.style.display = "inline-block";
            btnKeranjang.disabled = false;
        } else {
            badge.style.display = "none";
            btnKeranjang.disabled = true;
            const keranjangPopup = document.getElementById("keranjangPopup");
            if (keranjangPopup) keranjangPopup.style.display = "none";
        }
    }
}

// Fungsi untuk menampilkan notifikasi
function showAlert(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'warning' ? 'alert-warning' : 'alert-danger';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Fungsi untuk mengubah jumlah item di keranjang
function ubahJumlah(idProduk, perubahan, batchIndex) {
    const itemKeranjang = keranjangBelanja.find(item => item.id === idProduk && item.batchIndex === batchIndex);
    if (itemKeranjang) {
        const tx = db.transaction("produk", "readonly");
        const store = tx.objectStore("produk");
        const request = store.get(idProduk);

        request.onsuccess = () => {
            const produk = request.result;
            const batch = produk.batches[batchIndex];
            const jumlahBaru = itemKeranjang.jumlah + perubahan;

            if (jumlahBaru > 0 && jumlahBaru <= batch.qty) {
                itemKeranjang.jumlah = jumlahBaru;
            } else if (jumlahBaru === 0) {
                keranjangBelanja = keranjangBelanja.filter(item => !(item.id === idProduk && item.batchIndex === batchIndex));
            }
            updateKeranjang();
        };
    }
}

// Fungsi untuk menghitung kembalian
function hitungKembalian() {
    const total = parseInt(document.getElementById("total").textContent.replace(/\D/g, ''));
    const bayar = parseInt(document.getElementById("bayar").value) || 0;
    const kembalian = bayar - total;
    const kembalianEl = document.getElementById("kembalian");
    
    // Update display and styling based on kembalian value
    if (kembalian < 0) {
        kembalianEl.textContent = `Rp -${Math.abs(kembalian).toLocaleString('id-ID')}`;
        kembalianEl.className = 'text-danger'; // Change to red for negative values
    } else {
        kembalianEl.textContent = `Rp ${kembalian.toLocaleString('id-ID')}`;
        kembalianEl.className = 'text-success'; // Keep green for positive values
    }
}

// Event listener untuk input pembayaran
document.addEventListener("DOMContentLoaded", function() {
    const bayarInput = document.getElementById("bayar");
    if (bayarInput) {
        bayarInput.addEventListener("input", hitungKembalian);
    }
});

// Fungsi untuk toggle keranjang
function toggleKeranjang() {
    const keranjangPopup = document.getElementById("keranjangPopup");
    keranjangPopup.style.display = keranjangPopup.style.display === "none" ? "block" : "none";
    
    if (isMobileView() && keranjangPopup.style.display === "block") {
      document.getElementById("bayar").focus();
    }
}

// Fungsi untuk menyimpan transaksi
function simpanTransaksi() {
    // Ganti cara ambil kasir
    // const kasir = document.getElementById("kasirSelect").value;
    const kasir = localStorage.getItem("kasirAktif") || "";

    if (!kasir) {
        showAlert('warning', 'Silakan pilih kasir terlebih dahulu!');
        return;
    }

    const total = parseInt(document.getElementById("total").textContent.replace(/\D/g, ''));
    const bayar = parseInt(document.getElementById("bayar").value) || 0;
    
    if (keranjangBelanja.length === 0) {
        showAlert('warning', 'Keranjang belanja kosong!');
        return;
    }

    // Format items for receipt
    const items = keranjangBelanja.map(item => ({
        nama: item.nama,
        qty: item.jumlah,
        harga: item.harga
    }));

    // Prepare transaction data
    const transaksiData = {
        items: items,
        total: total,
        bayar: bayar,
        kembali: bayar - total,
        tanggal: new Date().toISOString(),
        kasir: kasir
    };

    // Save transaction data
    localStorage.setItem('transaksiTerakhir', JSON.stringify(transaksiData));

    // Update stock and finish transaction
    const tx = db.transaction("produk", "readwrite");
    const store = tx.objectStore("produk");

    keranjangBelanja.forEach(item => {
        const request = store.get(item.id);
        request.onsuccess = () => {
            const produk = request.result;
            if (produk.batches && produk.batches[item.batchIndex]) {
                produk.batches[item.batchIndex].qty -= item.jumlah;
                if (produk.batches[item.batchIndex].qty < 0) produk.batches[item.batchIndex].qty = 0;
                store.put(produk);
            }
        };
    });

    // Clear cart and show success message
    keranjangBelanja = [];
    updateKeranjang();
    document.getElementById("bayar").value = '';
    
    // Show appropriate message and open receipt
    if (bayar < total) {
        showAlert('warning', `Transaksi berhasil! Pembayaran kurang Rp ${(total - bayar).toLocaleString('id-ID')}`);
    } else {
        showAlert('success', 'Transaksi berhasil!');
    }
    
    window.open('struk.html', '_blank', 'width=400,height=600');
    
    toggleKeranjang();
    muatProduk();
}

// Fungsi baru 1: Deteksi mobile
function isMobileView() {
  return window.innerWidth <= 768;
}

// Fungsi baru 2: Perbaikan toggle keranjang
function toggleKeranjang() {
  const keranjangPopup = document.getElementById("keranjangPopup");
  keranjangPopup.style.display = keranjangPopup.style.display === "none" ? "block" : "none";
  
  if (isMobileView() && keranjangPopup.style.display === "block") {
    document.getElementById("bayar").focus();
  }
}