async function loadLatestNews() {
  const { data: newsItems, error } = await supabaseClient
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  const newsList = document.getElementById('newsList');

  if (error || !newsItems || newsItems.length === 0) {
    newsList.innerHTML = '<p>Belum ada berita.</p>';
    return;
  }

  newsList.innerHTML = '';

  newsItems.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const article = document.createElement('article');
    article.className = 'news-item';
    article.innerHTML = `
      <span class="news-date">${date}</span>
      <h3>${item.title}</h3>
      <p>${item.content}</p>
    `;
    newsList.appendChild(article);
  });
}

loadLatestNews();

async function loadKasSummary() {
  const { data: transactions, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (error || !transactions || transactions.length === 0) return;

  const pemasukan = transactions.filter((t) => t.type === 'pemasukan');
  const pengeluaran = transactions.filter((t) => t.type === 'pengeluaran');
  const saldo = pemasukan.reduce((s, t) => s + t.amount, 0) - pengeluaran.reduce((s, t) => s + t.amount, 0);

  document.querySelector('.kas-card').innerHTML = `
    <div class="kas-stat"><span class="kas-label">Saldo Kas</span><span class="kas-value">Rp ${saldo.toLocaleString('id-ID')}</span></div>
    <div class="kas-stat"><span class="kas-label">Pemasukan Terakhir</span><span class="kas-value">Rp ${(pemasukan[0]?.amount || 0).toLocaleString('id-ID')}</span></div>
    <div class="kas-stat"><span class="kas-label">Pengeluaran Terakhir</span><span class="kas-value">Rp ${(pengeluaran[0]?.amount || 0).toLocaleString('id-ID')}</span></div>
  `;
}

loadKasSummary();