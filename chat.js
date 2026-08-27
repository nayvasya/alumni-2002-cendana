let currentUserId = null;
let partnerId = null;

async function loadChat() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = user.id;

  const params = new URLSearchParams(window.location.search);
  partnerId = params.get('with');

  if (!partnerId) {
    document.querySelector('.chat-page').innerHTML = '<p>Percakapan tidak ditemukan.</p>';
    return;
  }

  const { data: partnerProfile } = await supabaseClient
    .from('profiles')
    .select('full_name, nickname')
    .eq('id', partnerId)
    .single();

  if (partnerProfile) {
    document.getElementById('chatWithName').textContent = partnerProfile.nickname || partnerProfile.full_name;
  }

  loadMessages();
}

async function loadMessages() {
  const { data: messages, error } = await supabaseClient
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`)
    .order('created_at', { ascending: true });

  const container = document.getElementById('chatMessages');

  if (error) {
    container.innerHTML = `<p>Gagal memuat pesan: ${error.message}</p>`;
    return;
  }

  container.innerHTML = '';

  messages.forEach((msg) => {
    const isMine = msg.sender_id === currentUserId;
    const bubble = document.createElement('div');
    bubble.className = isMine ? 'chat-bubble mine' : 'chat-bubble theirs';
    bubble.textContent = msg.content;
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;

  markAsRead(messages);
}

async function markAsRead(messages) {
  const unreadIds = messages
    .filter((m) => m.recipient_id === currentUserId && !m.is_read)
    .map((m) => m.id);

  if (unreadIds.length === 0) return;

  await supabaseClient
    .from('messages')
    .update({ is_read: true })
    .in('id', unreadIds);
}

document.getElementById('chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const input = document.getElementById('chatInput');
  const content = input.value;

  const { error } = await supabaseClient
    .from('messages')
    .insert({ sender_id: currentUserId, recipient_id: partnerId, content });

  if (error) {
    alert('Gagal kirim pesan: ' + error.message);
    return;
  }

  input.value = '';
  loadMessages();
  notifyRecipient();
});

async function notifyRecipient() {
  await supabaseClient.from('notifications').insert({
    user_id: partnerId,
    message: 'Ada pesan baru buat kamu.',
    link: 'inbox.html'
  });
}

loadChat();