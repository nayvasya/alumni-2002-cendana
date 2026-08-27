document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Langkah 1: bikin akun login di Supabase Auth
  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    alert('Gagal daftar: ' + error.message);
    return;
  }

  const userId = data.user.id;

  // Langkah 2: simpan data alumni ke tabel profiles, pakai id yang sama
  const { error: profileError } = await supabaseClient.from('profiles').insert({
    id: userId,
    full_name: document.getElementById('fullName').value,
    nickname: document.getElementById('nickname').value,
    kelas: document.getElementById('kelas').value,
    domisili: document.getElementById('domisili').value,
    kota_asal: document.getElementById('kotaAsal').value,
    whatsapp: document.getElementById('whatsapp').value,
    dikenal_sebagai: document.getElementById('dikenalSebagai').value,
    aktivitas: document.getElementById('aktivitas').value,
    teman_dekat: document.getElementById('temanDekat').value,
    kenangan: document.getElementById('kenangan').value
  });

  if (profileError) {
    alert('Akun dibuat, tapi gagal simpan data profil: ' + profileError.message);
    return;
  }

  alert('Registrasi berhasil! Tunggu approval dari admin ya.');
  window.location.href = 'index.html';
});