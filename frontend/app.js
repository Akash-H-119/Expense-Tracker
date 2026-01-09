const API_BASE = 'http://localhost:4000/api';

// Enhanced fetch with better error handling
async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    throw error;
  }
}

/* ---------- Enhanced Balance API ---------- */
function getBalanceSummary() {
  return fetchJSON(`${API_BASE}/balance-summary`);
}

function getContactBalances() {
  return fetchJSON(`${API_BASE}/contact-balances`);
}

// Replace the existing fetchJSON function
function fetchJSON(url, opts = {}) {
  return fetchWithTimeout(url, opts);
}

/* ---------- Theme persistence ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.documentElement.classList.add('dark');
});

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Add click animation
  const button = event.currentTarget;
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = '';
  }, 150);
  
  // Show subtle notification
  showNotification(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'info', 1500);
}

/* ---------- Helpers ---------- */
function $qs(sel) { return document.querySelector(sel); }
function $qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function formatCurrency(num) {
  const v = Number(num) || 0;
  const absValue = Math.abs(v);
  return (v >= 0 ? '₹' + absValue.toFixed(2) : '-₹' + absValue.toFixed(2));
}

/* ---------- Contacts API ---------- */
function loadContactsIntoSelect(selectEl, includeEmpty = true) {
  fetchJSON(`${API_BASE}/contacts`).then(contacts => {
    selectEl.innerHTML = '';
    if (includeEmpty) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.text = '-- No Contact --';
      selectEl.appendChild(opt);
    }
    contacts.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.text = `${c.name} ${c.phone ? '• ' + c.phone : ''}`;
      selectEl.appendChild(o);
    });
  }).catch(err => {
    console.error('Error loading contacts:', err);
    showNotification('Error loading contacts', 'error');
  });
}

/* ---------- Transactions API ---------- */
function getTransactions() {
  return fetchJSON(`${API_BASE}/transactions`);
}

function getTransaction(id) {
  return fetchJSON(`${API_BASE}/transactions/${id}`);
}

function createTransaction(payload) {
  console.log('Creating transaction:', payload);
  return fetchJSON(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
}

function deleteTransaction(id) {
  return fetchJSON(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
}

/* ---------- Contacts API wrappers ---------- */
function createContact(payload) {
  return fetchJSON(`${API_BASE}/contacts`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
}

function deleteContact(id) {
  return fetchJSON(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
}

/* ---------- Balance API ---------- */
function getBalance() {
  return fetchJSON(`${API_BASE}/balance`);
}

function getContactsWithBalance() {
  return fetchJSON(`${API_BASE}/contacts-with-balance`);
}

/* ---------- Utility for marking incoming/outgoing UI ---------- */
function directionClass(direction) {
  return direction === 'incoming' ? 'tag-incoming' : 'tag-outgoing';
}

/* ---------- Notification System ---------- */
function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notif => notif.remove());

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 12px;
    z-index: 10000;
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 320px;
    word-wrap: break-word;
    border: 1px solid hsl(var(--border) / 0.3);
    backdrop-filter: blur(10px);
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  `;
  
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : 
                    type === 'error' ? 'exclamation-triangle' : 
                    'info'}-circle"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 100);
  
  // Auto remove
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/* ---------- Format Date Helper ---------- */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch (e) {
    return 'Invalid date';
  }
}

// Test server connection
async function testServerConnection() {
  try {
    await fetchJSON(`${API_BASE}/transactions`);
    console.log('✅ Server connection successful');
    return true;
  } catch (error) {
    console.error('❌ Server connection failed:', error);
    showNotification('Cannot connect to server. Make sure backend is running on port 4000.', 'error', 5000);
    return false;
  }
}

// Initialize when app loads
document.addEventListener('DOMContentLoaded', () => {
  testServerConnection();
});