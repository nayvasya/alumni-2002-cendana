let allMembers = [];

async function loadDirectory() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const content = document.getElementById('directoryContent');

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const { data: myProfile } = await supabaseClient
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (!myProfile || myProfile.status !== 'approved') {
    content.innerHTML = '<p>Kamu harus jadi member yang sudah di-approve buat lihat directory ini.</p>';
    return;
  }

  const { data: members, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    content.innerHTML = `<p>Gagal memuat data: ${error.message}</p>`;
    return;
  }

  allMembers = members;
  renderMembers(allMembers);
}

function renderMembers(members) {
  const content = document.getElementById('directoryContent');
  content.innerHTML = '';

  members.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.innerHTML = `<h3>${member.full_name} (${member.nickname})</h3><p>${member.kelas} · ${member.domisili}</p>`;
    card.addEventListener('click', () => {
      window.location.href = `profile.html?id=${member.id}`;
    });
    content.appendChild(card);
  });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = allMembers.filter((m) =>
    m.full_name.toLowerCase().includes(keyword) ||
    m.kelas.toLowerCase().includes(keyword) ||
    m.domisili.toLowerCase().includes(keyword) ||
    m.kota_asal.toLowerCase().includes(keyword)
  );
  renderMembers(filtered);
});

loadDirectory();