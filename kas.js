function formatRupiah(number) {
  return 'Rp ' + number.toLocaleString('id-ID');
}

async function loadKas() {
  const { data: transactions, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (error || !transactions) {
    document.getElementById('kasSummary').innerHTML = '<p>Gagal memuat data kas.</p>';
    return;
  }

  const pemasukan = transactions.filter((t) => t.type === 'pemasukan');
  const pengeluaran = transactions.filter((t) => t.type === 'pengeluaran');

  const totalPemasukan = pemasukan.reduce((sum, t) => sum + t.amount, 0);
  const totalPengeluaran = pengeluaran.reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  document.getElementById('kasSummary').innerHTML = `
    <div class="kas-stat">
      <span class="kas-label">Saldo Kas</span>
      <span class="kas-value">${formatRupiah(saldo)}</span>
    </div>
    <div class="kas-stat">
      <span class="kas-label">Total Pemasukan</span>
      <span class="kas-value">${formatRupiah(totalPemasukan)}</span>
    </div>
    <div class="kas-stat">
      <span class="kas-label">Total Pengeluaran</span>
      <span class="kas-value">${formatRupiah(totalPengeluaran)}</span>
    </div>
  `;

  fillTable('pemasukanTable', pemasukan);
  fillTable('pengeluaranTable', pengeluaran);
}

function fillTable(tableId, rows) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.transaction_date}</td><td>${row.description}</td><td>${formatRupiah(row.amount)}</td>`;
    tbody.appendChild(tr);
  });
}

loadKas();