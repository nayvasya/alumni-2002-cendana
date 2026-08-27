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

document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { data: { user } } = await supabaseClient.auth.getUser();

  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDescription').value;
  const event_date = document.getElementById('eventDate').value;
  const location = document.getElementById('eventLocation').value;

  const { error } = await supabaseClient
    .from('events')
    .insert({ title, description, event_date, location, created_by: user.id });

  if (error) {
    alert('Gagal tambah event: ' + error.message);
    return;
  }

  document.getElementById('eventForm').reset();
  loadEventsAdminList();
  notifyAllMembers(`Event baru: ${title}`);
});

async function loadEventsAdminList() {
  const { data: events, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  const container = document.getElementById('eventAdminList');

  if (error || !events) {
    container.innerHTML = '<p>Gagal memuat event.</p>';
    return;
  }

  container.innerHTML = '';

  events.forEach((event) => {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.innerHTML = `
      <h3>${event.title}</h3>
      <p>${new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · ${event.location || '-'}</p>
      <p>${event.description || ''}</p>
      <button class="delete-event-btn" data-id="${event.id}">Hapus</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.delete-event-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmed = confirm('Yakin mau hapus event ini?');
      if (!confirmed) return;

      const { error } = await supabaseClient.from('events').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal hapus: ' + error.message);
        return;
      }
      loadEventsAdminList();
    });
  });
}

loadEventsAdminList();

async function notifyAllMembers(message) {
  const { data: members } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('status', 'approved');

  if (!members || members.length === 0) return;

  const notifRows = members.map((m) => ({
    user_id: m.id,
    message,
    link: 'events.html'
  }));

  await supabaseClient.from('notifications').insert(notifRows);
}