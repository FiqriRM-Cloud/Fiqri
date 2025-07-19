const request = indexedDB.open("warkasDB", 1);

request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction("transaksi", "readonly");
  const store = tx.objectStore("transaksi");
  const req = store.getAll();

  req.onsuccess = () => {
    const data = req.result;
    tampilkanRiwayat(data);
  };
};

function tampilkanRiwayat(data) {
  const container = document.getElementById("daftar-riwayat");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>Belum ada transaksi.</p>";
    return;
  }

  data.reverse().forEach((trx) => {
    const div = document.createElement("div");
    div.style.marginBottom = "20px";

    const tanggal = new Date(trx.tanggal).toLocaleString("id-ID");
    div.innerHTML = `<strong>${tanggal}</strong><br>
     Total: Rp ${trx.total.toLocaleString()}<br>
     Bayar: Rp ${trx.bayar?.toLocaleString() || 0}<br>
     Kembalian: Rp ${trx.kembali?.toLocaleString() || 0}`;

    const ul = document.createElement("ul");
    trx.items.forEach(item => {
      const li = document.createElement("li");
      const subtotal = item.harga * item.qty;
      li.textContent = `${item.nama} (x${item.qty}) - Rp ${subtotal.toLocaleString()}`;
      ul.appendChild(li);
    });

    div.appendChild(ul);
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Ambil data transaksi dari localStorage (atau IndexedDB jika sudah implementasi)
  const data = JSON.parse(localStorage.getItem("transaksiTerakhir"));
  const container = document.getElementById("riwayat-transaksi");

  if (!data) {
    container.innerHTML = "<div class='alert alert-warning'>Belum ada transaksi.</div>";
    return;
  }

  let html = `
    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Kasir</th>
          <th>Produk</th>
          <th>Total</th>
          <th>Bayar</th>
          <th>Kembalian</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${new Date(data.tanggal).toLocaleString("id-ID")}</td>
          <td>${data.kasir}</td>
          <td>
            <ul style="padding-left:16px;">
              ${data.items.map(item => `<li>${item.nama} (${item.qty} x Rp ${item.harga.toLocaleString("id-ID")})</li>`).join("")}
            </ul>
          </td>
          <td>Rp ${data.total.toLocaleString("id-ID")}</td>
          <td>Rp ${data.bayar.toLocaleString("id-ID")}</td>
          <td>Rp ${data.kembali.toLocaleString("id-ID")}</td>
        </tr>
      </tbody>
    </table>
  `;
  container.innerHTML = html;
});
