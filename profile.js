async function loadProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const content = document.getElementById('profileContent');

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const profileId = params.get('id');

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    content.innerHTML = '<p>Profil tidak ditemukan.</p>';
    return;
  }

  content.innerHTML = `
    <h2>${profile.full_name} (${profile.nickname})</h2>
    <p>${profile.kelas} · ${profile.domisili}</p>
    <p><strong>Dulu dikenal sebagai:</strong> ${profile.dikenal_sebagai || '-'}</p>
    <p><strong>Aktivitas:</strong> ${profile.aktivitas || '-'}</p>
    <p><strong>Teman dekat waktu sekolah:</strong> ${profile.teman_dekat || '-'}</p>
    <p><strong>Kenangan paling diingat:</strong> ${profile.kenangan || '-'}</p>
  `;
}

loadProfile();