// === РОЗПІЗНАВАННЯ ТА СИНТЕЗ МОВЛЕННЯ (ELEVENLABS TTS + БЕЗКОШТОВНІ АЛЬТЕРНАТИВИ) ===

// 1. БЕЗПЕЧНЕ ЗАВАНТАЖЕННЯ НАЛАШТУВАНЬ
window.autoSpeak = false;
window.selectedVoiceURI = 'eleven_EXAVITQu4vr4xnSDxMaL'; // За замовчуванням ставимо голос Bella (100% безкоштовний)

try {
    window.autoSpeak = localStorage.getItem('appAutoSpeak') === '1';
    let savedVoice = localStorage.getItem('appSelectedVoice');
    
    // Очищаємо старі налаштування та заблоковані голоси
    if (savedVoice && (
        savedVoice.startsWith('gemini_') || 
        savedVoice.startsWith('openai_') ||
        savedVoice === 'eleven_zrHiDhphv9ZnVXBqCLjz' || // Mimi
        savedVoice === 'eleven_29vD33N1CtxCmqQRPOHJ' || // Drew
        savedVoice === 'eleven_bVMeCyTHy58xNoL34h3p' || // Antony (Old)
        savedVoice === 'eleven_21m00Tcm4TlvDq8ikWAM' || // Rachel (Blocked)
        savedVoice === 'eleven_pNInz6obbfDQGcgMyIGC' || // Adam (Blocked)
        savedVoice === 'eleven_2EiwWnXFnvU5JabPnv8n' || // Clyde (Blocked)
        savedVoice === 'eleven_MF3mGyEYCl7XYWbV9V6O' || // Elli (Blocked)
        savedVoice === 'eleven_tx3xe00lS0L6I7L6U3zR'    // Josh (Blocked)
    )) {
        savedVoice = 'eleven_EXAVITQu4vr4xnSDxMaL'; // Скидаємо на Беллу
        localStorage.setItem('appSelectedVoice', savedVoice);
    }
    window.selectedVoiceURI = savedVoice || 'eleven_EXAVITQu4vr4xnSDxMaL';
} catch(e) {
    console.warn("Локальне сховище недоступне.");
}

window.isSpeaking = false;
window.speechTimer = null; 
window.currentCloudAudio = null;
window.currentUtterance = null; // Якір пам'яті для усунення багу обривання звуку в Chrome

let speechRec = null;
let isRecording = false;

// ДОПОМІЖНА ФУНКЦІЯ ДЛЯ ПОВІДОМЛЕНЬ ПРО ПОМИЛКИ
window.showToast = function(msg) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style.cssText = "position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:var(--danger); color:white; padding:12px 24px; border-radius:12px; z-index:999999; font-size:14px; font-weight:600; box-shadow:0 10px 25px rgba(0,0,0,0.2); max-width: 90%; word-break: break-word; text-align: center;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 7000); 
};

// 2. ДИЗАЙН МЕНЮ (ЕЛІТНІ РОБОЧІ + БЕЗКОШТОВНІ)
window.populateVoices = function() {
    const select = document.getElementById('voice-select');
    if (!select) return;

    let currentVal = window.selectedVoiceURI;

    select.innerHTML = `
        <optgroup label="🎙️ Преміум (ElevenLabs) - 10к символів/міс">
            <option value="eleven_EXAVITQu4vr4xnSDxMaL">👩 Bella (М'який, приємний)</option>
            <option value="eleven_ErXwobaYiN019PkySvjV">👨 Antoni (Доброзичливий)</option>
        </optgroup>
        <optgroup label="🌐 Безкоштовна Хмара (Без ключів та лімітів)">
            <option value="cloud_google">☁️ Хмарний Google (Якісний, без акценту)</option>
        </optgroup>
        <optgroup label="💻 Вбудовані (Системні)">
            <option value="cloud_uk_std">☁️ Стандартний</option>
            <option value="cloud_uk_fast">🏃 Швидкий</option>
            <option value="cloud_uk_slow">🐢 Повільний</option>
        </optgroup>
    `;
    
    if (select.querySelector(`option[value="${currentVal}"]`)) {
        select.value = currentVal;
    } else {
        select.value = "eleven_EXAVITQu4vr4xnSDxMaL";
        window.selectedVoiceURI = "eleven_EXAVITQu4vr4xnSDxMaL";
    }
};

document.addEventListener('DOMContentLoaded', window.populateVoices);

// 3. ПЕРЕХОПЛЕННЯ ЗМІН В РІДНОМУ МЕНЮ
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    if (key === 'appSelectedVoice') {
        window.selectedVoiceURI = value;
    }
    originalSetItem.apply(this, arguments);
};

window.changeVoice = (uri) => {
    window.selectedVoiceURI = uri;
    try { localStorage.setItem('appSelectedVoice', uri); } catch(e) {}
    window.stopSpeaking();
};

// 4. ІНІЦІАЛІЗАЦІЯ МІКРОФОНА
try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        speechRec = new SpeechRecognition();
        speechRec.lang = 'uk-UA';
        speechRec.continuous = false;
        speechRec.interimResults = false;

        speechRec.onstart = () => {
            isRecording = true;
            const btn = document.getElementById('mic-btn');
            if (btn) btn.classList.add('recording');
        };

        speechRec.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('user-input');
            if (input) {
                input.value += (input.value.length > 0 && !input.value.endsWith(' ') ? ' ' : '') + transcript;
                if (typeof window.autoResize === 'function') window.autoResize(input);
                setTimeout(() => {
                    if (typeof window.handleSend === 'function') window.handleSend();
                }, 400);
            }
        };

        speechRec.onerror = speechRec.onend = () => {
            isRecording = false;
            const btn = document.getElementById('mic-btn');
            if (btn) btn.classList.remove('recording');
        };
    }
} catch(e) {
    console.warn("Голосовий ввід не підтримується.");
}

window.toggleSpeechRecognition = () => {
    if (!speechRec) return alert("Ваш браузер не підтримує голосовий ввід.");
    isRecording ? speechRec.stop() : speechRec.start();
};

window.stopSpeaking = () => {
    window.isSpeaking = false;
    if (window.currentCloudAudio) {
        window.currentCloudAudio.pause();
        window.currentCloudAudio.currentTime = 0;
        window.currentCloudAudio = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume(); 
    }
    window.currentUtterance = null;
    if (window.speechTimer) clearInterval(window.speechTimer);
    document.querySelectorAll('.speak-btn').forEach(b => b.innerHTML = '🔊 Озвучити');
};

// ==========================================
// 5. ОЧИЩЕННЯ ТЕКСТУ ДЛЯ ОЗВУЧКИ
// ==========================================
window.cleanForSpeech = (text) => {
    if (!text) return "";
    
    let cleaned = text
        .replace(/\[GENERATE_IMAGE:.*?\]/gi, ' ') 
        .replace(/<think>[\s\S]*?<\/think>/g, ' ') 
        .replace(/\$\$.*?\$\$/gs, ' ') 
        .replace(/\$.*?\$/gs, ' ') 
        .replace(/\[(.*?)\]\(.*?\)/g, '$1 ') 
        .replace(/https?:\/\/[^\s]+/g, ' ');

    const txtElement = document.createElement("textarea");
    txtElement.innerHTML = cleaned;
    cleaned = txtElement.value;

    cleaned = cleaned.replace(/[:;]/g, ', '); 
    cleaned = cleaned.replace(/\.{2,}/g, '. '); 
    cleaned = cleaned.replace(/\n/g, '. '); 

    cleaned = cleaned.replace(/[^a-zA-Zа-яА-ЯіїєґІЇЄҐ0-9\s.,!?']/g, ' ');

    cleaned = cleaned.replace(/,\s*,/g, ','); 
    cleaned = cleaned.replace(/([.,!?])(?=[^\s])/g, '$1 ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim(); 

    return cleaned;
};

// ==========================================
// 6. СИНТЕЗ МОВЛЕННЯ (ELEVENLABS / GOOGLE / СИСТЕМНИЙ)
// ==========================================
window.speakText = async (text, btnElement) => {
    window.stopSpeaking();
    window.isSpeaking = true;

    const cleanText = window.cleanForSpeech(text);
    
    if (!cleanText) {
        window.stopSpeaking();
        return;
    }

    let currentVoice = window.selectedVoiceURI;
    try { currentVoice = localStorage.getItem('appSelectedVoice') || window.selectedVoiceURI; } catch(e){}
    
    if (btnElement) btnElement.innerHTML = '⏳ Готуємо...';

    // --- ВАРІАНТ А: ПРЕМІУМ ШІ ELEVENLABS ---
    if (currentVoice.startsWith('eleven_')) {
        const voiceId = currentVoice.replace('eleven_', '');
        
        try {
            if (btnElement) btnElement.innerHTML = `⏳ Звернення до ElevenLabs...`;

            // ТВІЙ АКТИВНИЙ КЛЮЧ:
            const ELEVENLABS_API_KEY = "sk_0a186d64943586a6d94c5eb2d2809743f4c56049b6f90a55"; 
            
            if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
                throw new Error("Немає ключа ElevenLabs API.");
            }

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
                method: "POST",
                headers: {
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: "eleven_multilingual_v2", // Обов'язково V2 для української
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Помилка ElevenLabs:", errData);
                const exactError = errData.detail && errData.detail.message ? errData.detail.message : "Невідoма помилка сервера";
                
                if (exactError.includes("quota") || exactError.includes("credit")) {
                    window.showToast(`ElevenLabs: Ліміт символів вичерпано! Вмикаю Google-голос.`);
                } else {
                    window.showToast(`ElevenLabs Error: ${exactError}`);
                }
                throw new Error("ElevenLabs API Error Blocked"); 
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            window.currentCloudAudio = new Audio(audioUrl);
            
            window.currentCloudAudio.onplay = () => { if (btnElement) btnElement.innerHTML = '⏹️ Зупинити'; };
            window.currentCloudAudio.onended = () => { 
                window.isSpeaking = false; 
                if (btnElement) btnElement.innerHTML = '🔊 Озвучити'; 
                URL.revokeObjectURL(audioUrl); 
            };
            window.currentCloudAudio.onerror = () => { 
                window.isSpeaking = false; 
                if (btnElement) btnElement.innerHTML = '🔊 Озвучити'; 
            };

            window.currentCloudAudio.play();
            return; // Успішно озвучено!

        } catch (err) {
            console.warn(err.message);
            // Якщо сталася помилка ключа, автоматично переходимо на безкоштовний Google
            if (err.message === "ElevenLabs API Error Blocked" && !err.message.includes("quota")) {
                if (btnElement) btnElement.innerHTML = '🔊 Озвучити';
                window.isSpeaking = false;
                return;
            }
            
            if (btnElement) btnElement.innerHTML = '⏳ Вмикаю безкоштовний резерв...';
            currentVoice = 'cloud_google'; 
        }
    }

    // --- ВАРІАНТ Б: БЕЗКОШТОВНИЙ ХМАРНИЙ GOOGLE ---
    if (currentVoice === 'cloud_google') {
        const chunks = [];
        const words = cleanText.split(' ');
        let tempChunk = '';
        
        for (let word of words) {
            if (tempChunk.length + word.length > 180) {
                chunks.push(tempChunk.trim());
                tempChunk = word + ' ';
            } else {
                tempChunk += word + ' ';
            }
        }
        if (tempChunk) chunks.push(tempChunk.trim());

        if (btnElement) btnElement.innerHTML = '⏹️ Зупинити';

        let googleFailed = false;
        for (let i = 0; i < chunks.length; i++) {
            if (!window.isSpeaking) break; 
            
            const chunk = chunks[i];
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=uk&q=${encodeURIComponent(chunk)}`;
            
            await new Promise((resolve) => {
                const audio = new Audio(url);
                window.currentCloudAudio = audio;
                
                audio.onended = resolve;
                audio.onerror = () => {
                    console.warn("Помилка відтворення Google");
                    googleFailed = true;
                    resolve(); 
                };
                
                audio.play().catch(err => {
                    console.error("Браузер заблокував звук Google:", err);
                    googleFailed = true;
                    resolve();
                });
            });
            if (googleFailed) break;
        }

        if (googleFailed) {
            window.showToast("Google Хмара заблокована браузером. Вмикаю системний голос.");
            currentVoice = 'cloud_uk_std'; 
        } else {
            window.isSpeaking = false;
            if (btnElement) btnElement.innerHTML = '🔊 Озвучити';
            return;
        }
    }

    // --- ВАРІАНТ В: ВБУДОВАНИЙ ГОЛОС ---
    let playbackRate = 1.0;
    let pitch = 1.0;
    
    if (currentVoice === 'cloud_uk_fast') {
        playbackRate = 1.25;
        pitch = 1.2; 
    } else if (currentVoice === 'cloud_uk_slow') {
        playbackRate = 0.85;
        pitch = 0.8; 
    }

    try {
        if (btnElement) btnElement.innerHTML = '⏹️ Зупинити';
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.currentUtterance = utterance; 
        
        utterance.lang = 'uk-UA';
        utterance.rate = playbackRate;
        utterance.pitch = pitch;

        let voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            await new Promise(r => setTimeout(r, 300));
            voices = window.speechSynthesis.getVoices();
        }

        const ukVoices = voices.filter(v => {
            const lang = v.lang.toLowerCase().replace('_', '-');
            return lang === 'uk-ua' || lang === 'uk' || v.name.includes('Ukrainian') || v.name.includes('Українська');
        });

        if (ukVoices.length > 0) {
            let bestVoice = ukVoices.find(v => v.name.includes('Natural') || v.name.includes('Online')) || ukVoices[0];
            utterance.voice = bestVoice;
        }

        utterance.onend = () => {
            window.isSpeaking = false;
            if (btnElement) btnElement.innerHTML = '🔊 Озвучити';
            if (window.speechTimer) clearInterval(window.speechTimer);
        };

        utterance.onerror = (e) => {
            console.error("Помилка синтезу:", e);
            window.isSpeaking = false;
            if (btnElement) btnElement.innerHTML = '🔊 Озвучити';
            if (window.speechTimer) clearInterval(window.speechTimer);
        };

        window.speechSynthesis.speak(utterance);

        if (window.speechTimer) clearInterval(window.speechTimer);
        window.speechTimer = setInterval(() => {
            if (!window.isSpeaking) {
                clearInterval(window.speechTimer);
                return;
            }
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }, 14000); 

    } catch(err) {
        console.error("Критична помилка синтезу:", err);
        window.stopSpeaking();
    }
};

window.toggleAutoSpeak = (en) => { 
    window.autoSpeak = en; 
    try { localStorage.setItem('appAutoSpeak', en ? '1' : '0'); } catch(e) {} 
};

if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// ==========================================
// 8. ЕФЕКТ КОНФЕТІ 🎉
// ==========================================
window.triggerConfetti = function() {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        const isCircle = Math.random() > 0.5;
        
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-20px';
        confetti.style.width = Math.random() * 8 + 6 + 'px';
        confetti.style.height = isCircle ? confetti.style.width : (Math.random() * 15 + 10 + 'px');
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        if (isCircle) confetti.style.borderRadius = '50%';
        confetti.style.opacity = Math.random() * 0.5 + 0.5;
        confetti.style.pointerEvents = 'none'; 
        confetti.style.zIndex = '999999';
        confetti.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        document.body.appendChild(confetti);

        const fallDuration = Math.random() * 2 + 2; 
        const horizontalSway = (Math.random() - 0.5) * 300; 
        const rotation = Math.random() * 720 + 360;

        try {
            confetti.animate([
                { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate3d(${horizontalSway}px, 105vh, 0) rotate(${rotation}deg)`, opacity: 0 }
            ], {
                duration: fallDuration * 1000,
                easing: 'cubic-bezier(.37,0,.63,1)', 
                fill: 'forwards'
            });
        } catch (e) {
            confetti.style.transition = `all ${fallDuration}s cubic-bezier(.37,0,.63,1)`;
            setTimeout(() => {
                confetti.style.transform = `translate3d(${horizontalSway}px, 105vh, 0) rotate(${rotation}deg)`;
                confetti.style.opacity = '0';
            }, 50);
        }

        setTimeout(() => confetti.remove(), fallDuration * 1000);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    let allowConfetti = false;
    setTimeout(() => allowConfetti = true, 2000); 

    const observer = new MutationObserver((mutations) => {
        if (!allowConfetti) return;
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('msg-wrapper') && node.classList.contains('user')) {
                    const text = node.innerText.toLowerCase();
                    const triggers = ['дякую', 'супер', 'клас', 'я здав', 'ура', 'спасибі', 'вийшло', 'перемога'];
                    if (triggers.some(word => text.includes(word))) window.triggerConfetti();
                }
            });
        });
    });
    
    const startObserver = () => {
        const chatBox = document.getElementById('chat-box');
        if (chatBox) observer.observe(chatBox, { childList: true, subtree: true });
        else setTimeout(startObserver, 500);
    };
    startObserver();
});