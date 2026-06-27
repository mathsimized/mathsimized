const API_BASE = window.location.origin === 'file://' ? 'http://localhost:5050' : '';

let chatHistory = [];
let currentModel = 'qwen2.5:1.5b';
let availableModels = [];
let isStreaming = false;
let abortController = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (!user) {
        document.getElementById('chatContainer').innerHTML = `
          <div class="empty-state">
            <div style="font-size:3rem;margin-bottom:16px;">🔒</div>
            <h3>Please Login</h3>
            <p>Login to use the AI Study Assistant.</p>
            <a href="./login.html" class="btn btn-primary" style="margin-top:16px;">Login</a>
          </div>
        `;
        document.getElementById('chatInputArea').style.display = 'none';
      } else {
        document.getElementById('chatInputArea').style.display = '';
        initChat();
      }
    });
  } else {
    initChat();
  }
});

async function initChat() {
  await loadModels();
  setupEventListeners();
  addMessage('assistant', 'Hello! I am your AI Study Assistant. Ask me any math question, upload an image or document, and I will help you understand it step by step.');
  document.getElementById('modelSelect').value = currentModel;
}

async function loadModels() {
  try {
    const r = await fetch(`${API_BASE}/api/models`);
    const data = await r.json();
    availableModels = data.models || [];

    const select = document.getElementById('modelSelect');
    select.innerHTML = '';

    const textModels = availableModels.filter(m => !m.vision);
    const visionModels = availableModels.filter(m => m.vision);

    if (textModels.length) {
      const optGroup = document.createElement('optgroup');
      optGroup.label = 'Text Models';
      textModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name;
        optGroup.appendChild(opt);
      });
      select.appendChild(optGroup);
    }

    if (visionModels.length) {
      const optGroup = document.createElement('optgroup');
      optGroup.label = 'Vision Models';
      visionModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name;
        optGroup.appendChild(opt);
      });
      select.appendChild(optGroup);
    }

    if (availableModels.length && !availableModels.find(m => m.name === currentModel)) {
      currentModel = availableModels[0].name;
    }
    select.value = currentModel;
  } catch (e) {
    console.error('Failed to load models:', e);
  }
}

function setupEventListeners() {
  document.getElementById('modelSelect').addEventListener('change', e => {
    currentModel = e.target.value;
  });

  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.getElementById('imageBtn').addEventListener('click', () => {
    document.getElementById('imageInput').click();
  });
  document.getElementById('imageInput').addEventListener('change', handleImageUpload);

  document.getElementById('fileBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

async function sendMessage() {
  if (isStreaming) return;

  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  addMessage('user', message);

  const model = availableModels.find(m => m.name === currentModel);
  const isVision = model && model.vision;

  if (isVision && document.getElementById('imagePreview').dataset.image) {
    await sendWithImage(message);
  } else {
    await sendTextOnly(message);
  }
}

async function sendTextOnly(message) {
  setLoading(true);

  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        model: currentModel,
        history: chatHistory.slice(-10)
      })
    });

    await handleStreamResponse(r);
  } catch (e) {
    addMessage('assistant', 'Error: Could not reach the AI backend. Make sure the server is running.');
    console.error(e);
  }

  setLoading(false);
}

async function sendWithImage(message) {
  setLoading(true);

  const imageData = document.getElementById('imagePreview').dataset.image;

  try {
    const r = await fetch(`${API_BASE}/api/chat-with-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        image: imageData,
        model: currentModel,
        history: chatHistory.slice(-4)
      })
    });

    await handleStreamResponse(r);
  } catch (e) {
    addMessage('assistant', 'Error: Failed to process image.');
    console.error(e);
  }

  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('imagePreview').dataset.image = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';
  setLoading(false);
}

async function handleStreamResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    addMessage('assistant', `Error: ${text}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let aiMessage = '';

  const messageId = addMessage('assistant', '');
  const contentDiv = document.querySelector(`#${messageId} .message-content`);

  isStreaming = true;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            aiMessage += data.content;
            contentDiv.textContent = aiMessage;
            scrollToBottom();
          }
          if (data.done) {
            chatHistory.push({ role: 'user', content: document.querySelector(`.message.user:last-child .message-content`).textContent });
            chatHistory.push({ role: 'assistant', content: aiMessage });
            if (chatHistory.length > 50) {
              chatHistory = chatHistory.slice(-50);
            }
          }
          if (data.error) {
            contentDiv.textContent = `Error: ${data.error}`;
          }
        } catch (e) {
          // skip incomplete lines
        }
      }
    }
  }

  isStreaming = false;

  if (!aiMessage) {
    contentDiv.textContent = 'The AI did not return a response. Try rephrasing your question.';
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result.split(',')[1];
    const container = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    container.style.display = 'block';
    preview.innerHTML = `<img src="data:${file.type};base64,${base64}" style="max-height:200px;border-radius:8px;">`;
    preview.dataset.image = base64;
    preview.dataset.mime = file.type;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function removeImage() {
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('imagePreview').dataset.image = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  input.value = '';

  addMessage('user', message || `Uploaded: ${file.name}`);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', message || 'Please summarize this document.');
  formData.append('model', currentModel);
  formData.append('history', JSON.stringify(chatHistory.slice(-4)));

  try {
    const r = await fetch(`${API_BASE}/api/chat-with-document`, {
      method: 'POST',
      body: formData
    });

    await handleStreamResponse(r);
  } catch (e) {
    addMessage('assistant', 'Error: Failed to process document.');
    console.error(e);
  }

  e.target.value = '';
  setLoading(false);
}

function addMessage(role, content) {
  const container = document.getElementById('chatMessages');
  const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

  const html = `
    <div id="${id}" class="message ${role}">
      <div class="message-avatar">${role === 'user' ? 'U' : 'S'}</div>
      <div class="message-bubble">
        <div class="message-content">${escapeHtml(content)}</div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
  return id;
}

function setLoading(loading) {
  if (loading) {
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').textContent = '...';
  } else {
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('sendBtn').innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  }
}

function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

async function clearChat() {
  if (!confirm('Clear the current conversation?')) return;
  chatHistory = [];
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('chatInput').value = '';
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('imagePreview').dataset.image = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';
  addMessage('assistant', 'Conversation cleared. Ask me anything!');
}

function toggleSidebar() {
  document.getElementById('historySidebar').classList.toggle('open');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
