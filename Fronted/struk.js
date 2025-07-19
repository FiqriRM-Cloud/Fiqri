document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("transaksiTerakhir"));
  if (!data) return;

  // Tampilkan waktu transaksi
  const waktu = new Date(data.tanggal);
  const opsiTanggal = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const opsiWaktu = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById("waktu-transaksi").textContent =
    waktu.toLocaleDateString("id-ID", opsiTanggal) + " " +
    waktu.toLocaleTimeString("id-ID", opsiWaktu);

  // Tampilkan nama kasir
  document.getElementById("nama-kasir").textContent = `Kasir: ${data.kasir}`;

  // Tampilkan daftar item
  const ul = document.getElementById("daftar-struk");
  data.items.forEach(item => {
    const li = tambahItem(item.nama, item.qty, item.harga);
    ul.appendChild(li);
  });

  // Tampilkan total
  document.getElementById("total-struk").textContent = `Rp ${data.total.toLocaleString("id-ID")}`;
  document.getElementById("bayar-struk").textContent = `Rp ${data.bayar.toLocaleString("id-ID")}`;
  document.getElementById("kembalian-struk").textContent = `Rp ${data.kembali.toLocaleString("id-ID")}`;
});

function tambahItem(nama, jumlah, harga) {
  const li = document.createElement('li');
  li.innerHTML = `
        <div class="item-name">${nama}</div>
        <div class="item-details">
            <span>${jumlah} x Rp ${harga.toLocaleString('id-ID')}</span>
            <span>Rp ${(jumlah * harga).toLocaleString('id-ID')}</span>
        </div>
    `;
  return li;
}
