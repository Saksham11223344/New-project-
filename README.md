# Secure Media Share

A simple website to upload **image / video / audio** files, encrypt them on the server, and generate shareable view links.

## Features

- Upload image, video, or audio files (up to 100MB).
- AES-256-GCM encryption at rest on the server.
- Unique share link per upload.
- Viewer page streams media inline.
- Hides common download controls (`controlsList="nodownload"`) and disables right-click on media.

> Important: there is no perfect "no-download" on the web. This app removes obvious UI download options, but determined users can still capture media.

## Run locally

```bash
npm install
npm start
```

Then open:

- `http://localhost:3000` to upload files.
- Share generated links like `http://localhost:3000/view/<id>`.

## Security note

Set a strong secret in production:

```bash
ENCRYPTION_SECRET="a-long-random-secret" npm start
```

The same secret is required to decrypt previously uploaded files.
