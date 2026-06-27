const API_BASE = window.location.origin === 'file://' ? 'http://localhost:5050' : '';

let chatHistory = [];
let currentModel = 'qwen2.5:1.5b';
let availableModels = [];
let isStreaming = false;
let lastUserMessage = '';
let uploadedDocContext = '';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (!user) {
        document.getElementById('chatMessages').innerHTML = `
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
      const g = document.createElement('optgroup');
      g.label = 'Text Models';
      textModels.forEach(m => { const o = document.createElement('option'); o.value = m.name; o.textContent = m.name; g.appendChild(o); });
      select.appendChild(g);
    }
    if (visionModels.length) {
      const g = document.createElement('optgroup');
      g.label = 'Vision Models';
      visionModels.forEach(m => { const o = document.createElement('option'); o.value = m.name; o.textContent = m.name; g.appendChild(o); });
      select.appendChild(g);
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
  document.getElementById('modelSelect').addEventListener('change', e => { currentModel = e.target.value; });
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.getElementById('imageBtn').addEventListener('click', () => { document.getElementById('imageInput').click(); });
  document.getElementById('imageInput').addEventListener('change', handleImageUpload);
  document.getElementById('fileBtn').addEventListener('click', () => { document.getElementById('fileInput').click(); });
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  document.getElementById('graphBtn').addEventListener('click', generateGraph);
}

async function sendMessage() {
  if (isStreaming) return;
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  addMessage('user', message);
  lastUserMessage = message;
  const model = availableModels.find(m => m.name === currentModel);
  const isVision = model && model.vision;
  if (isVision && document.getElementById('imagePreview').dataset.image) {
    await sendWithImage(message);
  } else {
    await sendTextOnly(message);
  }
}

function buildContext() {
  let ctx = '';
  if (uploadedDocContext) {
    ctx = `[Document context: ${uploadedDocContext.slice(0, 8000)}]\n\n`;
  }
  return ctx;
}

async function sendTextOnly(message) {
  setLoading(true);
  const context = buildContext();
  const fullMessage = context + message;
  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: fullMessage, model: currentModel, history: chatHistory.slice(-8) })
    });
    await handleStreamResponse(r);
  } catch (e) {
    addMessage('assistant', 'Error: Could not reach the AI backend. Make sure the server is running.');
  }
  setLoading(false);
}

async function sendWithImage(message) {
  setLoading(true);
  const imageData = document.getElementById('imagePreview').dataset.image;
  const context = buildContext();
  const fullMessage = context + message;
  try {
    const r = await fetch(`${API_BASE}/api/chat-with-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: fullMessage, image: imageData, model: currentModel, history: chatHistory.slice(-4) })
    });
    await handleStreamResponse(r);
  } catch (e) {
    addMessage('assistant', 'Error: Failed to process image.');
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
            chatHistory.push({ role: 'user', content: lastUserMessage });
            chatHistory.push({ role: 'assistant', content: aiMessage });
            if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
          }
          if (data.error) contentDiv.textContent = `Error: ${data.error}`;
        } catch (e) {}
      }
    }
  }
  isStreaming = false;
  if (!aiMessage) contentDiv.textContent = 'The AI did not return a response. Try rephrasing your question.';
  if (aiMessage.includes('[GRAPH]')) renderGraphFromResponse(aiMessage, messageId);
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
  addMessage('user', `Uploaded: ${file.name}`);
  setLoading(true);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', 'Store the content of this document for later reference. Do not answer yet, just confirm you have it.');
  formData.append('model', currentModel);
  formData.append('history', '[]');
  try {
    const r = await fetch(`${API_BASE}/api/chat-with-document`, {
      method: 'POST',
      body: formData
    });
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let aiMessage = '';
    const messageId = addMessage('assistant', '');
    const contentDiv = document.querySelector(`#${messageId} .message-content`);
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
            if (data.content) { aiMessage += data.content; contentDiv.textContent = aiMessage; scrollToBottom(); }
            if (data.done) { chatHistory.push({ role: 'user', content: `[Uploaded document: ${file.name}]` }); chatHistory.push({ role: 'assistant', content: aiMessage }); }
          } catch (e) {}
        }
      }
    }
    uploadedDocContext = `The user uploaded a document named "${file.name}". Its contents are above. When the user asks questions about it, refer to the document content from the conversation history.`;
  } catch (e) {
    addMessage('assistant', 'Error: Failed to process document.');
  }
  e.target.value = '';
  setLoading(false);
}

function renderGraphFromResponse(aiMessage, messageId) {
  const match = aiMessage.match(/\[GRAPH\](.*?)\[\/GRAPH\]/);
  if (!match) return;
  const expression = match[1].trim();
  try {
    const r = await fetch(`${API_BASE}/api/generate-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression })
    });
    const data = await r.json();
    if (data.image) {
      const container = document.getElementById(messageId);
      const bubble = container.querySelector('.message-bubble');
      const img = document.createElement('div');
      img.style.marginTop = '12px';
      img.innerHTML = `<img src="${data.image}" style="max-width:100%;border-radius:8px;border:1px solid var(--border);" alt="Graph of ${escapeHtml(expression)}">`;
      bubble.appendChild(img);
    }
  } catch (e) {
    console.error('Graph render failed:', e);
  }
}

async function generateGraph() {
  const input = document.getElementById('chatInput');
  let expr = input.value.trim();
  if (!expr) {
    expr = prompt('Enter a math expression to graph (e.g. x^2+2x+3, sin(x), 2x+5):');
    if (!expr) return;
  }
  input.value = '';
  addMessage('user', `Graph: ${expr}`);
  try {
    const r = await fetch(`${API_BASE}/api/generate-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: expr })
    });
    const data = await r.json();
    if (data.image) {
      const id = addMessage('assistant', `Graph of ${expr}:`);
      const container = document.getElementById(id);
      const bubble = container.querySelector('.message-bubble');
      const img = document.createElement('div');
      img.style.marginTop = '8px';
      img.innerHTML = `<img src="${data.image}" style="max-width:100%;border-radius:8px;border:1px solid var(--border);" alt="Graph of ${escapeHtml(expr)}">`;
      bubble.appendChild(img);
    } else {
      addMessage('assistant', `Error generating graph: ${data.error || 'Unknown error'}`);
    }
  } catch (e) {
    addMessage('assistant', 'Error: Could not generate graph.');
  }
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
  uploadedDocContext = '';
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
