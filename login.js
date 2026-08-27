document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Gagal login: ' + error.message);
    return;
  }

  alert('Login berhasil! Selamat datang kembali.');
  window.location.href = 'dashboard.html';
});