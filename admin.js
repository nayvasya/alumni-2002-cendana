async function loadPendingMembers() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    alert('Kamu harus login dulu.');
    window.location.href = 'login.html';
    return;
  }

  const { data: pendingMembers, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('status', 'pending');

  const listContainer = document.getElementById('pendingList');

  if (error) {
    listContainer.innerHTML = `<p>Gagal memuat data: ${error.message}</p>`;
    return;
  }

  if (pendingMembers.length === 0) {
    listContainer.innerHTML = '<p>Tidak ada member yang menunggu approval (atau kamu bukan admin).</p>';
    return;
  }

  listContainer.innerHTML = '';

  pendingMembers.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.innerHTML = `
      <h3>${member.full_name} (${member.nickname})</h3>
      <p>Kelas: ${member.kelas} | Domisili: ${member.domisili}</p>
      <p>WhatsApp: ${member.whatsapp}</p>
      <p><em>"${member.dikenal_sebagai || '-'}"</em></p>
      <div class="pending-actions">
        <button class="approve-btn" data-id="${member.id}">Approve</button>
        <button class="reject-btn" data-id="${member.id}">Reject</button>
      </div>
    `;
    listContainer.appendChild(card);
  });

  document.querySelectorAll('.approve-btn').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'approved'));
  });

  document.querySelectorAll('.reject-btn').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'rejected'));
  });
}

async function updateStatus(memberId, newStatus) {
  const { error } = await supabaseClient
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', memberId);

  if (error) {
    alert('Gagal update status: ' + error.message);
    return;
  }

  alert(`Member berhasil di-${newStatus === 'approved' ? 'approve' : 'reject'}`);
  loadPendingMembers(); // refresh daftar
}

loadPendingMembers();