let currentUserId = null;

async function loadInbox() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = user.id;

  const { data: messages, error } = await supabaseClient
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, nickname), recipient:profiles!messages_recipient_id_fkey(full_name, nickname)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const container = document.getElementById('inboxList');

  if (error) {
    container.innerHTML = `<p>Gagal memuat inbox: ${error.message}</p>`;
    return;
  }

  if (messages.length === 0) {
    container.innerHTML = '<p>Belum ada pesan.</p>';
    return;
  }

  const conversations = new Map();

  messages.forEach((msg) => {
    const isSender = msg.sender_id === currentUserId;
    const partnerId = isSender ? msg.recipient_id : msg.sender_id;
    const partnerProfile = isSender ? msg.recipient : msg.sender;

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partnerId,
        partnerName: partnerProfile.nickname || partnerProfile.full_name,
        lastMessage: msg.content,
        lastDate: msg.created_at,
        unread: !isSender && !msg.is_read
      });
    }
  });

  container.innerHTML = '';

  conversations.forEach((convo) => {
    const date = new Date(convo.lastDate).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = convo.unread ? 'inbox-item unread' : 'inbox-item';
    card.innerHTML = `
      <strong>${convo.partnerName}</strong>
      <p>${convo.lastMessage}</p>
      <span class="inbox-date">${date}</span>
    `;
    card.addEventListener('click', () => {
      window.location.href = `chat.html?with=${convo.partnerId}`;
    });
    container.appendChild(card);
  });
}

loadInbox();