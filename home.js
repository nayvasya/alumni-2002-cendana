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