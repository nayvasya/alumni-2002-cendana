let currentUserId = null;

async function loadEventsPage() {
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
    document.querySelector('.events-page').innerHTML = '<p>Kamu harus jadi member yang sudah di-approve buat akses Event ini.</p>';
    return;
  }

  loadEvents();
}

async function loadEvents() {
  const { data: events, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  const container = document.getElementById('eventsList');

  if (error) {
    container.innerHTML = `<p>Gagal memuat event: ${error.message}</p>`;
    return;
  }

  if (events.length === 0) {
    container.innerHTML = '<p>Belum ada event yang dijadwalkan.</p>';
    return;
  }

  container.innerHTML = '';

  events.forEach((event) => {
    const date = new Date(event.event_date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <h3>${event.title}</h3>
      <p class="event-meta">${date} · ${event.location || '-'}</p>
      <p>${event.description || ''}</p>

      <div class="rsvp-summary" data-event-id="${event.id}">Memuat status RSVP...</div>

      <div class="rsvp-buttons" data-event-id="${event.id}">
        <button class="rsvp-btn" data-status="going">Going</button>
        <button class="rsvp-btn" data-status="maybe">Maybe</button>
        <button class="rsvp-btn" data-status="not_attending">Not Attending</button>
      </div>
    `;
    container.appendChild(card);
  });

  events.forEach((event) => loadRsvpStatus(event.id));

  document.querySelectorAll('.rsvp-buttons').forEach((div) => {
    const eventId = div.dataset.eventId;
    div.querySelectorAll('.rsvp-btn').forEach((btn) => {
      btn.addEventListener('click', () => setRsvp(eventId, btn.dataset.status));
    });
  });
}

async function loadRsvpStatus(eventId) {
  const { data: rsvps, error } = await supabaseClient
    .from('event_rsvp')
    .select('member_id, status')
    .eq('event_id', eventId);

  if (error || !rsvps) return;

  const going = rsvps.filter((r) => r.status === 'going').length;
  const maybe = rsvps.filter((r) => r.status === 'maybe').length;
  const myRsvp = rsvps.find((r) => r.member_id === currentUserId);

  const summary = document.querySelector(`.rsvp-summary[data-event-id="${eventId}"]`);
  summary.innerHTML = `${going} akan hadir · ${maybe} mungkin hadir` +
    (myRsvp ? ` · Status kamu: <strong>${myRsvp.status}</strong>` : '');

  const buttonsDiv = document.querySelector(`.rsvp-buttons[data-event-id="${eventId}"]`);
  buttonsDiv.querySelectorAll('.rsvp-btn').forEach((btn) => {
    btn.classList.toggle('active', myRsvp && myRsvp.status === btn.dataset.status);
  });
}

async function setRsvp(eventId, status) {
  const { data: existing } = await supabaseClient
    .from('event_rsvp')
    .select('id')
    .eq('event_id', eventId)
    .eq('member_id', currentUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseClient
      .from('event_rsvp')
      .update({ status })
      .eq('id', existing.id);

    if (error) {
      alert('Gagal RSVP: ' + error.message);
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from('event_rsvp')
      .insert({ event_id: eventId, member_id: currentUserId, status });

    if (error) {
      alert('Gagal RSVP: ' + error.message);
      return;
    }
  }

  loadRsvpStatus(eventId);
}

loadEventsPage();