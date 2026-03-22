function getIdFromPath() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1];
}

function createMediaElement(mimeType, streamUrl) {
  let element;
  if (mimeType.startsWith('image/')) {
    element = document.createElement('img');
  } else if (mimeType.startsWith('video/')) {
    element = document.createElement('video');
    element.controls = true;
  } else if (mimeType.startsWith('audio/')) {
    element = document.createElement('audio');
    element.controls = true;
  } else {
    throw new Error('Unsupported media type.');
  }

  element.src = streamUrl;
  element.setAttribute('controlsList', 'nodownload noplaybackrate');
  element.setAttribute('disablePictureInPicture', 'true');
  element.addEventListener('contextmenu', (e) => e.preventDefault());
  return element;
}

async function loadMedia() {
  const id = getIdFromPath();
  const viewerRoot = document.getElementById('viewerRoot');
  const status = document.getElementById('viewerStatus');

  try {
    const metaResponse = await fetch(`/api/media/${id}/meta`);
    const meta = await metaResponse.json();

    if (!metaResponse.ok) {
      throw new Error(meta.error || 'Media not found.');
    }

    const streamUrl = `/api/media/${id}/stream`;
    const mediaElement = createMediaElement(meta.mimeType, streamUrl);
    viewerRoot.appendChild(mediaElement);
    status.textContent = `File: ${meta.originalName}`;
  } catch (error) {
    status.textContent = error.message;
  }
}

loadMedia();
