async function loadPendingMembers() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    alert('Kamu harus login dulu.');
    window.location.href = 'login.html';
    return;
  }

  const { data: pendingMembers, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('status', 'pending');

  const listContainer = document.getElementById('pendingList');

  if (error) {
    listContainer.innerHTML = `<p>Gagal memuat data: ${error.message}</p>`;
    return;
  }

  if (pendingMembers.length === 0) {
    listContainer.innerHTML = '<p>Tidak ada member yang menunggu approval (atau kamu bukan admin).</p>';
    return;
  }

  listContainer.innerHTML = '';

  pendingMembers.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.innerHTML = `
      <h3>${member.full_name} (${member.nickname})</h3>
      <p>Kelas: ${member.kelas} | Domisili: ${member.domisili}</p>
      <p>WhatsApp: ${member.whatsapp}</p>
      <p><em>"${member.dikenal_sebagai || '-'}"</em></p>
      <div class="pending-actions">
        <button class="approve-btn" data-id="${member.id}">Approve</button>
        <button class="reject-btn" data-id="${member.id}">Reject</button>
      </div>
    `;
    listContainer.appendChild(card);
  });

  document.querySelectorAll('.approve-btn').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'approved'));
  });

  document.querySelectorAll('.reject-btn').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'rejected'));
  });
}

async function updateStatus(memberId, newStatus) {
  const { error } = await supabaseClient
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', memberId);

  if (error) {
    alert('Gagal update status: ' + error.message);
    return;
  }

  alert(`Member berhasil di-${newStatus === 'approved' ? 'approve' : 'reject'}`);
  loadPendingMembers(); // refresh daftar
}

loadPendingMembers();

document.getElementById('newsForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('newsTitle').value;
  const content = document.getElementById('newsContent').value;

  const { error } = await supabaseClient.from('news').insert({ title, content });

  if (error) {
    alert('Gagal tambah berita: ' + error.message);
    return;
  }

  document.getElementById('newsForm').reset();
  loadNewsList();
});

async function loadNewsList() {
  const { data: newsItems, error } = await supabaseClient
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  const container = document.getElementById('newsAdminList');

  if (error || !newsItems) {
    container.innerHTML = '<p>Gagal memuat berita.</p>';
    return;
  }

  container.innerHTML = '';

  newsItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.content}</p>
      <button class="delete-news-btn" data-id="${item.id}">Hapus</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.delete-news-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmed = confirm('Yakin mau hapus berita ini?');
      if (!confirmed) return;

      const { error } = await supabaseClient.from('news').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal hapus: ' + error.message);
        return;
      }
      loadNewsList();
    });
  });
}

loadNewsList();