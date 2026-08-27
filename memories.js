let currentUserId = null;

async function loadMemories() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = user.id;

  const { data: myProfile } = await supabaseClient
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (!myProfile || myProfile.status !== 'approved') {
    document.querySelector('.memories-page').innerHTML = '<p>Kamu harus jadi member yang sudah di-approve buat akses halaman ini.</p>';
    return;
  }

  loadOldPosts();
  loadOldPhotos();
}

function isOnThisDay(dateString) {
  const date = new Date(dateString);
  const today = new Date();

  return date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
    && date.getFullYear() !== today.getFullYear();
}

async function loadOldPosts() {
  const { data: posts, error } = await supabaseClient
    .from('posts')
    .select('*, profiles(full_name, nickname)')
    .order('created_at', { ascending: false });

  const container = document.getElementById('oldPostsList');

  if (error || !posts) {
    container.innerHTML = '<p>Gagal memuat kenangan.</p>';
    return;
  }

  const memories = posts.filter((p) => isOnThisDay(p.created_at));

  if (memories.length === 0) {
    container.innerHTML = '<p>Belum ada kenangan post di tanggal ini dari tahun-tahun sebelumnya.</p>';
    return;
  }

  container.innerHTML = '';

  memories.forEach((post) => {
    const postYear = new Date(post.created_at).getFullYear();
    const yearsAgo = new Date().getFullYear() - postYear;

    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-header">
        <strong>${post.profiles.full_name} (${post.profiles.nickname})</strong>
        <span class="post-date">${yearsAgo} tahun lalu</span>
      </div>
      <p class="post-content">${post.content}</p>
    `;
    container.appendChild(card);
  });
}

async function loadOldPhotos() {
  const { data: photos, error } = await supabaseClient
    .from('gallery')
    .select('*, profiles(full_name, nickname)')
    .order('created_at', { ascending: false });

  const container = document.getElementById('oldPhotosList');

  if (error || !photos) {
    container.innerHTML = '<p>Gagal memuat kenangan foto.</p>';
    return;
  }

  const memories = photos.filter((p) => isOnThisDay(p.created_at));

  if (memories.length === 0) {
    container.innerHTML = '<p>Belum ada kenangan foto di tanggal ini dari tahun-tahun sebelumnya.</p>';
    return;
  }

  container.innerHTML = '';

  memories.forEach((photo) => {
    const photoYear = new Date(photo.created_at).getFullYear();
    const yearsAgo = new Date().getFullYear() - photoYear;

    const card = document.createElement('div');
    card.className = 'gallery-item';
    card.innerHTML = `
      <img src="${photo.image_url}" alt="${photo.caption || 'Foto kenangan'}">
      <p class="gallery-caption">${photo.caption || ''}</p>
      <p class="gallery-uploader">${yearsAgo} tahun lalu · oleh ${photo.profiles.nickname || photo.profiles.full_name}</p>
    `;
    container.appendChild(card);
  });
}

loadMemories();