async function loadDashboard() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const content = document.getElementById('dashboardContent');

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    content.innerHTML = '<p>Gagal memuat profil kamu.</p>';
    return;
  }

  if (profile.status !== 'approved') {
    content.innerHTML = `
      <h2>Halo, ${profile.full_name}</h2>
      <p>Akun kamu masih berstatus <strong>${profile.status}</strong>. Tunggu approval dari admin dulu ya sebelum bisa akses member area.</p>
    `;
    return;
  }

  const { count } = await supabaseClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  content.innerHTML = `
    <h2>Welcome Home, ${profile.nickname || profile.full_name} 👋</h2>
    <p>Kamu resmi jadi member Alumni Cendana Rumbai 2002.</p>
    <p><a href="directory.html">Lihat Friends 2002</a> · <a href="wall.html">Buka Wall</a> · <a href="gallery.html">Galeri Nostalgia</a> · <a href="events.html">Event</a> · <a href="notifications.html">Notifikasi${count ? ` (${count})` : ''}</a> · <a href="inbox.html">Inbox</a> · <a href="edit-profile.html">Edit Profil</a> · <a href="memories.html">Memories</a></p>    ${!profile.birthday ? '<p class="birthday-reminder">📅 Tanggal lahir kamu belum diisi — lengkapi di <a href="edit-profile.html">Edit Profil</a> biar temen-temen bisa ngucapin pas ulang tahun kamu!</p>' : ''}

    <div class="birthday-month-section">
      <h3>🎂 Ulang Tahun Bulan Ini</h3>
      <div id="birthdayList"><p>Memuat...</p></div>
    </div>
  `;

  loadBirthdaysThisMonth();
}

async function loadBirthdaysThisMonth() {
  const { data: members, error } = await supabaseClient
    .from('profiles')
    .select('full_name, nickname, birthday')
    .eq('status', 'approved')
    .not('birthday', 'is', null);

  const container = document.getElementById('birthdayList');

  if (error || !members) {
    container.innerHTML = '<p>Gagal memuat data ulang tahun.</p>';
    return;
  }

  const currentMonth = new Date().getMonth() + 1;

  const birthdaysThisMonth = members
    .filter((m) => {
      const birthMonth = parseInt(m.birthday.split('-')[1], 10);
      return birthMonth === currentMonth;
    })
    .sort((a, b) => {
      const dayA = parseInt(a.birthday.split('-')[2], 10);
      const dayB = parseInt(b.birthday.split('-')[2], 10);
      return dayA - dayB;
    });

  if (birthdaysThisMonth.length === 0) {
    container.innerHTML = '<p>Gak ada yang ulang tahun bulan ini.</p>';
    return;
  }

  container.innerHTML = birthdaysThisMonth.map((m) => {
    const day = parseInt(m.birthday.split('-')[2], 10);
    return `<p>🎉 <strong>${day}</strong> — ${m.nickname || m.full_name}</p>`;
  }).join('');
}

loadDashboard();