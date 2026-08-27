async function loadEditProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const content = document.getElementById('editProfileContent');

  if (error || !profile) {
    content.innerHTML = '<p>Gagal memuat profil kamu.</p>';
    return;
  }

  content.innerHTML = `
    <form id="editProfileForm">
      <label for="fullName">Nama lengkap</label>
      <input type="text" id="fullName" value="${profile.full_name || ''}" required>

      <label for="nickname">Nama panggilan</label>
      <input type="text" id="nickname" value="${profile.nickname || ''}" required>

      <label for="kelas">Kelas/jurusan dulu</label>
      <input type="text" id="kelas" value="${profile.kelas || ''}" required>

      <label for="domisili">Domisili sekarang</label>
      <input type="text" id="domisili" value="${profile.domisili || ''}" required>

      <label for="kotaAsal">Kota asal</label>
      <input type="text" id="kotaAsal" value="${profile.kota_asal || ''}" required>

      <label for="whatsapp">Nomor WhatsApp</label>
      <input type="text" id="whatsapp" value="${profile.whatsapp || ''}" required>

      <label for="birthday">Tanggal lahir</label>
      <input type="date" id="birthday" value="${profile.birthday || ''}" required>

      <label for="dikenalSebagai">Dulu dikenal sebagai apa?</label>
      <textarea id="dikenalSebagai">${profile.dikenal_sebagai || ''}</textarea>

      <label for="aktivitas">Aktivitas/ekskul dulu</label>
      <textarea id="aktivitas">${profile.aktivitas || ''}</textarea>

      <label for="temanDekat">Teman dekat waktu sekolah</label>
      <textarea id="temanDekat">${profile.teman_dekat || ''}</textarea>

      <label for="kenangan">Kenangan yang paling diingat</label>
      <textarea id="kenangan">${profile.kenangan || ''}</textarea>

      <button type="submit">Simpan Perubahan</button>
    </form>
    <p><a href="dashboard.html">← Kembali ke Dashboard</a></p>
  `;

  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedProfile = {
      full_name: document.getElementById('fullName').value,
      nickname: document.getElementById('nickname').value,
      kelas: document.getElementById('kelas').value,
      domisili: document.getElementById('domisili').value,
      kota_asal: document.getElementById('kotaAsal').value,
      whatsapp: document.getElementById('whatsapp').value,
      birthday: document.getElementById('birthday').value,
      dikenal_sebagai: document.getElementById('dikenalSebagai').value,
      aktivitas: document.getElementById('aktivitas').value,
      teman_dekat: document.getElementById('temanDekat').value,
      kenangan: document.getElementById('kenangan').value
    };

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update(updatedProfile)
      .eq('id', user.id);

    if (updateError) {
      alert('Gagal simpan: ' + updateError.message);
      return;
    }

    alert('Profil berhasil diupdate!');
    window.location.href = 'dashboard.html';
  });
}

loadEditProfile();