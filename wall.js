let currentUserId = null;

async function loadWall() {
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
    document.querySelector('.wall-page').innerHTML = '<p>Kamu harus jadi member yang sudah di-approve buat akses Wall ini.</p>';
    return;
  }

  loadTagOptions();
  loadPosts();
}

async function loadTagOptions() {
  const { data: members } = await supabaseClient
    .from('profiles')
    .select('id, full_name, nickname')
    .eq('status', 'approved');

  const select = document.getElementById('postTags');
  select.innerHTML = '';

  members
    .filter((m) => m.id !== currentUserId)
    .forEach((m) => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.nickname || m.full_name;
      select.appendChild(option);
    });
}

document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const content = document.getElementById('postContent').value;

  const { data: newPost, error } = await supabaseClient
    .from('posts')
    .insert({ author_id: currentUserId, content })
    .select()
    .single();

  if (error) {
    alert('Gagal posting: ' + error.message);
    return;
  }

  const tagSelect = document.getElementById('postTags');
  const taggedIds = Array.from(tagSelect.selectedOptions).map((opt) => opt.value);

  if (taggedIds.length > 0) {
    const tagRows = taggedIds.map((id) => ({ post_id: newPost.id, tagged_user_id: id }));
    await supabaseClient.from('post_tags').insert(tagRows);

    const notifRows = taggedIds.map((id) => ({
      user_id: id,
      message: 'Kamu ditag di sebuah post.',
      link: 'wall.html'
    }));
    await supabaseClient.from('notifications').insert(notifRows);
  }

  document.getElementById('postForm').reset();
  loadPosts();
});

async function loadPosts() {
  const { data: posts, error } = await supabaseClient
    .from('posts')
    .select('*, profiles(full_name, nickname)')
    .order('created_at', { ascending: false });

  const container = document.getElementById('postsList');

  if (error) {
    container.innerHTML = `<p>Gagal memuat wall: ${error.message}</p>`;
    return;
  }

  if (posts.length === 0) {
    container.innerHTML = '<p>Belum ada post. Jadi yang pertama posting yuk!</p>';
    return;
  }

  container.innerHTML = '';

  posts.forEach((post) => {
    const date = new Date(post.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-header">
        <strong>${post.profiles.full_name} (${post.profiles.nickname})</strong>
        <span class="post-date">${date}</span>
      </div>
      <p class="post-content">${post.content}</p>
      <p class="post-tags" data-post-id="${post.id}"></p>

      <button class="like-btn" data-post-id="${post.id}">🤍 <span class="like-count">0</span></button>

      <div class="comments-list" data-post-id="${post.id}"></div>

      <form class="comment-form" data-post-id="${post.id}">
        <input type="text" class="comment-input" placeholder="Tulis komentar..." required>
        <button type="submit">Kirim</button>
      </form>
    `;
    container.appendChild(card);
  });

  posts.forEach((post) => {
    loadComments(post.id);
    loadLikes(post.id);
    loadTags(post.id);
  });

  document.querySelectorAll('.comment-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const postId = form.dataset.postId;
      const input = form.querySelector('.comment-input');
      const content = input.value;

      const { error } = await supabaseClient
        .from('comments')
        .insert({ post_id: postId, author_id: currentUserId, content });

      if (error) {
        alert('Gagal komentar: ' + error.message);
        return;
      }

      input.value = '';
      loadComments(postId);
      notifyPostAuthor(postId);
    });
  });

  document.querySelectorAll('.like-btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleLike(btn.dataset.postId));
  });
}

async function loadTags(postId) {
  const { data: tags, error } = await supabaseClient
    .from('post_tags')
    .select('profiles(full_name, nickname)')
    .eq('post_id', postId);

  const container = document.querySelector(`.post-tags[data-post-id="${postId}"]`);
  if (!container) return;

  if (error || !tags || tags.length === 0) {
    container.textContent = '';
    return;
  }

  const names = tags.map((t) => t.profiles.nickname || t.profiles.full_name);
  container.textContent = `Bareng: ${names.join(', ')}`;
}

async function loadComments(postId) {
  const { data: comments, error } = await supabaseClient
    .from('comments')
    .select('*, profiles(full_name, nickname)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const container = document.querySelector(`.comments-list[data-post-id="${postId}"]`);

  if (error || !comments) {
    container.innerHTML = '<p>Gagal memuat komentar.</p>';
    return;
  }

  container.innerHTML = comments.map((c) => `
    <p class="comment-item"><strong>${c.profiles.nickname || c.profiles.full_name}:</strong> ${c.content}</p>
  `).join('');
}

async function loadLikes(postId) {
  const { data: likes, error } = await supabaseClient
    .from('likes')
    .select('author_id')
    .eq('post_id', postId);

  if (error || !likes) return;

  const btn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
  const alreadyLiked = likes.some((l) => l.author_id === currentUserId);

  btn.innerHTML = `${alreadyLiked ? '❤️' : '🤍'} <span class="like-count">${likes.length}</span>`;
}

async function toggleLike(postId) {
  const { data: existing } = await supabaseClient
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('author_id', currentUserId)
    .maybeSingle();

  if (existing) {
    await supabaseClient.from('likes').delete().eq('id', existing.id);
  } else {
    await supabaseClient.from('likes').insert({ post_id: postId, author_id: currentUserId });
  }

  loadLikes(postId);
}

async function notifyPostAuthor(postId) {
  const { data: post } = await supabaseClient
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (!post || post.author_id === currentUserId) return;

  await supabaseClient.from('notifications').insert({
    user_id: post.author_id,
    message: 'Ada komentar baru di post kamu.',
    link: 'wall.html'
  });
}

loadWall();