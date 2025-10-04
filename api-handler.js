// api-handler.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dataForm');
  const submitBtn = document.getElementById('submitBtn');
  const hasilAnalisisDiv = document.getElementById('hasilAnalisis');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menganalisis...';
    hasilAnalisisDiv.innerHTML = '<p>Mohon tunggu, data sedang diproses...</p>';

    const data = {
      nama: document.getElementById('namaAnak').value,
      umur: document.getElementById('umur').value,
      jenisKelamin: document.getElementById('jenisKelamin').value,
      beratBadan: document.getElementById('beratBadan').value,
      tinggiBadan: document.getElementById('tinggiBadan').value,
      lingkarKepala: document.getElementById('lingkarKepala').value,
    };

    try {
      const response = await fetch('http://localhost:3000/generate-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Server returned an error.');

      const result = await response.json();
      hasilAnalisisDiv.innerHTML = result.result.replace(/\n/g, '<br>');

    } catch (error) {
      hasilAnalisisDiv.innerHTML = `<p style="color: red;">Terjadi kesalahan: ${error.message}</p>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Hitung & Lihat Hasil';
    }
  });
});