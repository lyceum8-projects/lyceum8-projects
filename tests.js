async function getFirestoreDb() {
    if (window.dbDoc && window.dbSetDoc) {
        return {
            doc: window.dbDoc,
            setDoc: window.dbSetDoc,
            getDoc: window.dbGetDoc,
            deleteDoc: window.dbDeleteDoc,
            collection: window.dbCollection,
            getDocs: window.dbGetDocs,
            updateDoc: window.dbUpdateDoc
        };
    }
    return await getFirestoreDb();
}

// ==========================================
// 🧪 ПЛАТФОРМА ТЕСТІВ (ULTIMATE ВЕРСІЯ)
// ==========================================

window.activeTest = null;
window.activeTestId = null;
window.currentQIndex = 0;
window.testScore = 0;
window.testCheatCount = 0;
window.testAnswers = [];
window.manualQuestionCount = 0;
window.testStartTime = 0;

// === ІН'ЄКЦІЯ СТИЛІВ ДЛЯ НОВИХ АНІМАЦІЙ ТА ТАБЛИЦЬ ===
if (!document.getElementById('test-platform-styles')) {
    const style = document.createElement('style');
    style.id = 'test-platform-styles';
    style.innerHTML = `
        @keyframes popSlideIn {
            0% { transform: scale(0.5) translateY(50px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .toast-check {
            width: 150px; height: 150px; background: var(--success); border-radius: 24px;
            display: flex; align-items: center; justify-content: center; color: white;
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4); font-weight: 800; text-transform: uppercase;
            animation: popSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .leaderboard-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
        .leaderboard-table th, .leaderboard-table td { padding: 10px; border-bottom: 1px solid var(--border); text-align: left; }
        .leaderboard-table tr:nth-child(1) td { font-weight: 800; color: #f59e0b; }
        .leaderboard-table tr:nth-child(2) td { font-weight: 700; color: #94a3b8; }
        .leaderboard-table tr:nth-child(3) td { font-weight: 600; color: #b45309; }
        .ans-card { background: var(--bg-tab); padding: 15px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 10px; }
        #cheat-force-return { position:fixed; inset:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; text-align:center; padding:30px; backdrop-filter:blur(10px); }
    `;
    document.head.appendChild(style);
}

window.switchTestMode = function(mode) {
    ['create', 'my', 'public'].forEach(m => {
        const btn = document.getElementById(`btn-test-${m}`);
        const el = document.getElementById(`test-mode-${m}`);
        if(btn) btn.classList.toggle('active', mode === m);
        if(el) el.style.display = mode === m ? 'block' : 'none';
    });
    
    // Ховаємо контейнер результатів при перемиканні вкладок
    const renderContainer = document.getElementById('test-render-container');
    if (renderContainer) {
        renderContainer.style.display = 'none';
        renderContainer.innerHTML = '';
    }

    if (mode === 'my') window.loadMyTests();
    if (mode === 'public') window.loadPublicTests();
};

// === ВИДАЛЕННЯ ТЕСТУ ===
window.deleteTest = async function(testId) {
    if (!confirm('Ви впевнені, що хочете видалити цей тест? Цю дію неможливо скасувати.')) return;
    
    try {
        const { doc, deleteDoc } = await getFirestoreDb();
        await deleteDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'tests', testId));
        
        // Оновлюємо список після видалення
        window.loadMyTests();
        
        const toast = document.getElementById('toast-success');
        if (toast) {
            toast.innerHTML = '<div class="toast-check" style="background:var(--danger);">ТЕСТ<br>ВИДАЛЕНО</div>';
            toast.style.display = 'flex';
            setTimeout(() => { toast.style.display = 'none'; }, 1500);
        } else {
            alert('Тест успішно видалено!');
        }
    } catch(e) {
        console.error("Помилка видалення тесту:", e);
        alert('Помилка при видаленні тесту. Перевірте з\'єднання або права доступу.');
    }
};

// === 1. АНАЛІТИКА ДЛЯ ТВОРЦЯ ТЕСТУ ===
window.viewResults = async function(testId, title) {
    const container = document.getElementById('test-render-container');
    const myTestsList = document.getElementById('test-mode-my');
    
    // Ховаємо список і показуємо контейнер результатів
    if (myTestsList) myTestsList.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = `<div class="sch-empty">⏳ Завантажую аналітику...</div>`;
    
    try {
        const testData = await window.fbLoadTest(testId);
        window.currentViewingTest = testData;
        window.currentViewingTestId = testId;

        const { collection, getDocs } = await getFirestoreDb();
        const resultsRef = collection(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', `test_results_${testId}`);
        const snap = await getDocs(resultsRef);
        
        let results = [];
        snap.forEach(d => results.push({id: d.id, ...d.data()}));
        results.sort((a,b) => b.score - a.score || (a.endTime - a.startTime) - (b.endTime - b.startTime));
        window.currentViewingResults = results;
        
        let html = `
            <div class="card" style="border-color:var(--primary); animation: fadeIn 0.4s ease; max-width:100%; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:10px;">
                    <h3 style="font-size:16px;">📊 Результати: ${title}</h3>
                    <button onclick="document.getElementById('test-render-container').style.display='none'; document.getElementById('test-render-container').innerHTML=''; document.getElementById('test-mode-my').style.display='block';" class="icon-btn" style="padding:6px 12px; font-size:12px; white-space:nowrap; border-color:var(--danger); color:var(--danger);">Закрити</button>
                </div>
                <div style="overflow-x:auto; -webkit-overflow-scrolling: touch;">
                    <table style="width:100%; border-collapse:collapse; font-size:12px; min-width:500px;">
                        <thead>
                            <tr style="text-align:left; border-bottom:2px solid var(--border); background:var(--bg-main);">
                                <th style="padding:12px;">Учень</th>
                                <th style="padding:12px;">Бал / %</th>
                                <th style="padding:12px;">Час</th>
                                <th style="padding:12px;">Списування</th>
                                <th style="padding:12px;">Дії</th>
                            </tr>
                        </thead>
                        <tbody>`;
        
        if(results.length === 0) {
            html += `<tr><td colspan="5" style="padding:30px; text-align:center; color:var(--text-muted);">На цей тест ще не надійшло жодної відповіді.</td></tr>`;
        }

        results.forEach(res => {
            let timeStr = "Невідомо";
            if (res.startTime && res.endTime) {
                const duration = Math.round((res.endTime - res.startTime) / 1000);
                const min = Math.floor(duration / 60);
                const sec = duration % 60;
                timeStr = `${min}хв ${sec}с`;
            }

            const cheatLevel = res.cheatCount > 0 ? 'color:var(--danger); font-weight:bold;' : 'color:var(--success);';
            const percent = Math.round((res.score / res.maxScore) * 100);
            
            html += `
                <tr style="border-bottom:1px solid var(--border); transition:0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:12px;"><b>${res.studentName}</b><br><small style="color:var(--text-muted)">${res.email || 'гість'}</small></td>
                    <td style="padding:12px;">${res.score}/${res.maxScore} <span style="color:var(--primary)">(${percent}%)</span></td>
                    <td style="padding:12px;">${timeStr}</td>
                    <td style="padding:12px; ${cheatLevel}">${res.cheatCount} виходів</td>
                    <td style="padding:12px;">
                        <button onclick="window.showDetailedAnswers('${res.id}')" style="background:var(--primary); color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:600;">Відповіді</button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
    } catch(e) { 
        console.error(e);
        container.innerHTML = `
            <div class="card" style="text-align:center; padding:30px;">
                <div style="color:var(--danger); font-size:40px; margin-bottom:15px;">⚠️</div>
                <h3 style="color:var(--danger); margin-bottom:10px;">Помилка бази даних</h3>
                <p style="color:var(--text-muted); font-size:14px; margin-bottom:20px;">Не вдалося завантажити результати. Перевірте підключення до Інтернету або правила доступу (Rules) у Firebase.</p>
                <button onclick="document.getElementById('test-render-container').style.display='none'; document.getElementById('test-mode-my').style.display='block';" style="background:var(--bg-tab); border:1px solid var(--border); padding:10px 20px; border-radius:10px; cursor:pointer; font-weight:600;">Повернутися назад</button>
            </div>
        `; 
    }
};

window.showDetailedAnswers = function(studentResId) {
    let res = window.currentViewingResults.find(r => r.id === studentResId);
    if(!res) return;
    const testData = window.currentViewingTest;

    const container = document.getElementById('test-render-container');
    let html = `
        <div class="card" style="border-color:var(--primary); animation: fadeIn 0.4s ease; max-width:100%;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>Деталі: ${res.studentName}</h3>
                <button onclick="window.viewResults('${window.currentViewingTestId}', '${testData.title.replace(/'/g,"")}')" class="icon-btn" style="padding:6px 12px; font-size:12px;">← Назад</button>
            </div>
            <p style="margin-bottom:15px; font-size:16px;">Бал: <strong style="color:var(--primary)">${res.score} / ${res.maxScore}</strong></p>
    `;

    res.answers.forEach((ans, i) => {
        const q = testData.questions[ans.qIndex];
        const status = ans.isCorrect === true ? "✅ ВІРНО" : (ans.isCorrect === false ? "❌ НЕВІРНО" : "📝 ТЕКСТОВА ВІДПОВІДЬ");
        
        let ansDisplay = Array.isArray(ans.answer) ? ans.answer.map(val => q.options[val]).join(', ') : ans.answer;
        if(!ansDisplay && ans.answer !== undefined && !Array.isArray(ans.answer)) ansDisplay = ans.answer;

        let correctStr = '';
        if (q.type === 'single' || q.type === 'multi') {
            let cArr = Array.isArray(q.correct) ? q.correct : [q.correct];
            correctStr = cArr.map(idx => q.options[idx]).join(', ');
        }

        html += `<div class="ans-card">
            <b>${ans.qIndex+1}. ${q.q || q.question || q.text || 'Без тексту'}</b><br>
            <span style="color:var(--text-muted); font-size:13px;">Відповідь учня:</span> <b>${ansDisplay}</b><br>
            <span style="font-size:13px;">Статус:</span> ${status}<br>
            ${correctStr ? `<small style="color:var(--success);">Правильна: ${correctStr}</small><br>` : ''}
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button onclick="window.updateStudentGrade('${res.id}', ${ans.qIndex}, true)" style="background:var(--success); color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold;">✅ Зарахувати</button>
                <button onclick="window.updateStudentGrade('${res.id}', ${ans.qIndex}, false)" style="background:var(--danger); color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold;">❌ Зняти бал</button>
                ${q.type === 'open' ? `<button onclick="window.teacherAiRecheck('${res.id}', ${ans.qIndex})" style="background:var(--accent); color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold;">🤖 Перевірити ШІ</button>` : ''}
            </div>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
};

window.updateStudentGrade = async function(studentResId, qIndex, isCorrect) {
    try {
        let res = window.currentViewingResults.find(r => r.id === studentResId);
        if (!res) return;
        
        let ans = res.answers.find(a => a.qIndex === qIndex);
        if (!ans) return;
        
        if (ans.isCorrect !== true && isCorrect === true) res.score += 1;
        if (ans.isCorrect === true && isCorrect === false) res.score -= 1;
        ans.isCorrect = isCorrect;
        
        const { doc, updateDoc } = await getFirestoreDb();
        await updateDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', `test_results_${window.currentViewingTestId}`, studentResId), {
            score: res.score,
            answers: res.answers
        });
        
        alert('✅ Оцінку успішно оновлено!');
        window.showDetailedAnswers(studentResId);
    } catch(e) { alert("Помилка: " + e.message); }
};

window.teacherAiRecheck = async function(studentResId, qIndex) {
    let res = window.currentViewingResults.find(r => r.id === studentResId);
    const q = window.currentViewingTest.questions[qIndex];
    let ans = res.answers.find(a => a.qIndex === qIndex);
    
    const originalBtnText = event.target.innerText;
    event.target.innerText = "⏳ Аналіз...";
    event.target.disabled = true;

    const isCorrect = await window.aiCheckOpenAnswer(q.q || q.question || q.text, ans.answer);
    
    event.target.innerText = originalBtnText;
    event.target.disabled = false;

    if (confirm(`🤖 Висновок ШІ:\nВідповідь учня ${isCorrect ? "ПРАВИЛЬНА ✅" : "НЕПРАВИЛЬНА ❌"}.\n\nЗастосувати цю оцінку?`)) {
        window.updateStudentGrade(studentResId, qIndex, isCorrect);
    }
};

// === 2. ПЕРЕГЛЯД ПИТАНЬ (ДЛЯ ПУБЛІЧНИХ) ===
window.previewQuestions = async function(testId) {
    try {
        const testData = await window.fbLoadTest(testId);
        if(!testData) return;
        
        let htmlList = testData.questions.map((q, i) => {
            let typeIcon = q.type === 'multi' ? '☑️' : (q.type === 'open' ? '✍️' : '🔘');
            return `
                <div style="padding: 12px; background: var(--bg-tab); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; text-align: left; box-shadow: var(--shadow-sm);">
                    <strong style="font-size: 14px; color: var(--text-main);">${i+1}. ${typeIcon} ${q.q || q.question || q.text}</strong>
                </div>`;
        }).join('');

        const overlay = document.createElement('div');
        overlay.id = 'preview-questions-modal';
        overlay.style.cssText = "position:fixed; inset:0; background:rgba(15,23,42,0.85); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(5px); animation: fadeIn 0.3s ease;";
        overlay.innerHTML = `
            <div class="card" style="background:var(--bg-main); width:100%; max-width:600px; max-height:85vh; display:flex; flex-direction:column; border:1px solid var(--border); padding:0; overflow:hidden; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
                <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:var(--glass);">
                    <h3 style="margin:0; font-size:18px; color:var(--primary);">Зміст тесту: ${testData.title}</h3>
                    <button onclick="this.closest('#preview-questions-modal').remove()" style="background:var(--danger); color:white; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm); transition:0.2s;">✕</button>
                </div>
                <div style="padding:20px; overflow-y:auto; flex-grow:1;">
                    ${htmlList}
                    <p style="text-align:center; color:var(--text-muted); font-size:13px; margin-top:20px; font-style:italic;">(Правильні варіанти та відповіді приховані)</p>
                </div>
                <div style="padding:20px; border-top:1px solid var(--border); background:var(--bg-tab);">
                    <button onclick="this.closest('#preview-questions-modal').remove()" style="background:var(--primary); color:white; border:none; padding:14px; border-radius:12px; font-weight:bold; cursor:pointer; width:100%; font-size:16px;">Закрити попередній перегляд</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } catch(e) { alert("Помилка завантаження змісту."); }
};

// === 3. ЗАВАНТАЖЕННЯ СПИСКІВ ===
window.loadMyTests = async function() {
    const listEl = document.getElementById('my-tests-list');
    if (!listEl || !window.firestoreDB) return;
    listEl.innerHTML = '<div class="sch-empty">⏳ Шукаю ваші тести...</div>';

    try {
        const { collection, getDocs } = await getFirestoreDb();
        const snap = await getDocs(collection(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'tests'));
        const myEmail = window.currentUser ? window.currentUser.email : 'guest';
        let html = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.creatorEmail === myEmail || (window.isSuperAdmin && window.isSuperAdmin())) {
                const link = window.location.origin + window.location.pathname + '?t=' + docSnap.id;
                html += `
                    <div class="card" style="padding:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid var(--primary);">
                        <div style="overflow:hidden;">
                            <strong style="font-size:15px; display:block; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${data.title}</strong>
                            <span style="font-size:12px; color:var(--text-muted);">${data.questions?.length || 0} питань • ${data.isPublic ? '🌍 Публічний' : '🔒 Приватний'}</span>
                        </div>
                        <div style="display:flex; gap:6px; flex-shrink:0;">
                            <button onclick="window.viewResults('${docSnap.id}', '${data.title.replace(/'/g, "")}')" style="background:var(--accent); color:white; border:none; padding:8px 12px; border-radius:10px; cursor:pointer; font-weight:700; font-size:12px;">📊 Звіт</button>
                            <button onclick="window.copyLink('${link}')" style="background:var(--bg-tab); border:1px solid var(--border); padding:8px; border-radius:10px; cursor:pointer;" title="Копіювати лінк">🔗</button>
                            <button onclick="window.deleteTest('${docSnap.id}')" style="background:var(--danger); color:white; border:none; padding:8px; border-radius:10px; cursor:pointer;" title="Видалити тест">🗑️</button>
                        </div>
                    </div>`;
            }
        });
        listEl.innerHTML = html || '<div class="sch-empty">Ви ще не створили жодного тесту.</div>';
    } catch(e) { listEl.innerHTML = '<div class="sch-empty" style="color:var(--danger);">Помилка з\'єднання з БД.</div>'; }
};

window.loadPublicTests = async function() {
    const listEl = document.getElementById('public-tests-list');
    if (!listEl || !window.firestoreDB) return;
    listEl.innerHTML = '<div class="sch-empty">⏳ Шукаю відкриті тести...</div>';

    try {
        const { collection, getDocs } = await getFirestoreDb();
        const snap = await getDocs(collection(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'tests'));
        let html = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.isPublic) {
                const link = window.location.origin + window.location.pathname + '?t=' + docSnap.id;
                html += `
                    <div class="card" style="padding:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid var(--accent);">
                        <div style="overflow:hidden; flex-grow:1; padding-right:10px;">
                            <strong style="font-size:15px; display:block; overflow:hidden; text-overflow:ellipsis;">${data.title}</strong>
                            <span style="font-size:11px; color:var(--text-muted);">Автор: ${data.creatorEmail.split('@')[0]}</span>
                        </div>
                        <div style="display:flex; gap:6px; flex-shrink:0;">
                            <button onclick="window.previewQuestions('${docSnap.id}')" style="background:var(--bg-tab); border:1px solid var(--border); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:12px; font-weight:600;">👁️ Питання</button>
                            <button onclick="window.open('${link}', '_self')" style="background:var(--primary); color:white; border:none; padding:8px 15px; border-radius:10px; cursor:pointer; font-weight:700;">Грати</button>
                        </div>
                    </div>`;
            }
        });
        listEl.innerHTML = html || '<div class="sch-empty">Публічних тестів поки що немає. Створіть свій!</div>';
    } catch(e) { listEl.innerHTML = '<div class="sch-empty" style="color:var(--danger);">Помилка.</div>'; }
};

window.copyLink = async (l) => {
    try {
        await navigator.clipboard.writeText(l);
        alert('Посилання скопійовано! Надішліть його учням.');
    } catch (err) {
        console.error('Не вдалося скопіювати посилання: ', err);
        alert('Не вдалося скопіювати посилання. Будь ласка, скопіюйте його вручну.');
    }
};

// === 4. ГЕНЕРАЦІЯ ШІ ТА КОНСТРУКТОР (ГІБРИДНА СИСТЕМА) ===
window.generateAITest = async function() {
    const topicInput = document.getElementById('ai-test-topic');
    const loader = document.getElementById('ai-test-loader');
    const btn = document.getElementById('btn-gen-test');
    
    let topic = topicInput.value.trim();
    if (!topic) return alert('Будь ласка, введіть тему тесту!');

    let qCount = 12; // За замовчуванням
    const qMatch = topic.match(/(\d+)\s*(питань|питання|запитань|запитання)/i);
    if (qMatch) qCount = parseInt(qMatch[1]);
    if (qCount > 100) qCount = 100; // МАКСИМУМ 100 ПИТАНЬ

    const userClass = (window.currentUser && window.currentUser.userClass && window.currentUser.userClass !== '-') ? window.currentUser.userClass : "гість";
    loader.style.display = 'block'; btn.disabled = true;

    // Промпт створено так, щоб мінімізувати "базікання" ШІ
    const prompt = `Створи професійний тест на тему: "${topic}" для ${userClass} класу.
    Згенеруй РІВНО ${qCount} питань.
    Типи: 'single', 'multi', 'open'.
    ПОВЕРНИ ЛИШЕ ЧИСТИЙ JSON БЕЗ ЖОДНИХ ІНШИХ СЛІВ:
    {"title": "Назва", "questions": [{"type": "single|multi|open", "q": "текст", "options": ["А","Б","В","Г"], "correct": [індекси]}]}`;

    const parseAIJson = (txt) => {
        if (!txt || typeof txt !== 'string') return null;
        try {
            // Спрощений парсер, оскільки ми очікуємо валідний JSON від Gemini
            return JSON.parse(txt.replace(/```json/gi, '').replace(/```/g, '').trim());
        } catch (e) {
            console.error("Помилка парсингу JSON:", e, "Текст:", txt);
            return null;
        }
    };

    try {
        const apiKeys = window.APP_CONFIG?.GEMINI_API_KEYS || [];
        let resultData = null;

        // 1. Пріоритет: Безкоштовний Pollinations
        try {
            const res = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You MUST reply ONLY with valid JSON matching the requested schema. Do not include markdown codeblocks (\`\`\`json).' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'openai',
                    jsonMode: true
                })
            });
            if (res.ok) {
                const rawText = await res.text();
                resultData = parseAIJson(rawText);
            }
        } catch(e) { console.warn("Помилка Pollinations при генерації тесту:", e); }

        // 2. Резерв: OpenRouter з ключами із .env
        if (!resultData && apiKeys.length > 0) {
            const model = window.APP_CONFIG?.GEMINI_MODEL || "google/gemini-2.5-flash";
            for (let key of apiKeys) {
                if(!key) continue;
                try {
                    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${key.trim()}`,
                            'HTTP-Referer': 'https://lyceum8-app.web.app',
                            'X-Title': 'Lyceum 8 App'
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'system', content: 'You MUST reply ONLY with valid JSON matching the requested schema.' },
                                { role: 'user', content: prompt }
                            ]
                        })
                    });
                    if (res.ok) {
                        const json = await res.json();
                        const rawText = json.choices?.[0]?.message?.content;
                        if(rawText) {
                            resultData = parseAIJson(rawText);
                            if (resultData) break;
                        }
                    }
                } catch(e) { console.warn("Помилка OpenRouter при генерації тесту:", e); }
            }
        }
        
        if (resultData && resultData.questions && resultData.questions.length > 0) {
            document.getElementById('manual-test-title').value = resultData.title;
            document.getElementById('manual-questions-container').innerHTML = '';
            window.manualQuestionCount = 0;
            resultData.questions.forEach(q => window.addManualQuestion(q));
            topicInput.value = '';
            window.switchTestMode('create');
        } else {
            throw new Error("Не вдалося згенерувати тест. Можливо, сервери перевантажені, або відповідь від ШІ була у невірному форматі.");
        }
    } catch (e) { 
        alert('Помилка генерації. Сервери можуть бути перевантажені (особливо при запиті на 20+ питань). Спробуйте ще раз або зменшіть кількість питань.'); 
    } finally { 
        loader.style.display = 'none'; 
        btn.disabled = false; 
    }
};

window.addManualQuestion = function(preset = null) {
    window.manualQuestionCount++;
    const qId = window.manualQuestionCount;
    const qType = preset ? preset.type : 'single';
    // БЕЗПЕЧНЕ ЧИТАННЯ (уникаємо помилки undefined.replace)
    const qTextVal = preset ? String(preset.q || preset.question || preset.text || "").replace(/"/g, '&quot;') : '';
    
    const html = `
        <div class="manual-q-block card" data-qid="${qId}" style="padding:15px; margin-bottom:12px; position:relative; background:var(--bg-main);">
            <button onclick="this.parentElement.remove()" style="position:absolute; top:10px; right:10px; background:var(--danger); color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-weight:bold;">✕</button>
            <select class="setting-control q-type" style="margin-bottom:10px; color:var(--primary); font-weight:bold;" onchange="window.updateQuestionTypeUI(this, ${qId})">
                <option value="single" ${qType === 'single' ? 'selected' : ''}>🔘 Тест (1 відповідь)</option>
                <option value="multi" ${qType === 'multi' ? 'selected' : ''}>☑️ Кілька відповідей</option>
                <option value="open" ${qType === 'open' ? 'selected' : ''}>✍️ Відкрита відповідь</option>
            </select>
            <input type="text" class="setting-control q-text" placeholder="Текст питання..." value="${qTextVal}">
            <div class="q-options-area" id="opts_area_${qId}" style="margin-top:10px; display:flex; flex-direction:column; gap:8px;"></div>
        </div>`;
    document.getElementById('manual-questions-container').insertAdjacentHTML('beforeend', html);
    window.updateQuestionTypeUI(document.querySelector(`[data-qid="${qId}"] .q-type`), qId, preset);
};

window.updateQuestionTypeUI = function(selectEl, qId, preset = null) {
    const area = document.getElementById(`opts_area_${qId}`);
    const type = selectEl.value;
    if (type === 'open') { 
        area.innerHTML = '<div style="font-size:12px; color:var(--text-muted); font-style:italic; padding:10px; border:1px dashed var(--border); border-radius:8px;">Учень самостійно впише відповідь текстом. ШІ або вчитель перевірить правильність.</div>'; 
        return; 
    }
    
    let opts = (preset && (preset.options || preset.answers)) ? (preset.options || preset.answers) : ["", "", "", ""];
    let correct = preset ? preset.correct : [0];
    let html = '';
    
    for(let i=0; i<4; i++) {
        const isChecked = Array.isArray(correct) ? correct.includes(i) : correct == i;
        const val = opts[i] !== undefined ? String(opts[i]).replace(/"/g, '&quot;') : '';
        html += `
            <div style="display:flex; align-items:center; gap:10px; background:var(--bg-tab); padding:8px; border-radius:10px; border:1px solid var(--border);">
                <input type="${type==='multi'?'checkbox':'radio'}" name="correct_${qId}" value="${i}" ${isChecked?'checked':''} style="accent-color:var(--success); transform:scale(1.2);">
                <input type="text" class="setting-control opt-text" value="${val}" placeholder="Варіант ${i+1}" style="border:none; padding:4px; box-shadow:none; margin-bottom:0;">
            </div>`;
    }
    area.innerHTML = html;
};

window.publishManualTest = async function() {
    const title = document.getElementById('manual-test-title').value.trim();
    if(!title) return alert('Введіть назву тесту!');
    
    const blocks = document.querySelectorAll('.manual-q-block');
    if(blocks.length === 0) return alert('Додайте хоча б одне питання!');
    
    const testData = { 
        title: title, 
        isPublic: document.getElementById('manual-test-public').checked,
        creatorEmail: window.currentUser ? window.currentUser.email : 'guest',
        questions: [] 
    };

    try {
        let qIndex = 1;
        for(let block of blocks) {
            const type = block.querySelector('.q-type').value;
            const qText = block.querySelector('.q-text').value.trim();
            if(!qText) throw new Error(`Заповніть текст у питанні #${qIndex}!`);

            let qObj = { type: type, q: qText };
            if (type !== 'open') {
                const optInputs = Array.from(block.querySelectorAll('.opt-text'));
                const opts = optInputs.map(inp => inp.value.trim());
                if(opts.some(o => !o)) throw new Error(`Заповніть усі варіанти у питанні #${qIndex}!`);
                qObj.options = opts;
                
                const checked = Array.from(block.querySelectorAll(`input[name="correct_${block.dataset.qid}"]:checked`));
                if(checked.length === 0) throw new Error(`Оберіть вірну відповідь у питанні #${qIndex}!`);
                qObj.correct = checked.map(c => parseInt(c.value));
            }
            testData.questions.push(qObj);
            qIndex++;
        }

        if(!window.fbSaveTest) return alert('БД ще вантажиться...');
        const testId = 't_' + Date.now().toString(36);
        await window.fbSaveTest(testId, testData);
        
        let basePath = window.location.pathname.replace(/\/index\.html$/i, '');
        if (!basePath.endsWith('/')) basePath += '/';
        const link = window.location.origin + basePath + '?t=' + testId;
        
        // -------------------------------------------------------------
        // СТВОРЕННЯ МОДАЛЬНОГО ВІКНА ПРО УСПІШНУ ПУБЛІКАЦІЮ
        // -------------------------------------------------------------
        const overlay = document.createElement('div');
        overlay.id = 'test-published-modal';
        overlay.style.cssText = "position:fixed; inset:0; background:rgba(15,23,42,0.85); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(5px); animation: fadeIn 0.3s ease;";
        overlay.innerHTML = `
            <div class="card" style="background:var(--bg-main); width:100%; max-width:500px; display:flex; flex-direction:column; border:2px solid var(--success); padding:30px; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.3); text-align:center;">
                <div style="font-size:50px; margin-bottom:10px;">✅</div>
                <h2 style="color:var(--success); margin-bottom:15px; font-size:22px;">ТЕСТ ГОТОВИЙ!</h2>
                <p style="color:var(--text-main); font-size:14px; margin-bottom:20px;">Ваш тест успішно збережено та опубліковано. Надішліть це посилання учням:</p>
                <input type="text" value="${link}" readonly style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); text-align:center; background:var(--bg-tab); color:var(--primary); font-size:16px; font-weight:700; cursor:pointer; margin-bottom:20px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.05);" onclick="this.select(); document.execCommand('copy'); alert('Скопійовано!');">
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button onclick="this.closest('#test-published-modal').remove(); window.switchTestMode('my');" style="flex:1; background:var(--primary); color:white; border:none; padding:12px 20px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:14px;">До моїх тестів</button>
                    <button onclick="this.closest('#test-published-modal').remove();" style="flex:1; background:var(--bg-tab); color:var(--text-main); border:1px solid var(--border); padding:12px 20px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:14px;">Закрити</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Очищаємо форму після публікації
        document.getElementById('manual-test-title').value = '';
        document.getElementById('manual-questions-container').innerHTML = '';
        window.manualQuestionCount = 0;
        
    } catch(e) { alert(e.message); }
};

// === 5. ТЕСТ-РАННЕР (ПРОХОДЖЕННЯ) ===
window.openTestRunner = function(testId, testData) {
    window.activeTestId = testId;
    window.activeTest = testData;
    window.currentQIndex = 0;
    window.testScore = 0;
    window.testCheatCount = 0;
    window.testAnswers = [];
    window.testStartTime = Date.now();
    
    document.getElementById('test-runner-overlay').style.display = 'flex';
    document.getElementById('tr-intro-title').innerText = testData.title;
    
    if (window.currentUser) {
        window.testTakerName = `${window.currentUser.firstName} ${window.currentUser.lastName}`;
        document.getElementById('tr-guest-fields').style.display = 'none';
    } else {
        document.getElementById('tr-guest-fields').style.display = 'block';
    }
    
    document.getElementById('tr-intro-screen').style.display = 'block';
    document.getElementById('tr-active-screen').style.display = 'none';
    document.getElementById('tr-outro-screen').style.display = 'none';
};

window.startFullscreenTest = function() {
    if (!window.currentUser) {
        const name = document.getElementById('tr-guest-name').value.trim();
        if (!name || name.length < 3) return alert('Будь ласка, введіть Ваше Прізвище та Ім\'я!');
        window.testTakerName = name;
    }

    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(e=>{});
    
    document.addEventListener('fullscreenchange', window.fullscreenCheatCheck);
    document.getElementById('tr-intro-screen').style.display = 'none';
    document.getElementById('tr-active-screen').style.display = 'block';
    window.renderCurrentQuestion();
};

window.fullscreenCheatCheck = function() {
    if (!document.fullscreenElement && document.getElementById('tr-active-screen').style.display === 'block') {
        window.testCheatCount++;
        
        if (document.getElementById('cheat-force-return')) return;

        const overlay = document.createElement('div');
        overlay.id = 'cheat-force-return';
        overlay.innerHTML = `
            <div style="font-size:60px; margin-bottom:20px;">⚠️</div>
            <h2 style="color:var(--danger); font-size:24px; margin-bottom:10px;">ПОРУШЕННЯ ВИЯВЛЕНО!</h2>
            <p style="font-size:16px; max-width:400px; line-height:1.5;">Ви покинули повноекранний режим. Спроба згорнути вікно або відкрити іншу вкладку зафіксована у звіті вчителя.<br><br><b>Штраф: +1 вихід з екрану.</b></p>
            <button id="btn-return-fs" style="margin-top:30px; padding:16px 40px; background:var(--primary); color:white; border:none; border-radius:16px; font-weight:800; font-size:18px; cursor:pointer; box-shadow:0 10px 25px rgba(59,130,246,0.4);">ПОВЕРНУТИСЯ ДО ТЕСТУ</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btn-return-fs').onclick = () => {
            document.documentElement.requestFullscreen().then(() => {
                overlay.remove();
            }).catch(err => alert('Дозвольте повний екран!'));
        };
    }
};

window.renderCurrentQuestion = function() {
    const q = window.activeTest.questions[window.currentQIndex];
    document.getElementById('tr-current-info').innerText = `Питання ${window.currentQIndex + 1} / ${window.activeTest.questions.length}`;
    document.getElementById('tr-progress').style.width = ((window.currentQIndex) / window.activeTest.questions.length * 100) + '%';

    let html = `<div class="tr-q-box active" style="animation: slideIn 0.4s ease;"><div class="tr-q-text">${q.q || q.question || q.text || ''}</div>`;
    
    if (q.type === 'open') {
        html += `<textarea class="tr-textarea" id="tr-ans-field" placeholder="Введіть Вашу відповідь тут..."></textarea>`;
    } else {
        const inputType = q.type === 'multi' ? 'checkbox' : 'radio';
        (q.options || q.answers || []).forEach((opt, idx) => {
            html += `
                <label class="tr-opt-label">
                    <input type="${inputType}" name="tr-opt" value="${idx}" style="accent-color:var(--primary); transform:scale(1.5); margin-right:10px;">
                    <span>${opt}</span>
                </label>`;
        });
    }
    html += `</div>`;
    document.getElementById('tr-questions-area').innerHTML = html;
};

window.submitCurrentAnswer = async function() {
    const q = window.activeTest.questions[window.currentQIndex];
    let userVal = null;
    let correct = false;

    const btn = document.getElementById('tr-next-btn');
    btn.disabled = true; btn.innerText = "⏳ ПЕРЕВІРКА...";

    if (q.type === 'open') {
        userVal = document.getElementById('tr-ans-field').value.trim();
        if (!userVal) { btn.disabled = false; btn.innerText = "Зберегти відповідь"; return alert('Будь ласка, напишіть відповідь!'); }
        correct = await window.aiCheckOpenAnswer(q.q || q.question || q.text, userVal);
    } else {
        const checked = Array.from(document.querySelectorAll('input[name="tr-opt"]:checked')).map(i => parseInt(i.value));
        if (checked.length === 0) { btn.disabled = false; btn.innerText = "Зберегти відповідь"; return alert('Оберіть варіант!'); }
        userVal = checked;
        const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
        correct = checked.length === correctArr.length && checked.every(v => correctArr.includes(v));
    }

    if(correct) window.testScore++;
    window.testAnswers.push({ qIndex: window.currentQIndex, answer: userVal, isCorrect: correct });

    const toast = document.getElementById('toast-success');
    toast.innerHTML = '<div class="toast-check">ПИТАННЯ<br>ЗАРАХОВАНО</div>';
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 1000);

    window.currentQIndex++;
    btn.disabled = false; btn.innerText = "Зберегти відповідь";

    if (window.currentQIndex >= window.activeTest.questions.length) window.finishTest();
    else window.renderCurrentQuestion();
};

// === ПЕРЕВІРКА ШІ ВІДКРИТИХ ПИТАНЬ (ГІБРИДНА) ===
window.aiCheckOpenAnswer = async function(question, answer) {
    try {
        const prompt = `Питання: "${question}". Відповідь учня: "${answer}". Чи вірна суть? Відповідай ТІЛЬКИ "true" або "false".`;
        
        // Спочатку Gemini
        const apiKeys = window.APP_CONFIG?.GEMINI_API_KEYS || [];
        for (let key of apiKeys) {
            if(!key) continue;
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key.trim()}`;
                const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
                if (res.ok) {
                    const data = await res.json();
                    return data.candidates?.[0]?.content?.parts?.[0]?.text.toLowerCase().includes('true');
                }
            } catch(e) {}
        }

        // Резерв 1: Airforce
        try {
            const res = await fetch('https://api.airforce/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], model: 'gpt-4o-mini', temperature: 0.1 })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content || "";
                return text.toLowerCase().includes('true');
            }
        } catch(e) {}
        
    } catch(e) {}
    return false; // Якщо всі сервери впали, не зараховуємо, але вчитель зможе виправити
};

// === 6. ЗАВЕРШЕННЯ ТЕСТУ ТА СТАТИСТИКА УЧНЯ ===
window.finishTest = async function() {
    document.removeEventListener('fullscreenchange', window.fullscreenCheatCheck);
    if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(e=>{});

    const endTime = Date.now();
    const resultData = {
        studentName: window.testTakerName,
        score: window.testScore,
        maxScore: window.activeTest.questions.length,
        cheatCount: window.testCheatCount,
        startTime: window.testStartTime,
        endTime: endTime,
        answers: window.testAnswers,
        email: window.currentUser ? window.currentUser.email : 'guest'
    };

    if (window.fbSaveTestResult) await window.fbSaveTestResult(window.activeTestId, resultData);

    const percent = Math.round((window.testScore / window.activeTest.questions.length) * 100);
    
    let promoHtml = '';
    if (!window.currentUser) {
        promoHtml = `
            <div style="margin-top:25px; padding:20px; background:var(--bg-main); border-radius:16px; border:2px dashed var(--primary);">
                <p style="font-size:14px; margin-bottom:15px;">Бажаєте зберігати свої досягнення? 🎓</p>
                <button onclick="window.exitRunner(); document.getElementById('auth-overlay').style.display='flex'; window.appAuthMode='register'; document.getElementById('register-fields').style.display='block'; document.getElementById('login-fields').style.display='none'; document.getElementById('auth-title').innerText='Реєстрація';" style="background:var(--primary); color:white; border:none; padding:12px 20px; border-radius:12px; font-weight:bold; cursor:pointer; width:100%;">ЗАРЕЄСТРУВАТИСЯ ЗАРАЗ</button>
            </div>
        `;
    }

    document.getElementById('tr-outro-screen').innerHTML = `
        <h1 style="color: var(--success); margin-bottom: 10px;">Тест завершено! 🎉</h1>
        <div style="font-size: 32px; font-weight: 900; color: var(--text-main);">${window.testScore} / ${window.activeTest.questions.length}</div>
        <div style="font-size: 18px; color: var(--primary); margin: 10px 0; font-weight:700;">Успішність: ${percent}%</div>
        <div style="font-size: 14px; background: rgba(239,68,68,0.1); color: var(--danger); padding: 8px 12px; border-radius: 10px; display: inline-block; font-weight:bold;">Порушень: ${window.testCheatCount}</div>
        
        <div style="display:flex; gap:10px; justify-content:center; margin-top:25px;">
            <button onclick="window.showStudentPostTestStats('mistakes')" style="flex:1; padding:12px; background:var(--bg-tab); border:1px solid var(--border); border-radius:12px; cursor:pointer; font-weight:600; color:var(--text-main);">📝 Мої помилки</button>
            <button onclick="window.showStudentPostTestStats('leaderboard')" style="flex:1; padding:12px; background:var(--bg-tab); border:1px solid var(--border); border-radius:12px; cursor:pointer; font-weight:600; color:var(--text-main);">🏆 Лідери</button>
        </div>
        
        <div id="tr-post-stats" style="margin-top:20px; display:none; max-height:250px; overflow-y:auto; border:1px solid var(--border); padding:15px; border-radius:12px; background:var(--bg-main);"></div>
        
        <button onclick="window.exitRunner()" style="width: 100%; margin-top:20px; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size:16px;">Повернутися на головну</button>
        ${promoHtml}
    `;

    document.getElementById('tr-active-screen').style.display = 'none';
    document.getElementById('tr-outro-screen').style.display = 'block';

    if (window.testScore === window.activeTest.questions.length && typeof window.triggerConfetti === 'function') {
        window.triggerConfetti();
    }
};

window.showStudentPostTestStats = async function(type) {
    const container = document.getElementById('tr-post-stats');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '<div style="text-align:center; color:var(--primary); font-weight:bold;">⏳ Завантаження...</div>';

    if (type === 'leaderboard') {
        try {
            const { collection, getDocs } = await getFirestoreDb();
            const snap = await getDocs(collection(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', `test_results_${window.activeTestId}`));
            let results = [];
            snap.forEach(d => results.push(d.data()));
            results.sort((a,b) => b.score - a.score || (a.endTime - a.startTime) - (b.endTime - b.startTime));
            
            let html = '<h3 style="margin-bottom:10px;">🏆 Таблиця лідерів</h3><table class="leaderboard-table"><tr><th>Місце</th><th>Учень</th><th>Бал</th></tr>';
            results.slice(0, 10).forEach((r, i) => {
                let medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : i+1;
                html += `<tr><td>${medal}</td><td>${r.studentName}</td><td>${r.score}</td></tr>`;
            });
            html += '</table>';
            container.innerHTML = html;
        } catch(e) { container.innerHTML = '<div style="color:var(--danger);">Помилка завантаження лідерів.</div>'; }
    } else if (type === 'mistakes') {
        let html = '<h3 style="margin-bottom:10px;">📝 Деталі відповідей</h3>';
        window.testAnswers.forEach(ans => {
            const q = window.activeTest.questions[ans.qIndex];
            const status = ans.isCorrect ? '✅ Вірно' : '❌ Невірно';
            
            let correctStr = '';
            if (q.type === 'single' || q.type === 'multi') {
                let cArr = Array.isArray(q.correct) ? q.correct : [q.correct];
                correctStr = cArr.map(idx => q.options[idx] || q.answers[idx]).join(', ');
            }

            let ansDisplay = Array.isArray(ans.answer) ? ans.answer.map(i => q.options[i]).join(', ') : ans.answer;
            if(!ansDisplay && !Array.isArray(ans.answer)) ansDisplay = ans.answer;

            html += `<div class="ans-card" style="text-align:left; font-size:13px;">
                <b>${ans.qIndex+1}. ${q.q || q.question || q.text || 'Без тексту'}</b><br>
                Ваша відповідь: <b>${ansDisplay || '-'}</b><br>
                Статус: ${status}<br>
                ${!ans.isCorrect && correctStr ? `<span style="color:var(--success); font-weight:bold;">Правильна: ${correctStr}</span>` : ''}
            </div>`;
        });
        container.innerHTML = html;
    }
};

window.exitRunner = function() {
    document.getElementById('test-runner-overlay').style.display = 'none';
    const url = new URL(window.location); url.searchParams.delete('t');
    window.history.pushState({}, '', url);
};

window.abortTest = () => { if(confirm('Дійсно вийти? Результати не буде збережено.')) window.exitRunner(); };

console.log("✅ Модуль tests.js завантажено повністю! (З вбудованими надійними Fallback-парсерами).");