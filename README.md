# ChatGPT Account Switcher

![License](https://img.shields.io/github/license/6639835/chatgpt-account-switcher?style=flat-square)
![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)
![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?style=flat-square)
![Made with JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=000)

A lightweight Chrome extension that lets you save, switch, and export multiple ChatGPT sessions in seconds. Ideal for users who manage personal, work, or client accounts and want fast, reliable context changes without logging in and out.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## Features

- Save the current ChatGPT session as a named account
- One-click account switching by restoring cookies and storage
- Export accounts to JSON for backup or transfer
- Import accounts from JSON with overwrite protection
- Clear-all action with confirmation safeguards

## Quick Start

### Prerequisites

- Google Chrome or Chromium-based browser
- Access to `https://chatgpt.com/`

### Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension for quick access.

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Build for Distribution

```bash
# Build to dist/ folder
npm run build

# Build and create zip for Chrome Web Store
npm run package
```

### Project Structure

```
chatgpt-account-switcher/
├── icons/              # Extension icons (16, 48, 128px)
├── scripts/            # Build scripts
├── manifest.json       # Chrome extension manifest (MV3)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic and account management
├── popup.css           # Popup styles
├── package.json        # Node.js dependencies and scripts
├── eslint.config.js    # ESLint configuration
├── .prettierrc         # Prettier configuration
├── .editorconfig       # Editor configuration
├── CHANGELOG.md        # Version history
├── LICENSE             # MIT License
└── README.md           # This file
```

## Usage

### Save the current account

1. Open ChatGPT in a tab.
2. Enter a name in the extension popup.
3. Click **Save Current Account**.

### Switch accounts

Click the **switch** icon next to a saved account to restore its cookies and storage, then reload the ChatGPT tab.

### Export an account

Click the **export** icon to download a JSON file with cookies and storage data.

### Import an account

Click **Import** and select a JSON export created by the extension.

```json
{
  "_meta": {
    "version": "1.0",
    "exportedAt": "2024-01-01T00:00:00.000Z",
    "accountName": "Work",
    "domain": "chatgpt.com"
  },
  "cookies": [],
  "storages": {
    "local": {},
    "session": {}
  }
}
```

## Configuration

This extension has no runtime settings UI. If you need to adjust supported domains, update the `ALLOWED_DOMAINS` list in `popup.js`.

## Contributing

Contributions are welcome.

1. Fork the repo and create your branch: `git checkout -b feature/my-change`
2. Make your changes and test in `chrome://extensions`
3. Commit and push your branch
4. Open a pull request with a clear description

## Authors

- Maintainer: Your Name (replace with your handle)

## License

This project is licensed under the terms of the [MIT License](LICENSE).
