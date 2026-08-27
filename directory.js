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
  populateFilters(allMembers);
  renderMembers(allMembers);
}

function populateFilters(members) {
  const kelasSet = new Set(members.map((m) => m.kelas));
  const kotaSet = new Set(members.map((m) => m.kota_asal));

  const kelasSelect = document.getElementById('filterKelas');
  kelasSet.forEach((kelas) => {
    const option = document.createElement('option');
    option.value = kelas;
    option.textContent = kelas;
    kelasSelect.appendChild(option);
  });

  const kotaSelect = document.getElementById('filterKota');
  kotaSet.forEach((kota) => {
    const option = document.createElement('option');
    option.value = kota;
    option.textContent = kota;
    kotaSelect.appendChild(option);
  });
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

function applyFilters() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const kelasFilter = document.getElementById('filterKelas').value;
  const kotaFilter = document.getElementById('filterKota').value;

  const filtered = allMembers.filter((m) => {
    const matchKeyword =
      m.full_name.toLowerCase().includes(keyword) ||
      m.kelas.toLowerCase().includes(keyword) ||
      m.domisili.toLowerCase().includes(keyword) ||
      m.kota_asal.toLowerCase().includes(keyword);

    const matchKelas = !kelasFilter || m.kelas === kelasFilter;
    const matchKota = !kotaFilter || m.kota_asal === kotaFilter;

    return matchKeyword && matchKelas && matchKota;
  });

  renderMembers(filtered);
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterKelas').addEventListener('change', applyFilters);
document.getElementById('filterKota').addEventListener('change', applyFilters);

loadDirectory();