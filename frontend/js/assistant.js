/* ===================================================================
   EXPENSEAI — AI ASSISTANT CHAT CONTROLLER SCRIPT
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const q = input.value.trim();
    if (q) {
      sendPrompt(q);
      input.value = '';
    }
  });
});

function sendPrompt(query) {
  const box = document.getElementById('chat-messages-box');

  // Append user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble chat-bubble-user';
  userBubble.innerText = query;
  box.appendChild(userBubble);

  // Append Loading indicator
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble chat-bubble-ai';
  loadingBubble.id = 'ai-typing-indicator';
  loadingBubble.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 6px;"></span> <em>Consulting expense ledger...</em>`;
  box.appendChild(loadingBubble);

  box.scrollTop = box.scrollHeight;

  // Call API
  api.post('/ai/chat', { query })
    .then(res => {
      loadingBubble.remove();
      const data = res.data;

      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble chat-bubble-ai';

      // Simple markdown converter (**bold** and newlines)
      let formattedText = data.answer
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      let linkHtml = '';
      if (data.actionableLink) {
        linkHtml = `
          <div style="margin-top: 10px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
            <a href="${data.actionableLink}" class="btn btn-secondary btn-sm">
              <i data-lucide="external-link"></i> Open Associated View
            </a>
          </div>
        `;
      }

      aiBubble.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; color: var(--brand-primary);">
          <i data-lucide="bot" style="width: 16px; height: 16px;"></i> ExpenseAI Insights
        </div>
        <div>${formattedText}</div>
        ${linkHtml}
      `;

      box.appendChild(aiBubble);
      box.scrollTop = box.scrollHeight;
      if (window.lucide) window.lucide.createIcons();
    })
    .catch(err => {
      loadingBubble.remove();
      const errBubble = document.createElement('div');
      errBubble.className = 'chat-bubble chat-bubble-ai';
      errBubble.style.color = '#DC2626';
      errBubble.innerText = 'Error processing request: ' + err.message;
      box.appendChild(errBubble);
      box.scrollTop = box.scrollHeight;
    });
}
