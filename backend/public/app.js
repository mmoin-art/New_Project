const chatMessages = document.getElementById('chat-messages');
const buttonGrid = document.getElementById('button-grid');
const resetButton = document.getElementById('reset-chat');
const toastContainer = document.getElementById('toast-container');
const primaryButtons = document.querySelectorAll('button[data-intent]');
const yearSpan = document.getElementById('year');

const FALLBACK_OPTIONS = [
  { label: 'Get Started', intent: 'get_started' },
  { label: 'Learn More', intent: 'learn_more' },
  { label: 'Services', intent: 'services' },
  { label: 'Contact Us', intent: 'contact' }
];

const API_ENDPOINT = '/api/chat';

function addMessage(text, sender = 'bot') {
  const li = document.createElement('li');
  li.className = `message ${sender}`;
  li.innerHTML = `
    <span>${text}</span>
    <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  `;
  chatMessages.appendChild(li);
  chatMessages.parentElement.scrollTo({ top: chatMessages.parentElement.scrollHeight, behavior: 'smooth' });
}

function setButtons(options = []) {
  buttonGrid.innerHTML = '';
  const opts = Array.isArray(options) && options.length ? options : FALLBACK_OPTIONS;
  opts.forEach(option => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = option.label;
    btn.dataset.intent = option.intent || 'initial';
    if (option.description) {
      btn.title = option.description;
      btn.setAttribute('aria-label', `${option.label}. ${option.description}`);
    }
    btn.addEventListener('click', () => handleIntent(btn.dataset.intent, option.label));
    buttonGrid.appendChild(btn);
  });
}

async function requestResponse(intent = 'initial', attempt = 1) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent })
    });

    if (!res.ok) {
      throw new Error('Assistant is unavailable. Please try again.');
    }

    const data = await res.json();
    if (!data.message) {
      throw new Error('Empty response received.');
    }
    addMessage(data.message, 'bot');
    setButtons(data.options);
    if (data.toast) {
      showToast(data.toast);
    }
  } catch (err) {
    if (attempt < 3) {
      showToast('Warming up the assistant... retrying.');
      await delay(1000 * attempt);
      return requestResponse(intent, attempt + 1);
    }
    console.error('Chat request failed:', err);
    addMessage(err.message || 'Something went wrong. Restarting to keep things smooth.', 'bot');
    setButtons();
    showToast('We reset the flow so you can keep going.');
  }
}

function handleIntent(intent, label = '') {
  if (!intent) {
    showToast('Pick one of the highlighted actions to continue.');
    return;
  }
  if (label) {
    addMessage(label, 'user');
  }
  requestResponse(intent);
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function restartConversation() {
  chatMessages.innerHTML = '';
  addMessage('Conversation restarted. Let us begin again.', 'bot');
  requestResponse('initial');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

primaryButtons.forEach(btn => {
  btn.addEventListener('click', () => handleIntent(btn.dataset.intent, btn.textContent.trim()));
});

resetButton.addEventListener('click', restartConversation);

yearSpan.textContent = new Date().getFullYear();

addMessage('Loading assistant...', 'bot');
requestResponse('initial');
