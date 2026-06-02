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
// 🎨 ТВОРЧА МАЙСТЕРНЯ (ПРОГРАМУВАННЯ, АРТ, БЛОГИ)
// ==========================================

window.currentCrMode = 'prog';
window.currentCrSubMode = 'create';
window.tempArtBase64 = null;

// === ПЕРЕМИКАННЯ РЕЖИМІВ (Програмування / Малюнки / Статті) ===
window.setCreativeMode = function(modeName) {
    window.currentCrMode = modeName;
    
    const titles = { 'prog': '💻 Програмування', 'art': '🎨 Малюнки', 'blog': '✍️ Статті' };
    const createLabels = { 'prog': 'Створити код', 'art': 'Додати малюнок', 'blog': 'Створити статтю' };
    const myLabels = { 'prog': 'Мої коди', 'art': 'Мої малюнки', 'blog': 'Мої статті' };
    const publicLabels = { 'prog': 'Усі коди', 'art': 'Усі малюнки', 'blog': 'Усі статті' };

    // Зміна заголовка
    const titleEl = document.getElementById('cr-header-title');
    if (titleEl) titleEl.innerHTML = `${titles[modeName]} <svg style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-left:4px; margin-bottom:2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

    // Активна кнопка головного меню
    ['prog', 'art', 'blog'].forEach(m => {
        const btn = document.getElementById(`btn-cr-${m}`);
        if (btn) {
            if (m === modeName) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    // Оновлення тексту кнопок саб-меню
    const btnCreate = document.getElementById('btn-cr-sub-create');
    const btnMy = document.getElementById('btn-cr-sub-my');
    const btnPublic = document.getElementById('btn-cr-sub-public');

    if (btnCreate) btnCreate.innerText = createLabels[modeName];
    if (btnMy) btnMy.innerText = myLabels[modeName];
    if (btnPublic) btnPublic.innerText = publicLabels[modeName];

    // Ховаємо випадаюче меню
    const crModeTrigger = document.getElementById('cr-mode-trigger');
    if (crModeTrigger) crModeTrigger.classList.remove('show-modes');

    window.setCreativeSubMode(window.currentCrSubMode || 'create');
};

// === ПЕРЕМИКАННЯ САБ-РЕЖИМІВ (Створити / Мої / Усі) ===
window.setCreativeSubMode = function(subMode) {
    window.currentCrSubMode = subMode;

    ['create', 'my', 'public'].forEach(m => {
        const btn = document.getElementById(`btn-cr-sub-${m}`);
        if (btn) {
            if (m === subMode) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    const secCreate = document.getElementById('cr-section-create');
    const secGallery = document.getElementById('cr-section-gallery');

    if (subMode === 'create') {
        if (secGallery) secGallery.style.display = 'none';
        if (secCreate) secCreate.style.display = 'block';

        ['prog', 'art', 'blog'].forEach(m => {
            const el = document.getElementById(`cr-create-${m}`);
            if (el) el.style.display = (m === window.currentCrMode) ? 'block' : 'none';
        });
    } else {
        if (secCreate) secCreate.style.display = 'none';
        if (secGallery) secGallery.style.display = 'block';
        window.loadCreativeGallery();
    }
};

// === ЗАВАНТАЖЕННЯ ГАЛЕРЕЇ ===
window.loadCreativeGallery = async function() {
    const container = document.getElementById('cr-main-gallery');
    if (!container) return;
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px;">⏳ Завантаження шедеврів...</div>';
    
    try {
        const { collection, getDocs } = await getFirestoreDb();
        const snap = await getDocs(collection(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works'));
        let works = [];
        snap.forEach(d => works.push({id: d.id, ...d.data()}));
        
        // Фільтрація по типу
        works = works.filter(w => w.type === window.currentCrMode);
        
        // Фільтрація по автору (якщо обрано "Мої")
        if (window.currentCrSubMode === 'my') {
            const userEmail = window.currentUser ? window.currentUser.email : 'guest';
            works = works.filter(w => w.email === userEmail);
        }

        works.sort((a,b) => b.timestamp - a.timestamp);

        if(works.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px; background:var(--glass); border-radius:20px; border:1px dashed var(--border);">В цій категорії ще немає робіт.<br>Створіть щось нове! 🚀</div>`;
            return;
        }

        let html = '';
        works.forEach(w => {
            const dateStr = new Date(w.timestamp).toLocaleDateString();
            
            const deleteBtn = (window.currentUser && (window.currentUser.email === w.email || window.isSuperAdmin?.())) 
                ? `<button onclick="event.stopPropagation(); window.deleteCreativeWork('${w.id}')" style="background:var(--danger); color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:bold; margin-left:5px;">🗑️</button>` 
                : '';

            if (w.type === 'prog') {
                const codeBtn = w.settings?.publicCode ? `<button onclick="event.stopPropagation(); window.viewSourceCode('${w.id}')" style="background:var(--bg-tab); color:var(--text-main); border:1px solid var(--border); padding:6px 12px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:bold;">📄 Код</button>` : '';
                
                html += `
                    <div class="card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; border-color:var(--primary);">
                        <div style="background:#1e1e1e; color:#d4d4d4; padding:20px; font-family:'Consolas', monospace; font-size:12px; height:120px; overflow:hidden; position:relative;">
                            ${(w.content || '').substring(0, 150).replace(/</g, '&lt;')}...
                            <div style="position:absolute; inset:0; background:linear-gradient(transparent, #1e1e1e 90%); display:flex; align-items:flex-end; padding:15px; justify-content:center;">
                                <button onclick="window.playProgApp('${w.id}')" style="background:var(--primary); color:white; border:none; padding:8px 20px; border-radius:12px; cursor:pointer; font-weight:bold; box-shadow:0 4px 12px rgba(59,130,246,0.4);">▶️ Запустити</button>
                            </div>
                        </div>
                        <div style="padding:15px; background:var(--bg-tab);">
                            <h4 style="margin:0 0 5px 0; color:var(--text-main); font-size:15px;">💻 ${w.title}</h4>
                            <div style="font-size:12px; color:var(--text-muted);">Автор: <b>${w.author}</b> <span style="background:rgba(59,130,246,0.1); padding:2px 6px; border-radius:6px; color:var(--primary);">${w.class}</span></div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                                <div style="font-size:11px; color:var(--text-muted);">${dateStr}</div>
                                <div>${codeBtn} ${deleteBtn}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (w.type === 'art') {
                html += `
                    <div class="card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; border-color:var(--accent); cursor:pointer; transition:0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="window.viewArtFullscreen('${w.content}', '${w.title.replace(/'/g,"")}', '${w.author}')">
                        <img src="${w.content}" style="width:100%; height:220px; object-fit:cover; border-bottom:1px solid var(--border);" onerror="this.src='https://via.placeholder.com/300x200?text=Помилка'">
                        <div style="padding:15px; background:var(--bg-tab);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h4 style="margin:0 0 5px 0; color:var(--text-main); font-size:15px;">🎨 ${w.title}</h4>
                                <div onclick="event.stopPropagation();">${deleteBtn}</div>
                            </div>
                            <div style="font-size:12px; color:var(--text-muted);">Автор: <b>${w.author}</b> <span style="background:rgba(139,92,246,0.1); padding:2px 6px; border-radius:6px; color:var(--accent);">${w.class}</span></div>
                            <div style="font-size:11px; color:var(--border); margin-top:8px;">${dateStr}</div>
                        </div>
                    </div>
                `;
            } else if (w.type === 'blog') {
                html += `
                    <div class="card" style="padding:20px; display:flex; flex-direction:column; border-color:var(--success);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <h4 style="margin:0 0 10px 0; color:var(--text-main); font-size:16px;">✍️ ${w.title}</h4>
                            <div>${deleteBtn}</div>
                        </div>
                        <p style="font-size:13px; color:var(--text-muted); line-height:1.5; flex-grow:1; margin-bottom:15px; max-height:80px; overflow:hidden;">${w.content.substring(0, 150)}...</p>
                        <div style="font-size:12px; color:var(--text-muted); border-top:1px solid var(--border); padding-top:10px;">
                            Автор: <b>${w.author}</b> <span style="background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:6px; color:var(--success);">${w.class}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                            <div style="font-size:11px; color:var(--text-muted);">${dateStr}</div>
                            <button onclick="window.viewBlog('${w.id}')" style="background:var(--success); color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:bold;">Читати</button>
                        </div>
                    </div>
                `;
            }
        });
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--danger); padding:30px;">Помилка завантаження бази даних.</div>';
    }
};

window.deleteCreativeWork = async function(workId) {
    if (!confirm('Ви впевнені, що хочете видалити цю роботу?')) return;
    try {
        const { doc, deleteDoc } = await getFirestoreDb();
        await deleteDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        window.loadCreativeGallery();
    } catch(e) { alert("Помилка видалення: " + e.message); }
};

// ==========================================
// 💻 РЕЖИМ ПРОГРАМУВАННЯ (VS CODE IDE)
// ==========================================

window.ideVirtualFS = {}; 
window.activeIdeFile = 'index.html';

window.openIDE = function(existingCode = null) {
    if (!window.currentUser) {
        alert('⚠️ Щоб створювати проєкти, потрібно увійти в акаунт!');
        return;
    }
    
    document.getElementById('cr-ide-overlay').style.display = 'flex';
    
    // Ініціалізація ФС для програмування з мінімальним шаблоном
    if (existingCode && typeof existingCode === 'string') {
        window.ideVirtualFS = {
            'index.html': { type: 'text', content: existingCode }
        };
    } else {
        window.ideVirtualFS = {
            'index.html': { type: 'text', content: `<!DOCTYPE html>\n<html lang="uk">\n<head>\n  <meta charset="UTF-8">\n  <title>Новий проєкт</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n\n  <script src="script.js"><\/script>\n</body>\n</html>` }
        };
    }

    window.activeIdeFile = 'index.html';
    window.renderIdeSidebar();
    window.switchIdeFile('index.html');
    window.runIDECode();
};

window.closeIDE = function() {
    window.saveCurrentIdeFile();
    document.getElementById('cr-ide-overlay').style.display = 'none';
};

window.renderIdeSidebar = function() {
    const tree = document.getElementById('ide-file-tree');
    if(!tree) return;
    tree.innerHTML = '';
    
    for (let filename in window.ideVirtualFS) {
        const isImage = window.ideVirtualFS[filename].type === 'image';
        const icon = isImage ? '🖼️' : (filename.endsWith('.css') ? '🎨' : (filename.endsWith('.js') ? '⚡' : '📄'));
        
        const item = document.createElement('div');
        item.style.cssText = `padding: 6px 15px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${filename === window.activeIdeFile ? '#fff' : '#ccc'}; background: ${filename === window.activeIdeFile ? '#37373d' : 'transparent'};`;
        item.innerHTML = `<span>${icon}</span> <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${filename}</span> <span onclick="event.stopPropagation(); window.deleteIdeFile('${filename}')" style="color:#ef4444; font-size:10px; opacity:0.5; hover:opacity:1;">✕</span>`;
        
        if (!isImage) {
            item.onclick = () => window.switchIdeFile(filename);
        } else {
            item.onclick = () => alert(`Це зображення. Його не можна редагувати як текст, але ви можете використовувати його назву ('${filename}') в тезі <img> у вашому HTML!`);
        }
        
        tree.appendChild(item);
    }
};

window.switchIdeFile = function(filename) {
    window.saveCurrentIdeFile(); 
    window.activeIdeFile = filename;
    window.renderIdeSidebar();
    
    const tabs = document.getElementById('ide-tabs');
    if(tabs) {
        tabs.innerHTML = `<div style="padding:10px 20px; background:#1e1e1e; color:white; font-size:13px; border-top:2px solid #3b82f6;">${filename}</div>`;
    }
    
    const editor = document.getElementById('cr-ide-editor');
    if(editor) {
        editor.value = window.ideVirtualFS[filename].content || '';
    }
};

window.saveCurrentIdeFile = function() {
    const editor = document.getElementById('cr-ide-editor');
    if (editor && window.ideVirtualFS[window.activeIdeFile] && window.ideVirtualFS[window.activeIdeFile].type === 'text') {
        window.ideVirtualFS[window.activeIdeFile].content = editor.value;
    }
};

window.addNewIdeFile = function() {
    const name = prompt("Назва файлу (наприклад: main.js, style.css):");
    if (!name) return;
    if (window.ideVirtualFS[name]) return alert("Файл з таким іменем вже існує!");
    
    window.ideVirtualFS[name] = { type: 'text', content: '' };
    window.switchIdeFile(name);
};

window.deleteIdeFile = function(filename) {
    if(filename === 'index.html') return alert("Головний файл index.html видаляти не можна!");
    if(confirm(`Видалити ${filename}?`)) {
        delete window.ideVirtualFS[filename];
        if(window.activeIdeFile === filename) window.switchIdeFile('index.html');
        else window.renderIdeSidebar();
        window.runIDECode();
    }
};

window.handleIDEUpload = async function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = file.webkitRelativePath || file.name; 
        
        const isImage = file.type.startsWith('image/');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            window.ideVirtualFS[filename] = {
                type: isImage ? 'image' : 'text',
                content: e.target.result
            };
            window.renderIdeSidebar();
            window.runIDECode(); 
        };
        
        if (isImage) {
            reader.readAsDataURL(file); 
        } else {
            reader.readAsText(file); 
        }
    }
    event.target.value = ''; 
};

window.runIDECode = function() {
    window.saveCurrentIdeFile();
    
    let html = window.ideVirtualFS['index.html'] ? window.ideVirtualFS['index.html'].content : '';
    
    let injectedCSS = '';
    let injectedJS = '';

    for (let filename in window.ideVirtualFS) {
        const file = window.ideVirtualFS[filename];
        
        if (file.type === 'text') {
            if (filename.endsWith('.css')) injectedCSS += `\n/* Файл: ${filename} */\n${file.content}\n`;
            if (filename.endsWith('.js')) injectedJS += `\n/* Файл: ${filename} */\n${file.content}\n`;
        }
        
        if (file.type === 'image') {
            const regex = new RegExp(filename.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            html = html.replace(regex, file.content);
            injectedCSS = injectedCSS.replace(regex, file.content);
        }
    }

    if (injectedCSS) {
        if (html.includes('</head>')) html = html.replace('</head>', `<style>\n${injectedCSS}\n</style></head>`);
        else html = `<style>\n${injectedCSS}\n</style>\n` + html;
    }

    if (injectedJS) {
        if (html.includes('</body>')) html = html.replace('</body>', `<script>\n${injectedJS}\n<\/script></body>`);
        else html += `<script>\n${injectedJS}\n<\/script>`;
    }

    const preview = document.getElementById('cr-ide-preview');
    if (preview) preview.srcdoc = html;
};

window.handleCodeTab = function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.substring(0, start) + "    " + e.target.value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + 4;
        window.saveCurrentIdeFile();
    }
};

window.publishIDEProject = async function(btnEl) {
    if (!window.currentUser) return alert('⚠️ Потрібна авторизація!');
    
    const titleEl = document.getElementById('cr-prog-title');
    const title = titleEl ? titleEl.value.trim() : '';

    if (!title) return alert("Введіть назву вашого проєкту!");

    window.saveCurrentIdeFile();
    
    let finalHtml = window.ideVirtualFS['index.html'] ? window.ideVirtualFS['index.html'].content : '';
    let injectedCSS = '';
    let injectedJS = '';

    for (let filename in window.ideVirtualFS) {
        const file = window.ideVirtualFS[filename];
        if (file.type === 'text') {
            if (filename.endsWith('.css')) injectedCSS += `\n${file.content}\n`;
            if (filename.endsWith('.js')) injectedJS += `\n${file.content}\n`;
        }
        if (file.type === 'image') {
            const regex = new RegExp(filename.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            finalHtml = finalHtml.replace(regex, file.content);
            injectedCSS = injectedCSS.replace(regex, file.content);
        }
    }

    if (injectedCSS) {
        if (finalHtml.includes('</head>')) finalHtml = finalHtml.replace('</head>', `<style>${injectedCSS}</style></head>`);
        else finalHtml = `<style>${injectedCSS}</style>` + finalHtml;
    }
    if (injectedJS) {
        if (finalHtml.includes('</body>')) finalHtml = finalHtml.replace('</body>', `<script>${injectedJS}<\/script></body>`);
        else finalHtml += `<script>${injectedJS}<\/script>`;
    }

    if (!finalHtml || finalHtml.trim() === '') return alert("Ваш код порожній! Відкрийте редактор та напишіть щось.");
    if (finalHtml.length > 100 * 1024) {
        return alert("❌ Помилка: Розмір коду та вбудованих ресурсів перевищує ліміт у 100 КБ!");
    }

    const isPublicCode = document.getElementById('ide-set-public').checked;
    const isFullscreen = document.getElementById('ide-set-canvas').checked;
    const allowRemix = document.getElementById('ide-set-remix').checked;

    const workData = {
        type: 'prog',
        title: title,
        content: finalHtml, 
        author: `${window.currentUser.firstName} ${window.currentUser.lastName}`,
        email: window.currentUser.email,
        class: window.currentUser.userClass,
        timestamp: Date.now(),
        settings: {
            publicCode: isPublicCode,
            fullscreen: isFullscreen,
            allowRemix: allowRemix
        }
    };

    try {
        const originalText = btnEl.innerText;
        btnEl.innerText = '⏳ Завантаження...';
        btnEl.disabled = true;

        const { doc, setDoc } = await getFirestoreDb();
        const workId = 'cw_' + Date.now().toString(36);
        await setDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId), workData);
        
        alert('✅ Успішно опубліковано!');
        
        window.closeIDE();
        if (titleEl) titleEl.value = '';
        
        window.setCreativeSubMode('my');
        
        btnEl.innerText = originalText;
        btnEl.disabled = false;
    } catch(e) {
        alert('Помилка публікації: ' + e.message);
        btnEl.innerText = '🚀 Опублікувати проєкт';
        btnEl.disabled = false;
    }
};

window.playProgApp = async function(workId) {
    try {
        const { doc, getDoc } = await getFirestoreDb();
        const snap = await getDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        if(!snap.exists()) return alert("Роботу не знайдено!");
        const data = snap.data();

        const isFs = data.settings?.fullscreen;
        const padding = isFs ? '0' : '20px';
        const brRadius = isFs ? '0' : '16px';
        const overlayId = 'play-app-overlay-' + Date.now();
        const iconLabel = '💻';

        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.style.cssText = `position:fixed; inset:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; padding:${padding}; backdrop-filter:blur(10px); animation: fadeIn 0.3s ease;`;
        overlay.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:${isFs?'0':'15px'}; color:white; background:${isFs?'#1e1e1e':'rgba(255,255,255,0.05)'}; padding:10px 20px; border-radius:${isFs?'0':'16px'}; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; align-items:center; gap:15px;">
                    <h2 style="margin:0; font-size:16px;">${iconLabel} ${data.title}</h2>
                    <span style="font-size:12px; color:#94a3b8;">${data.author}</span>
                </div>
                <button onclick="document.getElementById('${overlayId}').remove()" style="background:var(--danger); color:white; border:none; padding:6px 15px; border-radius:8px; cursor:pointer; font-weight:800;">✕ ЗАКРИТИ</button>
            </div>
            <div style="flex:1; border-radius:${brRadius}; overflow:hidden; background:white; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                <iframe srcdoc="${(data.content || '').replace(/"/g, '&quot;')}" style="width:100%; height:100%; border:none; background:white;"></iframe>
            </div>
        `;
        document.body.appendChild(overlay);
    } catch(e) { alert("Помилка завантаження."); }
};

window.viewSourceCode = async function(workId) {
    try {
        const { doc, getDoc } = await getFirestoreDb();
        const snap = await getDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        if(!snap.exists()) return;
        const data = snap.data();

        if (!data.settings?.publicCode && (!window.currentUser || window.currentUser.email !== data.email) && !window.isSuperAdmin()) {
            return alert("Автор приховав вихідний код.");
        }

        const overlayId = 'view-code-overlay-' + Date.now();
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.style.cssText = `position:fixed; inset:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; padding:20px; backdrop-filter:blur(10px);`;
        
        let remixBtn = '';
        if (data.settings?.allowRemix) {
            remixBtn = `<button onclick="document.getElementById('${overlayId}').remove(); window.openIDE(decodeURIComponent('${encodeURIComponent(data.content)}'))" style="background:var(--accent); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold; margin-right:10px;">✂️ Зробити Ремікс</button>`;
        }

        overlay.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; color:white;">
                <h2 style="margin:0; font-size:18px;">📄 Код: ${data.title}</h2>
                <div>
                    ${remixBtn}
                    <button onclick="document.getElementById('${overlayId}').remove()" style="background:var(--danger); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:800;">✕ ЗАКРИТИ</button>
                </div>
            </div>
            <textarea readonly style="flex:1; background:#1e1e1e; color:#d4d4d4; font-family:'Consolas', monospace; font-size:14px; padding:20px; border-radius:16px; border:none; outline:none; resize:none;">${data.content}</textarea>
        `;
        document.body.appendChild(overlay);
    } catch(e) {}
};

// ==========================================
// 🎨 РЕЖИМ МАЛЮНКІВ (КАМЕРА / ГАЛЕРЕЯ)
// ==========================================

window.openArtUploader = function() {
    if (!window.currentUser) {
        alert('⚠️ Щоб додавати малюнки, потрібно увійти в акаунт!');
        return;
    }
    document.getElementById('cr-art-preview').style.display = 'none';
    document.getElementById('cr-art-preview').src = '';
    document.getElementById('cr-art-title').value = '';
    document.getElementById('cr-art-file').click();
};

window.handleArtUpload = function(event) {
    const file = event.target.files[0]; 
    if (file) { 
        const reader = new FileReader(); 
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas'); 
                const MAX_WIDTH = 1000; 
                let width = img.width;
                let height = img.height; 
                
                if (width > MAX_WIDTH) { 
                    height = Math.round(height * MAX_WIDTH / width); 
                    width = MAX_WIDTH; 
                } 
                
                canvas.width = width; 
                canvas.height = height; 
                const ctx = canvas.getContext('2d'); 
                ctx.fillStyle = '#FFFFFF'; 
                ctx.fillRect(0, 0, width, height); 
                ctx.drawImage(img, 0, 0, width, height); 
                
                window.tempArtBase64 = canvas.toDataURL('image/jpeg', 0.7); 
                const previewImg = document.getElementById('cr-art-preview');
                if (previewImg) {
                    previewImg.src = window.tempArtBase64;
                    previewImg.style.display = 'block';
                }
            };
            img.src = e.target.result;
        }; 
        reader.readAsDataURL(file); 
    } 
    event.target.value = ''; 
};

window.publishArtWork = async function(btnEl) {
    const title = document.getElementById('cr-art-title').value.trim();
    if (!title) return alert("Введіть назву вашого твору!");
    if (!window.tempArtBase64) return alert("Завантажте або зробіть фото!");

    const workData = {
        type: 'art',
        title: title,
        content: window.tempArtBase64,
        author: `${window.currentUser.firstName} ${window.currentUser.lastName}`,
        email: window.currentUser.email,
        class: window.currentUser.userClass,
        timestamp: Date.now(),
        likes: 0
    };

    try {
        const originalText = btnEl.innerText;
        btnEl.innerText = '⏳ Завантаження...';
        btnEl.disabled = true;

        const { doc, setDoc } = await getFirestoreDb();
        const workId = 'cw_' + Date.now().toString(36);
        await setDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId), workData);
        
        alert('✅ Ваш малюнок успішно опубліковано!');
        
        window.tempArtBase64 = null;
        document.getElementById('cr-art-title').value = '';
        document.getElementById('cr-art-preview').style.display = 'none';
        
        window.setCreativeSubMode('my');
        btnEl.innerText = originalText;
        btnEl.disabled = false;
    } catch(e) {
        alert('Помилка: ' + e.message);
        btnEl.innerText = '🚀 Опублікувати';
        btnEl.disabled = false;
    }
};

window.viewArtFullscreen = function(src, title, author) {
    const overlayId = 'view-art-overlay-' + Date.now();
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(10px); cursor:pointer; padding:20px;`;
    overlay.innerHTML = `
        <img src="${src}" style="max-width:100%; max-height:85vh; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.5); object-fit:contain;">
        <div style="color:white; margin-top:15px; text-align:center;">
            <h2 style="margin:0; font-size:20px;">${title}</h2>
            <p style="color:#94a3b8; font-size:14px; margin-top:5px;">Автор: ${author}</p>
        </div>
        <button onclick="event.stopPropagation(); document.getElementById('${overlayId}').remove()" style="position:absolute; top:20px; right:20px; background:var(--danger); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:800;">✕ ЗАКРИТИ</button>
    `;
    overlay.onclick = () => document.getElementById(overlayId).remove();
    document.body.appendChild(overlay);
};

// ==========================================
// ✍️ РЕЖИМ СТАТТЕЙ ТА БЛОГІВ
// ==========================================

window.publishBlogWork = async function(btnEl) {
    if (!window.currentUser) return alert('⚠️ Потрібна авторизація!');
    const title = document.getElementById('cr-blog-title').value.trim();
    const content = document.getElementById('cr-blog-content').value.trim();
    if (!title || !content) return alert("Заповніть всі поля!");

    const workData = {
        type: 'blog', title: title, content: content,
        author: `${window.currentUser.firstName} ${window.currentUser.lastName}`,
        email: window.currentUser.email, class: window.currentUser.userClass,
        timestamp: Date.now(), likes: 0
    };

    try {
        const originalText = btnEl.innerText;
        btnEl.innerText = '⏳ Завантаження...';
        btnEl.disabled = true;

        const { doc, setDoc } = await getFirestoreDb();
        const workId = 'cw_' + Date.now().toString(36);
        await setDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId), workData);
        
        alert('✅ Статтю опубліковано!');
        
        document.getElementById('cr-blog-title').value = '';
        document.getElementById('cr-blog-content').value = '';
        
        window.setCreativeSubMode('my');
        btnEl.innerText = originalText;
        btnEl.disabled = false;
    } catch(e) { 
        alert('Помилка: ' + e.message); 
        btnEl.innerText = '🚀 Опублікувати';
        btnEl.disabled = false;
    }
};

window.viewBlog = async function(workId) {
    try {
        const { doc, getDoc } = await getFirestoreDb();
        const snap = await getDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        if(!snap.exists()) return;
        const data = snap.data();

        const overlayId = 'view-blog-overlay-' + Date.now();
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.style.cssText = `position:fixed; inset:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; padding:20px; backdrop-filter:blur(10px); overflow-y:auto;`;
        overlay.innerHTML = `
            <div style="max-width:800px; width:100%; margin:0 auto; background:var(--bg-main); padding:30px; border-radius:16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:15px;">
                    <div>
                        <h2 style="margin:0 0 5px 0; font-size:24px; color:var(--text-main);">${data.title}</h2>
                        <p style="margin:0; font-size:13px; color:var(--text-muted);">Автор: <b>${data.author}</b> (${data.class}) • ${new Date(data.timestamp).toLocaleString()}</p>
                    </div>
                    <button onclick="document.getElementById('${overlayId}').remove()" style="background:var(--danger); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:800;">✕ ЗАКРИТИ</button>
                </div>
                <div style="font-size:15px; color:var(--text-main); line-height:1.6; white-space:pre-wrap;">${(data.content || '').replace(/</g, '&lt;')}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    } catch(e) {}
};

console.log("🎨 Модуль creative.js (оновлений) завантажено успішно!");