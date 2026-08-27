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

  content.innerHTML = `
    <h2>Welcome Home, ${profile.nickname || profile.full_name} 👋</h2>
    <p>Kamu resmi jadi member Alumni Cendana Rumbai 2002.</p>
    <p><em>(Fitur directory, wall, dan lainnya bakal muncul di sini pas step-step berikutnya)</em></p>
  `;
}

loadDashboard();