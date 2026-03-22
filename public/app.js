const uploadForm = document.getElementById('uploadForm');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const shareLinkInput = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusEl.textContent = 'Uploading...';
  resultEl.classList.add('hidden');

  try {
    const formData = new FormData(uploadForm);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    shareLinkInput.value = data.shareUrl;
    resultEl.classList.remove('hidden');
    statusEl.textContent = 'Upload complete. Share this link.';
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

copyBtn.addEventListener('click', async () => {
  if (!shareLinkInput.value) return;

  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    statusEl.textContent = 'Link copied.';
  } catch (_error) {
    statusEl.textContent = 'Could not copy link automatically. Please copy manually.';
  }
});
