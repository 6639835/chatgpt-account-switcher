'use strict';

/* ==========================================================================
   Constants
   ========================================================================== */

const DOMAIN = 'chatgpt.com';

const ICONS = {
  switch: `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  `,
  export: `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  `,
  delete: `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  `,
};

/* ==========================================================================
   DOM Elements
   ========================================================================== */

const elements = {
  accountList: document.getElementById('account-list'),
  emptyState: document.getElementById('empty-state'),
  nameInput: document.getElementById('account-name-input'),
  saveBtn: document.getElementById('save-btn'),
  importBtn: document.getElementById('import-btn'),
  importFileInput: document.getElementById('import-file-input'),
  clearAllBtn: document.getElementById('clear-all-btn'),
};

/* ==========================================================================
   Utility Functions
   ========================================================================== */

/**
 * Execute a function in the context of a tab.
 */
async function executeOnTab(tabId, fn, args = []) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: fn,
    args,
  });
  return results[0]?.result;
}

/**
 * Get the active tab in the current window.
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Check if the current tab is on ChatGPT.
 */
function isChatGPTTab(tab) {
  return tab?.url?.startsWith(`https://${DOMAIN}`);
}

/**
 * Show an error alert if not on ChatGPT.
 */
function requireChatGPTTab(tab) {
  if (!isChatGPTTab(tab)) {
    alert(`Please open ChatGPT (${DOMAIN}) first.`);
    return false;
  }
  return true;
}

/**
 * Get all accounts from storage.
 */
async function getAccounts() {
  const { accounts = {} } = await chrome.storage.local.get(['accounts']);
  return accounts;
}

/**
 * Save accounts to storage.
 */
async function saveAccounts(accounts) {
  await chrome.storage.local.set({ accounts });
}

/**
 * Sanitize a filename by replacing invalid characters.
 */
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, '_');
}

/* ==========================================================================
   Account Operations
   ========================================================================== */

/**
 * Save the current ChatGPT session as a named account.
 */
async function saveCurrentAccount() {
  const name = elements.nameInput.value.trim();

  if (!name) {
    elements.nameInput.focus();
    return;
  }

  const tab = await getActiveTab();
  if (!requireChatGPTTab(tab)) return;

  // Get cookies for the domain
  const cookies = await chrome.cookies.getAll({ domain: DOMAIN });

  // Get storage data from the page
  const storages = await executeOnTab(tab.id, () => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));

  // Save to extension storage
  const accounts = await getAccounts();
  accounts[name] = { cookies, storages };
  await saveAccounts(accounts);

  // Update UI
  renderAccountList(accounts);
  elements.nameInput.value = '';
}

/**
 * Switch to a saved account.
 */
async function switchToAccount(name) {
  const accounts = await getAccounts();
  const accountData = accounts[name];

  if (!accountData) {
    alert('Account data not found.');
    return;
  }

  const tab = await getActiveTab();
  if (!requireChatGPTTab(tab)) return;

  // Clear existing cookies
  const existingCookies = await chrome.cookies.getAll({ domain: DOMAIN });
  await Promise.all(
    existingCookies.map((cookie) =>
      chrome.cookies.remove({
        url: `https://${DOMAIN}${cookie.path}`,
        name: cookie.name,
      })
    )
  );

  // Set new cookies
  await Promise.all(
    accountData.cookies.map((cookie) => {
      const details = {
        url: `https://${DOMAIN}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate,
      };

      // Handle __Host- prefixed cookies specially
      if (cookie.name.startsWith('__Host-')) {
        details.path = '/';
        details.secure = true;
      } else {
        details.domain = cookie.domain;
      }

      return chrome.cookies.set(details);
    })
  );

  // Restore storage data
  await executeOnTab(
    tab.id,
    ({ local, session }) => {
      localStorage.clear();
      sessionStorage.clear();
      Object.entries(local).forEach(([key, value]) => localStorage.setItem(key, value));
      Object.entries(session).forEach(([key, value]) => sessionStorage.setItem(key, value));
    },
    [accountData.storages]
  );

  // Reload the tab
  chrome.tabs.reload(tab.id);
}

/**
 * Delete a saved account.
 */
async function deleteAccount(name) {
  if (!confirm(`Delete account "${name}"?`)) return;

  const accounts = await getAccounts();
  delete accounts[name];
  await saveAccounts(accounts);
  renderAccountList(accounts);
}

/**
 * Export an account to a JSON file.
 */
async function exportAccount(name) {
  const accounts = await getAccounts();
  const accountData = accounts[name];

  if (!accountData) {
    alert('Account data not found.');
    return;
  }

  const exportData = {
    _meta: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      accountName: name,
      domain: DOMAIN,
      instructions: {
        withExtension: 'Import this file using the "Import" button in the extension.',
        withoutExtension: `To use without the extension:
1. COOKIES: Use a cookie editor extension to import the cookies array.
2. STORAGE: Open ${DOMAIN}, open DevTools (F12), go to Console, and run the restoration script.`,
        restorationScript: generateRestorationScript(accountData.storages),
      },
    },
    cookies: accountData.cookies,
    storages: accountData.storages,
  };

  // Create and trigger download
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chatgpt-account-${sanitizeFilename(name)}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a script to restore storage data manually.
 */
function generateRestorationScript(storages) {
  const localEntries = Object.entries(storages.local || {});
  const sessionEntries = Object.entries(storages.session || {});

  const lines = [
    '// Paste this in DevTools Console while on chatgpt.com',
    '(function() {',
    '  localStorage.clear();',
    '  sessionStorage.clear();',
    '',
  ];

  if (localEntries.length > 0) {
    lines.push('  // Restore localStorage');
    localEntries.forEach(([key, value]) => {
      lines.push(`  localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
    });
    lines.push('');
  }

  if (sessionEntries.length > 0) {
    lines.push('  // Restore sessionStorage');
    sessionEntries.forEach(([key, value]) => {
      lines.push(`  sessionStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
    });
    lines.push('');
  }

  lines.push('  console.log("Storage restored! Reloading...");');
  lines.push('  location.reload();');
  lines.push('})();');

  return lines.join('\n');
}

/**
 * Import an account from a JSON file.
 */
function importAccountFromFile(file) {
  const reader = new FileReader();

  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);

      if (!data.cookies || !data.storages) {
        alert('Invalid file format. Missing cookies or storages data.');
        return;
      }

      let name = data._meta?.accountName || '';
      name = prompt('Enter a name for this account:', name);

      if (!name?.trim()) {
        alert('Account name is required.');
        return;
      }

      name = name.trim();
      const accounts = await getAccounts();

      if (accounts[name] && !confirm(`Account "${name}" already exists. Overwrite?`)) {
        return;
      }

      accounts[name] = {
        cookies: data.cookies,
        storages: data.storages,
      };

      await saveAccounts(accounts);
      renderAccountList(accounts);
      alert(`Account "${name}" imported successfully.`);
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to parse file. Please ensure it is a valid JSON export.');
    }
  };

  reader.readAsText(file);
}

/**
 * Clear all saved accounts.
 */
async function clearAllAccounts() {
  if (!confirm('Delete ALL accounts? This cannot be undone.')) return;

  await saveAccounts({});
  renderAccountList({});
}

/* ==========================================================================
   UI Rendering
   ========================================================================== */

/**
 * Render the account list.
 */
function renderAccountList(accounts) {
  const names = Object.keys(accounts);

  // Toggle empty state
  elements.emptyState.hidden = names.length > 0;

  // Clear existing list
  elements.accountList.innerHTML = '';

  // Create account items
  names.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'account-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'account-name';
    nameSpan.textContent = name;
    nameSpan.title = name;

    const actions = document.createElement('div');
    actions.className = 'account-actions';

    // Switch button
    const switchBtn = createIconButton(ICONS.switch, 'Switch to this account', 'btn-icon--switch');
    switchBtn.addEventListener('click', () => switchToAccount(name));

    // Export button
    const exportBtn = createIconButton(ICONS.export, 'Export account');
    exportBtn.addEventListener('click', () => exportAccount(name));

    // Delete button
    const deleteBtn = createIconButton(ICONS.delete, 'Delete account', 'btn-icon--delete');
    deleteBtn.addEventListener('click', () => deleteAccount(name));

    actions.append(switchBtn, exportBtn, deleteBtn);
    li.append(nameSpan, actions);
    elements.accountList.appendChild(li);
  });
}

/**
 * Create an icon button element.
 */
function createIconButton(iconHtml, title, additionalClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn-icon ${additionalClass}`.trim();
  button.title = title;
  button.innerHTML = iconHtml;
  return button;
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */

elements.saveBtn.addEventListener('click', saveCurrentAccount);

elements.importBtn.addEventListener('click', () => {
  elements.importFileInput.click();
});

elements.importFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    importAccountFromFile(file);
    event.target.value = ''; // Reset for re-selection
  }
});

elements.clearAllBtn.addEventListener('click', clearAllAccounts);

// Allow saving with Enter key
elements.nameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    saveCurrentAccount();
  }
});

/* ==========================================================================
   Initialization
   ========================================================================== */

async function init() {
  const accounts = await getAccounts();
  renderAccountList(accounts);
}

init();
