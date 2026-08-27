let currentUserId = null;

async function loadNotificationsPage() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = user.id;
  loadNotifications();
}

async function loadNotifications() {
  const { data: notifs, error } = await supabaseClient
    .from('notifications')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  const container = document.getElementById('notificationsList');

  if (error) {
    container.innerHTML = `<p>Gagal memuat notifikasi: ${error.message}</p>`;
    return;
  }

  if (notifs.length === 0) {
    container.innerHTML = '<p>Belum ada notifikasi.</p>';
    return;
  }

  container.innerHTML = '';

  notifs.forEach((notif) => {
    const date = new Date(notif.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = notif.is_read ? 'notif-item' : 'notif-item unread';
    card.innerHTML = `
      <p>${notif.message}</p>
      <span class="notif-date">${date}</span>
    `;
    card.addEventListener('click', () => openNotification(notif));
    container.appendChild(card);
  });
}

async function openNotification(notif) {
  if (!notif.is_read) {
    await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notif.id);
  }

  if (notif.link) {
    window.location.href = notif.link;
  } else {
    loadNotifications();
  }
}

loadNotificationsPage();