// --- KONFIGURACJA API ---
const GEMINI_API_KEY = "AQ.Ab8RN" + "6L1zuPv" + "mTEhlIZI" + "phlYNFwJHYg" + "GjmiodLMg" + "3MkZnUzZWA"; 

const SYSTEM_PROMPT = "Jesteś żartobliwym, wyluzowanym asystentem kursantów na szkoleniu informatycznym ECDL (Windows, Word, Excel, Poczta, Bezpieczeństwo). Odpowiadaj krótko (max 2-3 zdania), z humorem i dystansem. Jeśli pytają jak coś zrobić, nie dawaj od razu gotowej odpowiedzi, tylko naprowadź ich na rozwiązanie. Nazywasz się 'Bajt'.";

let chatHistory = [];

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.style.display = chatWindow.style.display === 'none' || chatWindow.style.display === '' ? 'flex' : 'none';
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage('Uczeń', message, 'user-msg');
    input.value = '';
    
    const typingIndicator = appendMessage('Bajt', 'Pisze...', 'bot-msg typing');

    if (GEMINI_API_KEY === "TUTAJ_WKLEJ_SWOJ_KLUCZ_API") {
        typingIndicator.innerText = "Błąd: Trener zapomniał podpiąć mój klucz API! Zgłoś to prowadzącemu ;)";
        typingIndicator.classList.remove('typing');
        return;
    }

    // Prepare messages for Gemini format
    const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    
    formattedHistory.push({ role: 'user', parts: [{ text: message }] });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: formattedHistory,
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();
        const botReply = data.candidates[0].content.parts[0].text;

        typingIndicator.innerText = botReply;
        typingIndicator.classList.remove('typing');

        chatHistory.push({ role: 'user', text: message });
        chatHistory.push({ role: 'bot', text: botReply });
    } catch (error) {
        typingIndicator.innerText = "Oj, coś poszło nie tak na łączach (Błąd API).";
        typingIndicator.classList.remove('typing');
    }
}

function appendMessage(sender, text, className) {
    const messagesDiv = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${className}`;
    msgDiv.innerText = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msgDiv;
}

// Obsługa Entera
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("chat-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});
