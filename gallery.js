let currentUserId = null;

async function loadGallery() {
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
    document.querySelector('.gallery-page').innerHTML = '<p>Kamu harus jadi member yang sudah di-approve buat akses Galeri ini.</p>';
    return;
  }

  loadPhotos();
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('photoFile');
  const file = fileInput.files[0];
  const caption = document.getElementById('caption').value;

  if (!file) {
    alert('Pilih foto dulu.');
    return;
  }

  const filePath = `${currentUserId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('nostalgia-photos')
    .upload(filePath, file);

  if (uploadError) {
    alert('Gagal upload foto: ' + uploadError.message);
    return;
  }

  const { data: urlData } = supabaseClient.storage
    .from('nostalgia-photos')
    .getPublicUrl(filePath);

  const { error: insertError } = await supabaseClient
    .from('gallery')
    .insert({ uploader_id: currentUserId, image_url: urlData.publicUrl, caption });

  if (insertError) {
    alert('Gagal simpan data foto: ' + insertError.message);
    return;
  }

  document.getElementById('uploadForm').reset();
  loadPhotos();
});

async function loadPhotos() {
  const { data: photos, error } = await supabaseClient
    .from('gallery')
    .select('*, profiles(full_name, nickname)')
    .order('created_at', { ascending: false });

  const container = document.getElementById('galleryGrid');

  if (error) {
    container.innerHTML = `<p>Gagal memuat galeri: ${error.message}</p>`;
    return;
  }

  if (photos.length === 0) {
    container.innerHTML = '<p>Belum ada foto. Upload kenangan pertama yuk!</p>';
    return;
  }

  container.innerHTML = '';

  photos.forEach((photo) => {
    const card = document.createElement('div');
    card.className = 'gallery-item';
    card.innerHTML = `
      <img src="${photo.image_url}" alt="${photo.caption || 'Foto kenangan'}">
      <p class="gallery-caption">${photo.caption || ''}</p>
      <p class="gallery-uploader">oleh ${photo.profiles.nickname || photo.profiles.full_name}</p>
    `;
    container.appendChild(card);
  });
}

loadGallery();