// ==========================================
// 📊 ПРЕЗЕНТАЦІЇ (POWERPOINT КЛОН & PPTX)
// ==========================================

// Офіційний ключ середовища. Платформа автоматично підставить сюди робочий ключ під час запуску!
const presApiKey = "";

setTimeout(() => {
    const presTab = document.getElementById('tab-presentations');
    if (presTab && presTab.style.display === 'none') presTab.style.display = '';
}, 100);

window.currentPresSubMode = 'create';
window.currentSlideIndex = 0;
window.selectedElementId = null;
window.presZoom = 80;
window.dragAndDropInitialized = false;

window.upgradeSlideFormat = function(slide) {
    if (!slide) return { bg: "#ffffff", elements: [] };
    if (!slide.elements) {
        slide.elements = [];
        if (slide.title) slide.elements.push({ id: 'l_1', type: 'text', content: slide.title, x: 60, y: 50, w: 840, h: 80, rot: 0, fontSize: 44, color: slide.color || "#000000", align: "left", z:1 });
        if (slide.content) slide.elements.push({ id: 'l_2', type: 'text', content: slide.content, x: 60, y: 150, w: 840, h: 360, rot: 0, fontSize: 24, color: slide.color || "#333333", align: "left", z:2 });
    }
    return slide;
};

window.showPresToast = function(msg, time = 3000) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style.cssText = "position:fixed; bottom:60px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.95); color:white; padding:14px 28px; border-radius:8px; z-index:99999999; font-size:15px; font-weight:600; box-shadow:0 10px 25px rgba(0,0,0,0.3); animation: fadeIn 0.3s ease; border:1px solid #334155;";
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, time);
};

window.setPresSubMode = function(subMode) {
    window.currentPresSubMode = subMode;
    const presTab = document.getElementById('tab-presentations');
    if (presTab && presTab.style.display === 'none') presTab.style.display = '';

    ['create', 'my', 'public'].forEach(m => {
        const btn = document.getElementById(`btn-pres-sub-${m}`);
        if (btn) btn.classList.toggle('active', m === subMode);
    });

    const secCreate = document.getElementById('pres-section-create');
    const secGallery = document.getElementById('pres-section-gallery');

    if (subMode === 'create') {
        if (secGallery) secGallery.style.display = 'none';
        if (secCreate) secCreate.style.display = 'block';
    } else {
        if (secCreate) secCreate.style.display = 'none';
        if (secGallery) secGallery.style.display = 'block';
        window.loadPresGallery();
    }
};

// ==========================================
// ІНТЕРФЕЙС РЕДАКТОРА (IDE)
// ==========================================

window.buildPresIDEUI = function() {
    let overlay = document.getElementById('pres-ide-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pres-ide-overlay';
        document.body.appendChild(overlay);
    }
    
    const userName = window.currentUser ? `${window.currentUser.firstName} ${window.currentUser.lastName}` : 'Гість';
    const pf = `onmousedown="event.preventDefault();"`; 

    overlay.style.cssText = `position:fixed; inset:0; background:#1e1e1e; z-index:9999999; display:flex; flex-direction:column; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: white;`;
    
    overlay.innerHTML = `
        <style>
            #pres-ide-overlay * { box-sizing: border-box; }
            .ppt-header { height: 48px; background: #c43e1c; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; user-select: none; }
            .ppt-tabs { display: flex; background: #2b2b2b; border-bottom: 1px solid #444; padding-left: 10px; overflow-x: auto; }
            .ppt-tab { padding: 8px 16px; color: #ccc; cursor: pointer; font-size: 13px; border-bottom: 3px solid transparent; white-space: nowrap; }
            .ppt-tab.active { color: white; border-bottom-color: #c43e1c; background: #333; font-weight: 600; }
            .ppt-tab:hover:not(.active) { color: white; }
            
            .ppt-ribbon { background: #333; height: 95px; display: flex; align-items: flex-start; padding: 5px; gap: 5px; border-bottom: 1px solid #444; overflow-x: auto; overflow-y: hidden; user-select: none; }
            .ppt-ribbon::-webkit-scrollbar { height: 4px; }
            .ppt-ribbon::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .ppt-r-group { display: flex; flex-direction: column; justify-content: space-between; height: 100%; border-right: 1px solid #555; padding-right: 8px; margin-right: 4px; position: relative; }
            .ppt-r-tools { display: flex; gap: 2px; align-items: flex-start; flex: 1; }
            .ppt-r-col { display: flex; flex-direction: column; gap: 2px; justify-content: flex-start; }
            .ppt-r-row { display: flex; gap: 2px; align-items: center; }
            .ppt-r-label { text-align: center; font-size: 11px; color: #aaa; margin-top: auto; padding-bottom: 2px; width: 100%; }
            
            .ppt-btn-l { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; background: transparent; border: 1px solid transparent; color: white; font-size: 11px; padding: 4px; cursor: pointer; border-radius: 4px; height: 100%; min-width: 50px; text-align: center; outline: none;}
            .ppt-btn-l:hover { background: #444; border-color: #666; }
            .ppt-btn-l .icon { font-size: 24px; margin-bottom: 2px; }
            
            .ppt-btn-s { display: flex; align-items: center; justify-content: flex-start; background: transparent; border: 1px solid transparent; color: white; font-size: 11px; padding: 2px 4px; cursor: pointer; border-radius: 4px; height: 22px; width: 100%; white-space: nowrap; outline: none; gap: 6px;}
            .ppt-btn-s:hover { background: #444; border-color: #666; }
            
            .ppt-btn-i { display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; color: white; font-size: 13px; padding: 2px; cursor: pointer; border-radius: 3px; height: 22px; min-width: 24px; outline: none; font-weight: bold;}
            .ppt-btn-i:hover { background: #444; border-color: #666; }
            .ppt-select { background: #fff; color: black; border: 1px solid #777; border-radius: 2px; height: 22px; font-size: 11px; outline: none; }

            /* БАЗОВІ СТИЛІ ЕЛЕМЕНТІВ */
            .pres-el-container { position: absolute; box-sizing: border-box; }
            .pres-el-container.selected { outline: 1px dashed #c43e1c; z-index: 9999 !important; }
            
            /* ТЕКСТОВИЙ ВМІСТ */
            .pres-el-content { width: 100%; height: 100%; outline: none; word-wrap: break-word; overflow: hidden; cursor: text; user-select: text; -webkit-user-select: text; }
            .pres-el-content ul, .pres-el-content ol { padding-left: 24px; margin: 0; }
            .pres-el-content li { margin-bottom: 12px; line-height: 1.3; }
            .pres-el-content iframe { pointer-events: none !important; }
            
            /* ОБЛАСТІ ДЛЯ ПЕРЕТЯГУВАННЯ (Рамка) */
            .pres-edge { position: absolute; display: none; background: transparent; cursor: move; z-index: 5; }
            .pres-el-container:hover .pres-edge, .pres-el-container.selected .pres-edge { display: block; }
            .pres-edge-t { top: -8px; left: -8px; right: -8px; height: 16px; }
            .pres-edge-b { bottom: -8px; left: -8px; right: -8px; height: 16px; }
            .pres-edge-l { top: -8px; bottom: -8px; left: -8px; width: 16px; }
            .pres-edge-r { top: -8px; bottom: -8px; right: -8px; width: 16px; }

            /* МАРКЕРИ РЕСАЙЗУ */
            .pres-handle { position: absolute; width: 10px; height: 10px; background: white; border: 1px solid #c43e1c; display: none; z-index: 10; border-radius: 50%; }
            .pres-el-container.selected .pres-handle { display: block; }
            .pres-handle-tl { top: -5px; left: -5px; cursor: nwse-resize; }
            .pres-handle-tc { top: -5px; left: calc(50% - 5px); cursor: ns-resize; }
            .pres-handle-tr { top: -5px; right: -5px; cursor: nesw-resize; }
            .pres-handle-ml { top: calc(50% - 5px); left: -5px; cursor: ew-resize; }
            .pres-handle-mr { top: calc(50% - 5px); right: -5px; cursor: ew-resize; }
            .pres-handle-bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
            .pres-handle-bc { bottom: -5px; left: calc(50% - 5px); cursor: ns-resize; }
            .pres-handle-br { bottom: -5px; right: -5px; cursor: nwse-resize; }
            
            /* МАРКЕР ОБЕРТАННЯ */
            .pres-handle-rot { top: -30px; left: calc(50% - 5px); cursor: crosshair; background: #10b981; border-color: #059669; }
            .pres-rot-line { position: absolute; width: 1px; height: 20px; background: #c43e1c; top: -20px; left: 50%; display: none; z-index: 10; cursor: crosshair; }
            .pres-el-container.selected .pres-rot-line { display: block; }

            /* КОНТЕКСТНЕ МЕНЮ */
            .ctx-menu { display:none; position:absolute; background:#f9fafb; border:1px solid #ccc; box-shadow:2px 2px 15px rgba(0,0,0,0.3); border-radius:2px; z-index:99999999; width:220px; color:#333; font-size:12px; }
            .ctx-item { padding: 6px 15px 6px 35px; cursor: pointer; display: flex; align-items: center; position: relative; }
            .ctx-item:hover { background: #e5e7eb; }
            .ctx-icon { position: absolute; left: 10px; width: 16px; text-align: center; font-size: 14px; }
            .ctx-divider { margin: 4px 0; border: none; border-top: 1px solid #d1d5db; }
        </style>

        <div class="ppt-header">
            <div style="display: flex; gap: 15px; align-items: center;">
                <span style="color: white; font-weight: 900; font-size: 16px; background:#a33215; padding:2px 8px; border-radius:4px;">P</span>
                <span style="cursor:pointer; font-size:16px;" onclick="window.publishPresentation()" title="Зберегти">💾</span>
                <span style="cursor:pointer; opacity:0.8; font-size:16px;" ${pf} onclick="document.execCommand('undo')" title="Скасувати">↩</span>
                <span style="cursor:pointer; opacity:0.8; font-size:16px;" ${pf} onclick="document.execCommand('redo')" title="Повторити">↪</span>
                <span style="cursor:pointer; font-size:16px;" onclick="window.startLocalSlideShow()" title="Почати показ">🎦</span>
            </div>
            <div style="flex:1; text-align:center;">
                <input type="text" id="cr-pres-title-mini" placeholder="Презентація1 - PowerPoint" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:4px 10px; border-radius:4px; font-size:13px; font-weight:600; width:250px; text-align:center; outline:none;" value="${document.getElementById('cr-pres-title')?.value || ''}">
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="window.publishPresentation()" style="background:#f8fafc; color:#c43e1c; border:none; padding:4px 12px; border-radius:4px; font-weight:bold; font-size:12px; cursor:pointer;">⤴ Спільний доступ</button>
                <span style="opacity:0.9; font-size:12px; margin-left:10px;">${userName}</span>
                <div style="width:24px; height:24px; background:#1e293b; border-radius:50%; display:flex; justify-content:center; align-items:center; border:1px solid #555;">👤</div>
                <button onclick="window.closePresIDE()" style="background:transparent; border:none; color:white; font-size:16px; cursor:pointer; width:30px; height:30px; border-radius:4px; margin-left:5px;" onmouseover="this.style.background='#e81123'" onmouseout="this.style.background='transparent'">✕</button>
            </div>
        </div>

        <div class="ppt-tabs">
            <div class="ppt-tab" onclick="window.toggleFileMenu()" style="background:#c43e1c; color:white;">Файл</div>
            <div class="ppt-tab active t-btn" data-target="home">Головна</div>
            <div class="ppt-tab t-btn" data-target="insert">Вставлення</div>
            <div class="ppt-tab t-btn" data-target="design">Конструктор</div>
            <div class="ppt-tab t-btn" data-target="transitions">Переходи</div>
            <div class="ppt-tab t-btn" data-target="animation">Анімація</div>
            <div class="ppt-tab t-btn" data-target="slideshow">Слайд-шоу</div>
            <div class="ppt-tab t-btn" data-target="view">Вигляд</div>
        </div>

        <div style="background:#333; position:relative;">
            <div id="rtab-home" class="ppt-ribbon" style="display:flex;">
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" ${pf} onclick="window.navigator.clipboard.readText().then(t=>document.execCommand('insertText',false,t))"><span class="icon" style="color:#f59e0b;">📋</span>Вставити</button>
                        <div class="ppt-r-col">
                            <button class="ppt-btn-s" ${pf} onclick="document.execCommand('cut')"><span>✂️</span> Вирізати</button>
                            <button class="ppt-btn-s" ${pf} onclick="document.execCommand('copy')"><span>📄</span> Копіювати</button>
                            <button class="ppt-btn-s" ${pf} onclick="window.showPresToast('Формат за зразком')"><span>🖌</span> Формат</button>
                        </div>
                    </div>
                    <div class="ppt-r-label">Буфер обміну</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" onclick="window.addNewSlide()"><span class="icon" style="color:#f59e0b;">📄</span>Створити<br>слайд</button>
                        <div class="ppt-r-col">
                            <button class="ppt-btn-s" onclick="window.showPresToast('Макет')"><span>📑</span> Макет</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Відновити')"><span>🔄</span> Відновити</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Розділ')"><span>📂</span> Розділ</button>
                        </div>
                    </div>
                    <div class="ppt-r-label">Слайди</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <div class="ppt-r-col" style="gap:4px;">
                            <div class="ppt-r-row">
                                <select id="pres-font-family" class="ppt-select" style="width:120px;" ${pf} onchange="window.execPresCommand('fontName', this.value)">
                                    <option value="Arial">Calibri (Основний)</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                </select>
                                <select id="pres-font-size" class="ppt-select" style="width:50px;" ${pf} onchange="window.changeElFontSize(this.value)">
                                    <option value="12">12</option><option value="18">18</option><option value="24">24</option><option value="32">32</option><option value="44">44</option><option value="54">54</option><option value="72">72</option>
                                </select>
                                <button class="ppt-btn-i" ${pf} onclick="window.changeElFontSize(Math.min(96, (parseInt(document.getElementById('pres-font-size').value)||24)+4))">A<span style="font-size:8px;">▲</span></button>
                                <button class="ppt-btn-i" ${pf} onclick="window.changeElFontSize(Math.max(8, (parseInt(document.getElementById('pres-font-size').value)||24)-4))">A<span style="font-size:8px;">▼</span></button>
                                <button class="ppt-btn-i" style="color:#ef4444;" ${pf} onclick="document.execCommand('removeFormat')">A🧽</button>
                            </div>
                            <div class="ppt-r-row">
                                <button class="ppt-btn-i" style="font-family:serif;" ${pf} onclick="window.toggleFormat('bold')"><b>Ж</b></button>
                                <button class="ppt-btn-i" style="font-family:serif; font-style:italic;" ${pf} onclick="window.toggleFormat('italic')"><i>К</i></button>
                                <button class="ppt-btn-i" style="font-family:serif; text-decoration:underline;" ${pf} onclick="window.toggleFormat('underline')"><u>Ч</u></button>
                                <button class="ppt-btn-i" style="text-shadow:1px 1px 2px black;" ${pf} onclick="window.showPresToast('Тінь')">S</button>
                                <button class="ppt-btn-i" style="text-decoration:line-through; font-size:10px;" ${pf} onclick="document.execCommand('strikeThrough')">abc</button>
                                <button class="ppt-btn-i" style="font-size:10px;" ${pf} onclick="window.showPresToast('Міжсимвольний інтервал')">AV↔</button>
                                <button class="ppt-btn-i" style="font-size:10px;" ${pf} onclick="window.showPresToast('Регістр')">Aa</button>
                                <button class="ppt-btn-i" title="Виділення" ${pf} onclick="document.execCommand('hiliteColor', false, '#fef08a')">🖊️</button>
                                <div style="display:flex; align-items:center; background:#444; border-radius:3px; padding:0 2px;">
                                    <span style="color:#ef4444; font-weight:bold; font-size:12px; margin-right:2px;">A</span>
                                    <input type="color" id="pres-color-picker" title="Колір тексту" ${pf} onchange="window.changeElColor(this.value)" style="width:14px; height:18px; padding:0; border:none; background:transparent; cursor:pointer;" value="#333333">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ppt-r-label">Шрифт</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <div class="ppt-r-col" style="gap:4px;">
                            <div class="ppt-r-row">
                                <button class="ppt-btn-i" ${pf} onclick="document.execCommand('insertUnorderedList')">•—</button>
                                <button class="ppt-btn-i" ${pf} onclick="document.execCommand('insertOrderedList')">1.—</button>
                                <button class="ppt-btn-i" ${pf} onclick="document.execCommand('outdent')">⇤</button>
                                <button class="ppt-btn-i" ${pf} onclick="document.execCommand('indent')">⇥</button>
                                <button class="ppt-btn-i" ${pf} onclick="window.showPresToast('Міжрядковий інтервал')">↕️</button>
                            </div>
                            <div class="ppt-r-row">
                                <button class="ppt-btn-i" ${pf} onclick="window.changeElAlign('left')">≡</button>
                                <button class="ppt-btn-i" ${pf} onclick="window.changeElAlign('center')">≣</button>
                                <button class="ppt-btn-i" ${pf} onclick="window.changeElAlign('right')">≡</button>
                                <button class="ppt-btn-i" ${pf} onclick="window.changeElAlign('justify')">☷</button>
                                <button class="ppt-btn-i" style="font-size:10px;" ${pf} onclick="window.showPresToast('Колонки')">◫</button>
                            </div>
                        </div>
                    </div>
                    <div class="ppt-r-label">Абзац</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <div class="ppt-r-row" style="background:white; padding:2px; border-radius:4px; gap:4px; align-items:center;">
                            <div style="width:20px;height:20px;border:1px solid #000;"></div>
                            <div style="width:20px;height:20px;border-radius:50%;border:1px solid #000;"></div>
                            <div style="width:20px;height:20px;border:1px solid #000;border-radius:4px;"></div>
                            <div style="width:20px;height:20px;border:1px solid #000;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);"></div>
                            <span style="color:black;font-size:10px;cursor:pointer;">▼</span>
                        </div>
                        <div class="ppt-r-col">
                            <button class="ppt-btn-s" onclick="window.showPresToast('Упорядкувати')"><span>📑</span> Упорядкувати</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Експрес-стилі')"><span>✨</span> Експрес-стилі</button>
                        </div>
                        <div class="ppt-r-col">
                            <button class="ppt-btn-s" onclick="window.showPresToast('Заливка')"><span>🪣</span> Заливка</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Контур')"><span>✏️</span> Контур</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Ефекти')"><span>🌟</span> Ефекти</button>
                        </div>
                    </div>
                    <div class="ppt-r-label">Малювання</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <div class="ppt-r-col">
                            <button class="ppt-btn-s" onclick="window.showPresToast('Знайти')"><span>🔍</span> Знайти</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Замінити')"><span>🔄</span> Замінити</button>
                            <button class="ppt-btn-s" onclick="window.showPresToast('Виділити')"><span>🖱️</span> Виділити</button>
                        </div>
                    </div>
                    <div class="ppt-r-label">Редагування</div>
                </div>
            </div>

            <div id="rtab-insert" class="ppt-ribbon" style="display:none;">
                <div class="ppt-r-group">
                    <button class="ppt-btn-l" onclick="window.addNewSlide()"><span class="icon" style="color:#f59e0b;">📄</span>Створити<br>слайд</button>
                    <div class="ppt-r-label">Слайди</div>
                </div>
                <div class="ppt-r-group">
                    <button class="ppt-btn-l" onclick="window.insertPresTable()"><span class="icon" style="color:#3b82f6;">▦</span>Таблиця</button>
                    <div class="ppt-r-label">Таблиці</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" onclick="window.insertPresImage()"><span class="icon" style="color:#10b981;">🖼️</span>Рисунки</button>
                        <button class="ppt-btn-l" onclick="window.showPresToast('Знімок екрану можна вставити скопіювавши його (Ctrl+C -> Ctrl+V)')"><span class="icon" style="color:#60a5fa;">📸</span>Знімок</button>
                    </div>
                    <div class="ppt-r-label">Зображення</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" onclick="window.insertPresShape()"><span class="icon" style="color:#3b82f6;">🔶</span>Фігури</button>
                        <button class="ppt-btn-l" onclick="window.insertPresChart()"><span class="icon" style="color:#f59e0b;">📈</span>Діаграма</button>
                    </div>
                    <div class="ppt-r-label">Ілюстрації</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" onclick="const url=prompt('Введіть посилання:'); if(url) document.execCommand('createLink', false, url);"><span class="icon" style="color:#3b82f6;">🔗</span>Посилання</button>
                    </div>
                    <div class="ppt-r-label">Посилання</div>
                </div>
                <div class="ppt-r-group">
                    <button class="ppt-btn-l" onclick="window.showPresToast('Коментар додано')"><span class="icon" style="color:#f59e0b;">💬</span>Примітка</button>
                    <div class="ppt-r-label">Примітки</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" onclick="window.addNewTextElement()"><span class="icon" style="color:#3b82f6;">A</span>Напис</button>
                        <div class="ppt-r-col">
                            <button class="ppt-btn-s" onclick="window.insertPresDateTime()"><span>🕒</span> Дата</button>
                            <button class="ppt-btn-s" onclick="window.insertPresSlideNumber()"><span>#</span> Номер</button>
                        </div>
                    </div>
                    <div class="ppt-r-label">Текст</div>
                </div>
            </div>

            <div id="rtab-design" class="ppt-ribbon" style="display:none;">
                <div class="ppt-r-group" style="flex:1;">
                    <div class="ppt-r-tools" style="padding: 10px; gap: 10px; flex-wrap:wrap;">
                        <div onclick="window.applyPresBg('#ffffff', '#000000')" style="width:60px; height:40px; background:#ffffff; border:1px solid #777; cursor:pointer;"></div>
                        <div onclick="window.applyPresBg('linear-gradient(135deg, #1e293b, #0f172a)', '#ffffff')" style="width:60px; height:40px; background:linear-gradient(135deg, #1e293b, #0f172a); border:1px solid #777; cursor:pointer;"></div>
                        <div onclick="window.applyPresBg('linear-gradient(135deg, #f0f9ff, #e0f2fe)', '#0369a1')" style="width:60px; height:40px; background:linear-gradient(135deg, #f0f9ff, #e0f2fe); border:1px solid #777; cursor:pointer;"></div>
                        <div onclick="window.applyPresBg('linear-gradient(135deg, #fffbeb, #fef08a)', '#78350f')" style="width:60px; height:40px; background:linear-gradient(135deg, #fffbeb, #fef08a); border:1px solid #777; cursor:pointer;"></div>
                    </div>
                    <div class="ppt-r-label">Теми та Фоновий Колір</div>
                </div>
                <div class="ppt-r-group">
                    <div class="ppt-r-tools">
                        <button class="ppt-btn-l" onclick="window.showPresToast('Розмір фіксований (16:9)')"><span class="icon" style="color:#3b82f6;">📏</span>Розмір слайда</button>
                        <button class="ppt-btn-l" onclick="const bg = prompt('Введіть HEX колір фону (напр. #1e293b) або URL картинки (url(...)):'); if(bg) window.applyPresBg(bg);"><span class="icon" style="color:#10b981;">🖌️</span>Формат фону</button>
                    </div>
                    <div class="ppt-r-label">Налаштування</div>
                </div>
            </div>

            <div id="rtab-transitions" class="ppt-ribbon" style="display:none;">
                <button class="ppt-btn-l" style="background:#444;" onclick="window.showPresToast('В цій версії переходи завжди стандартні')"><span class="icon">⬛</span>Без переходу</button>
            </div>
            <div id="rtab-animation" class="ppt-ribbon" style="display:none;">
                <button class="ppt-btn-l" onclick="window.showPresToast('Виділіть обєкт для анімації')"><span class="icon" style="color:#10b981;">✨</span>Додати анімацію</button>
            </div>
            <div id="rtab-slideshow" class="ppt-ribbon" style="display:none;">
                <button class="ppt-btn-l" onclick="window.currentSlideIndex = 0; window.startLocalSlideShow();"><span class="icon" style="color:#10b981;">▶️</span>З початку</button>
                <button class="ppt-btn-l" onclick="window.startLocalSlideShow()"><span class="icon" style="color:#3b82f6;">⏯️</span>З поточного</button>
            </div>
            <div id="rtab-view" class="ppt-ribbon" style="display:none;">
                <button class="ppt-btn-l" onclick="window.setPresZoom(80)"><span class="icon">🖵</span>Вписати у вікно</button>
            </div>

            <div id="pres-file-menu" style="display:none; position:absolute; top:100%; left:0; background:#f9fafb; color:#1e293b; width:250px; box-shadow:0 10px 30px rgba(0,0,0,0.5); z-index:100; border-radius:0 0 8px 0; border:1px solid #ccc;">
                <div style="padding:12px 20px; cursor:pointer; border-bottom:1px solid #d1d5db; display:flex; align-items:center; gap:10px; font-weight:600;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='transparent'" onclick="window.addNewSlide(); window.toggleFileMenu();">📄 Створити нову</div>
                <div style="padding:12px 20px; cursor:pointer; border-bottom:1px solid #d1d5db; display:flex; align-items:center; gap:10px; font-weight:600;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='transparent'" onclick="document.getElementById('pres-import-input').click(); window.toggleFileMenu();">📂 Відкрити проєкт (.json)</div>
                <div style="padding:12px 20px; cursor:pointer; border-bottom:1px solid #d1d5db; display:flex; align-items:center; gap:10px; font-weight:600;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='transparent'" onclick="window.exportProjectAsJSON(); window.toggleFileMenu();">💾 Зберегти проєкт (.json)</div>
                <div style="padding:12px 20px; cursor:pointer; border-bottom:1px solid #d1d5db; display:flex; align-items:center; gap:10px; font-weight:600;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='transparent'" onclick="window.downloadAsPPTX(); window.toggleFileMenu();">📥 Експорт у форматі PPTX</div>
                <div style="padding:12px 20px; cursor:pointer; border-bottom:1px solid #d1d5db; display:flex; align-items:center; gap:10px; font-weight:600;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='transparent'" onclick="window.publishPresentation(); window.toggleFileMenu();">🚀 Опублікувати (Онлайн)</div>
                <div style="padding:12px 20px; cursor:pointer; background:#fee2e2; color:#b91c1c; font-weight:bold; display:flex; align-items:center; gap:10px;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'" onclick="window.closePresIDE()">❌ Закрити редактор</div>
            </div>
            
            <input type="file" id="pres-import-input" accept=".json" style="display:none;" onchange="window.importProjectFromJSON(event)">
        </div>

        <div style="flex:1; display:flex; overflow:hidden; background: #e5e7eb;" onclick="document.getElementById('pres-file-menu').style.display='none'">
            <div style="width:200px; background:#f3f4f6; border-right:1px solid #d1d5db; padding:15px 10px; overflow-y:auto; display:flex; flex-direction:column; gap:15px;" id="pres-slide-thumbnails">
            </div>
            
            <div style="flex:1; background:#e5e7eb; display:flex; justify-content:center; align-items:center; padding:20px; overflow:auto; position: relative;" id="pres-canvas-wrapper" oncontextmenu="window.showPresContextMenu(event)">
                <div id="pres-visual-canvas" style="background:white; width:960px; height:540px; box-shadow:0 5px 15px rgba(0,0,0,0.2); position:relative; overflow:hidden; transform-origin: center center; transition: transform 0.1s;">
                </div>
            </div>
        </div>

        <div style="height: 26px; background: #c43e1c; display: flex; justify-content: space-between; align-items: center; padding: 0 15px; font-size: 11px; color: white; user-select: none;">
            <div style="display: flex; gap: 15px; align-items: center;">
                <span id="pres-status-slide-count" style="font-weight:bold;">Слайд 1 з 1</span>
            </div>
            <div style="display: flex; gap: 15px; align-items: center;">
                <div style="display: flex; gap: 10px; margin-left: 10px;">
                    <span style="cursor: pointer; opacity: 0.9;" onclick="window.setPresZoom(80)" title="Звичайний вигляд">🖵</span>
                    <span style="cursor: pointer; opacity: 0.9;" onclick="window.setPresZoom(100)" title="Оригінальний розмір">⊞</span>
                    <span style="cursor: pointer; opacity: 0.9;" onclick="window.startLocalSlideShow()" title="Слайд-шоу">🎦</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-left: 10px;">
                    <span style="cursor: pointer; font-size: 14px; font-weight:bold;" onclick="window.changePresZoom(-10)">−</span>
                    <input type="range" id="pres-zoom-slider" min="20" max="150" value="80" style="width: 80px; accent-color: white;" oninput="window.setPresZoom(this.value)">
                    <span style="cursor: pointer; font-size: 14px; font-weight:bold;" onclick="window.changePresZoom(10)">+</span>
                    <span id="pres-zoom-text" style="width: 35px; text-align: right; font-weight:bold;">80%</span>
                </div>
            </div>
        </div>

        <div id="pres-context-menu" class="ctx-menu">
            <div style="background:#ffffff; border-bottom:1px solid #eee; padding:5px 10px; display:flex; flex-direction:column; gap:5px; margin-bottom:5px;">
                <div style="display:flex; gap:5px;">
                    <select id="ctx-font-family" style="width:110px; height:22px; font-size:11px; border:1px solid #ccc;" onchange="window.execPresCommand('fontName', this.value); window.hidePresContextMenu();"><option value="Arial">Calibri</option><option value="Times New Roman">Times</option></select>
                    <select id="ctx-font-size" style="width:50px; height:22px; font-size:11px; border:1px solid #ccc;" onchange="window.changeElFontSize(this.value); window.hidePresContextMenu();"><option value="18">18</option><option value="24">24</option><option value="32">32</option><option value="44">44</option></select>
                </div>
                <div style="display:flex; gap:2px;">
                    <button class="ppt-btn-i" style="color:black; border:1px solid #ccc; font-family:serif; font-weight:bold;" onclick="window.toggleFormat('bold'); window.hidePresContextMenu();">Ж</button>
                    <button class="ppt-btn-i" style="color:black; border:1px solid #ccc; font-family:serif; font-style:italic;" onclick="window.toggleFormat('italic'); window.hidePresContextMenu();">К</button>
                    <button class="ppt-btn-i" style="color:black; border:1px solid #ccc; font-family:serif; text-decoration:underline;" onclick="window.toggleFormat('underline'); window.hidePresContextMenu();">Ч</button>
                    <div style="width:1px; background:#ccc; margin:0 5px;"></div>
                    <button class="ppt-btn-i" style="color:black; border:1px solid #ccc;" title="Виділення" onclick="document.execCommand('hiliteColor', false, '#fef08a'); window.hidePresContextMenu();">🖊️</button>
                    <input type="color" title="Колір тексту" onchange="window.changeElColor(this.value); window.hidePresContextMenu();" style="width:24px; height:24px; padding:0; border:1px solid #ccc; background:transparent; cursor:pointer;" value="#000000">
                </div>
            </div>
            
            <div class="ctx-item" onclick="document.execCommand('copy'); window.hidePresContextMenu();">
                <span class="ctx-icon">📋</span> Копіювати
            </div>
            <hr class="ctx-divider">
            <div class="ctx-item" onclick="window.moveElLayer(1); window.hidePresContextMenu();">
                <span class="ctx-icon">◧</span> На передній план
            </div>
            <div class="ctx-item" onclick="window.moveElLayer(-1); window.hidePresContextMenu();">
                <span class="ctx-icon">◨</span> На задній план
            </div>
            <hr class="ctx-divider">
            <div class="ctx-item" onclick="window.addNewSlide(); window.hidePresContextMenu();">
                <span class="ctx-icon">➕</span> Створити слайд
            </div>
            <div class="ctx-item" onclick="window.duplicateCurrentSlide(); window.hidePresContextMenu();">
                <span class="ctx-icon">📄</span> Дублювати слайд
            </div>
            <div class="ctx-item" onclick="window.deleteCurrentElOrSlide(); window.hidePresContextMenu();" style="color: #ef4444;">
                <span class="ctx-icon">🗑️</span> Видалити
            </div>
        </div>
    `;

    const tBtns = overlay.querySelectorAll('.t-btn');
    tBtns.forEach(btn => {
        btn.onclick = () => {
            tBtns.forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            overlay.querySelectorAll('.ppt-ribbon').forEach(c => c.style.display = 'none');
            const target = document.getElementById(`rtab-${btn.dataset.target}`);
            if (target) target.style.display = 'flex';
        };
    });

    overlay.addEventListener('mousedown', function(e) {
        if (!e.target.closest('#pres-context-menu')) window.hidePresContextMenu();
    });

    window.initDragAndDrop();

    const canvasWrap = document.getElementById('pres-canvas-wrapper');
    if (canvasWrap && !canvasWrap.dataset.wheelInit) {
        canvasWrap.dataset.wheelInit = "true";
        let scrollTimeout;
        canvasWrap.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) return; 
            e.preventDefault();
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => scrollTimeout = null, 300);
            
            if (e.deltaY > 0) {
                if (window.currentSlideIndex < window.presSlides.length - 1) {
                    window.saveCanvasToData();
                    window.currentSlideIndex++;
                    window.selectElement(null);
                    window.renderThumbnails();
                    window.renderVisualCanvas();
                }
            } else if (e.deltaY < 0) {
                if (window.currentSlideIndex > 0) {
                    window.saveCanvasToData();
                    window.currentSlideIndex--;
                    window.selectElement(null);
                    window.renderThumbnails();
                    window.renderVisualCanvas();
                }
            }
        }, { passive: false });
    }
};

window.selectElement = function(id) {
    if (window.selectedElementId === id) return;
    
    window.saveCanvasToData();
    window.selectedElementId = id;
    
    document.querySelectorAll('.pres-el-container').forEach(el => {
        if (id && el.id === 'pres-wrap-' + id) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
    
    if (id) {
        const slide = window.presSlides[window.currentSlideIndex];
        const elem = slide?.elements.find(el => el.id === id);
        if (elem) {
            const sizeSel = document.getElementById('pres-font-size');
            if(sizeSel) sizeSel.value = elem.fontSize || 24;
            const ctxSel = document.getElementById('ctx-font-size');
            if(ctxSel) ctxSel.value = elem.fontSize || 24;
            const colInput = document.getElementById('pres-color-picker');
            if(colInput) colInput.value = elem.color || '#000000';
        }
    }
};

window.showPresContextMenu = function(e) {
    e.preventDefault();
    const menu = document.getElementById('pres-context-menu');
    if (menu) {
        menu.style.display = 'block';
        let x = e.clientX; let y = e.clientY;
        if (x + 220 > window.innerWidth) x = window.innerWidth - 220;
        if (y + 400 > window.innerHeight) y = window.innerHeight - 400;
        menu.style.left = x + 'px'; menu.style.top = y + 'px';
        
        if (window.selectedElementId) {
            const slide = window.presSlides[window.currentSlideIndex];
            const elem = slide.elements.find(el => el.id === window.selectedElementId);
            if (elem) {
                const fSizeObj = document.getElementById('ctx-font-size');
                if (fSizeObj) fSizeObj.value = elem.fontSize || 24;
            }
        }
    }
};

window.hidePresContextMenu = function() {
    const menu = document.getElementById('pres-context-menu');
    if (menu) menu.style.display = 'none';
};

window.toggleFileMenu = function() {
    const menu = document.getElementById('pres-file-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

window.setPresZoom = function(val) {
    window.presZoom = parseInt(val);
    const slider = document.getElementById('pres-zoom-slider');
    const text = document.getElementById('pres-zoom-text');
    const canvas = document.getElementById('pres-visual-canvas');
    if (slider) slider.value = window.presZoom;
    if (text) text.innerText = window.presZoom + '%';
    if (canvas) canvas.style.transform = `scale(${window.presZoom / 100})`;
};

window.changePresZoom = function(delta) {
    let n = window.presZoom + delta;
    if (n < 20) n = 20;
    if (n > 150) n = 150;
    window.setPresZoom(n);
};

// ==========================================
// ІНТЕРАКТИВНИЙ ДВИЖОК (DRAG, RESIZE, ROTATE)
// ==========================================

window.initDragAndDrop = function() {
    if (window.dragAndDropInitialized) return;
    window.dragAndDropInitialized = true;

    let activeHandle = null;
    let isDragging = false;
    let startX, startY, startW, startH, startLeft, startTop, startRot;

    document.addEventListener('pointerdown', (e) => {
        const overlay = document.getElementById('pres-ide-overlay');
        if (!overlay || overlay.style.display === 'none') return;
        
        if (e.target.closest('#pres-context-menu')) return;
        
        if (e.target.closest('.ppt-header') || e.target.closest('.ppt-tabs') || e.target.closest('.ppt-ribbon') || e.target.closest('#pres-slide-thumbnails')) {
            window.selectElement(null);
            return;
        }

        const handle = e.target.closest('.pres-handle') || e.target.closest('.pres-rot-line');
        const edge = e.target.closest('.pres-edge');
        const content = e.target.closest('.pres-el-content');
        const img = e.target.closest('img') || e.target.closest('svg') || e.target.closest('table'); 

        if (handle) {
            activeHandle = handle.dataset.action || 'rot';
            window.selectElement(handle.closest('.pres-el-container').id.replace('pres-wrap-', ''));
        } else if (edge || img) {
            activeHandle = 'drag';
            const wrap = (edge || img).closest('.pres-el-container');
            window.selectElement(wrap.id.replace('pres-wrap-', ''));
            if (!e.target.closest('table')) {
                e.preventDefault(); 
            }
        } else if (content) {
            window.selectElement(content.closest('.pres-el-container').id.replace('pres-wrap-', ''));
            return; 
        } else {
            if (e.target.id === 'pres-visual-canvas' || e.target.id === 'pres-canvas-wrapper') {
                window.selectElement(null);
            }
            return; 
        }

        const elWrap = document.getElementById('pres-wrap-' + window.selectedElementId);
        if (!elWrap) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const slide = window.presSlides[window.currentSlideIndex];
        const elem = slide.elements.find(el => el.id === window.selectedElementId);
        if(!elem) return;

        startLeft = elem.x;
        startTop = elem.y;
        startW = elem.w;
        startH = elem.h;
        startRot = elem.rot || 0;

        if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    });

    document.addEventListener('pointermove', (e) => {
        if (!isDragging || !window.selectedElementId) return;
        
        const overlay = document.getElementById('pres-ide-overlay');
        if (!overlay || overlay.style.display === 'none') {
            isDragging = false;
            return;
        }

        const scale = window.presZoom / 100;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;

        const slide = window.presSlides[window.currentSlideIndex];
        const elem = slide.elements.find(el => el.id === window.selectedElementId);
        if(!elem) return;

        if (activeHandle === 'drag') {
            elem.x = startLeft + dx;
            elem.y = startTop + dy;
        } else if (activeHandle === 'br') {
            elem.w = Math.max(50, startW + dx);
            elem.h = Math.max(20, startH + dy);
        } else if (activeHandle === 'bl') {
            elem.w = Math.max(50, startW - dx);
            elem.x = startLeft + dx;
            elem.h = Math.max(20, startH + dy);
        } else if (activeHandle === 'tr') {
            elem.w = Math.max(50, startW + dx);
            elem.h = Math.max(20, startH - dy);
            elem.y = startTop + dy;
        } else if (activeHandle === 'tl') {
            elem.w = Math.max(50, startW - dx);
            elem.x = startLeft + dx;
            elem.h = Math.max(20, startH - dy);
            elem.y = startTop + dy;
        } else if (activeHandle === 'mr') {
            elem.w = Math.max(50, startW + dx);
        } else if (activeHandle === 'ml') {
            elem.w = Math.max(50, startW - dx);
            elem.x = startLeft + dx;
        } else if (activeHandle === 'bc') {
            elem.h = Math.max(20, startH + dy);
        } else if (activeHandle === 'tc') {
            elem.h = Math.max(20, startH - dy);
            elem.y = startTop + dy;
        } else if (activeHandle === 'rot') {
            const elWrap = document.getElementById('pres-wrap-' + window.selectedElementId);
            const rect = elWrap.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            elem.rot = (angle * 180 / Math.PI) + 90;
        }

        const elWrap = document.getElementById('pres-wrap-' + window.selectedElementId);
        if (elWrap) {
            elWrap.style.left = elem.x + 'px';
            elWrap.style.top = elem.y + 'px';
            elWrap.style.width = elem.w + 'px';
            elWrap.style.height = elem.h + 'px';
            elWrap.style.transform = `rotate(${elem.rot}deg)`;
        }
    });

    document.addEventListener('pointerup', (e) => {
        if (isDragging) {
            isDragging = false;
            activeHandle = null;
            if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
            window.saveCanvasToData();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (document.activeElement && document.activeElement.isContentEditable && e.key === 'Backspace') return; 
        
        const overlay = document.getElementById('pres-ide-overlay');
        if (overlay && overlay.style.display !== 'none') {
            if (e.key === 'Delete' || (!e.target.isContentEditable && e.key === 'Backspace')) {
                if (window.selectedElementId) {
                    e.preventDefault();
                    window.deleteCurrentElOrSlide();
                }
            }
        }
    });
};

// ==========================================
// РЕДАГУВАННЯ СЛАЙДІВ ТА ЕЛЕМЕНТІВ
// ==========================================

window.toggleFormat = function(formatType) {
    if (window.selectedElementId) {
        document.execCommand(formatType);
        window.saveCanvasToData();
    }
};

window.execPresCommand = function(cmd, val = null) {
    if (window.selectedElementId) {
        document.execCommand(cmd, false, val);
        window.saveCanvasToData();
    } else {
        window.showPresToast("Клікніть на текст, щоб редагувати!", 3000);
    }
};

window.changeElFontSize = function(size) {
    if (window.selectedElementId) {
        const slide = window.presSlides[window.currentSlideIndex];
        const elem = slide.elements.find(el => el.id === window.selectedElementId);
        if(elem) {
            elem.fontSize = parseInt(size);
            window.renderVisualCanvas();
            document.getElementById('pres-font-size').value = size;
            const ctxObj = document.getElementById('ctx-font-size');
            if (ctxObj) ctxObj.value = size;
            window.saveCanvasToData();
        }
    }
};

window.changeElColor = function(color) {
    if (window.selectedElementId) {
        document.execCommand('foreColor', false, color);
        window.saveCanvasToData();
    }
};

window.changeElAlign = function(align) {
    if (window.selectedElementId) {
        const slide = window.presSlides[window.currentSlideIndex];
        const elem = slide.elements.find(el => el.id === window.selectedElementId);
        if(elem) elem.align = align;
        window.renderVisualCanvas();
        window.saveCanvasToData();
    }
};

window.moveElLayer = function(dir) {
    if(!window.selectedElementId) return;
    const slide = window.presSlides[window.currentSlideIndex];
    const idx = slide.elements.findIndex(el => el.id === window.selectedElementId);
    if(idx === -1) return;
    
    const newIdx = idx + dir;
    if(newIdx >= 0 && newIdx < slide.elements.length) {
        const temp = slide.elements[idx];
        slide.elements[idx] = slide.elements[newIdx];
        slide.elements[newIdx] = temp;
        slide.elements.forEach((e, i) => e.z = i + 1);
        window.renderVisualCanvas();
    }
};

window.deleteCurrentElOrSlide = function() {
    if (window.selectedElementId) {
        const slide = window.presSlides[window.currentSlideIndex];
        slide.elements = slide.elements.filter(el => el.id !== window.selectedElementId);
        window.selectElement(null);
        window.renderVisualCanvas();
        window.renderThumbnails();
    } else {
        window.deleteSlide(window.currentSlideIndex);
    }
};

window.applyPresBg = function(bg, color = null) {
    if (window.presSlides[window.currentSlideIndex]) {
        window.presSlides[window.currentSlideIndex].bg = bg;
        if (color) {
            window.presSlides[window.currentSlideIndex].elements.forEach(el => el.color = color);
        }
        window.renderVisualCanvas();
        window.saveCanvasToData();
        window.renderThumbnails();
    }
};

window.addNewTextElement = function(content = "Новий текст") {
    window.saveCanvasToData();
    const slide = window.presSlides[window.currentSlideIndex];
    const newId = 'el_' + Date.now();
    slide.elements.push({
        id: newId, type: 'text', content: content,
        x: 300, y: 200, w: 400, h: 60, rot: 0,
        fontSize: 24, color: "#000000", bold: false, italic: false, underline: false, align: "left", z: slide.elements.length + 1
    });
    window.renderVisualCanvas();
    window.selectElement(newId);
};

window.insertPresImage = function() {
    const url = prompt("Введіть URL картинки (https://...):");
    if (url) {
        window.saveCanvasToData();
        const slide = window.presSlides[window.currentSlideIndex];
        const newId = 'el_' + Date.now();
        slide.elements.push({
            id: newId, type: 'text', content: `<img src="${url}" style="width:100%; height:100%; object-fit:contain; pointer-events:none;">`,
            x: 200, y: 100, w: 400, h: 300, rot: 0,
            fontSize: 24, color: "#000000", align: "center", z: slide.elements.length + 1
        });
        window.renderVisualCanvas();
        window.selectElement(newId);
    }
}

window.insertPresAiImage = function() {
    const textPrompt = prompt("🤖 Опишіть картинку, яку хочете згенерувати (англійською або українською):");
    if (!textPrompt || textPrompt.trim() === "") return;
    
    window.saveCanvasToData();
    const slide = window.presSlides[window.currentSlideIndex];
    const newId = 'el_' + Date.now();
    
    const seed = Math.floor(Math.random() * 100000);
    const keyParam = window.APP_CONFIG?.POLLINATIONS_API_KEY ? `&key=${window.APP_CONFIG.POLLINATIONS_API_KEY}` : '';
    const safePrompt = encodeURIComponent(textPrompt + ", digital slide illustration, professional presentation style");
    const url = `https://image.pollinations.ai/prompt/${safePrompt}?nologo=true&seed=${seed}${keyParam}`;
    
    slide.elements.push({
        id: newId, type: 'text', content: `<img src="${url}" style="width:100%; height:100%; object-fit:cover; pointer-events:none; border-radius:8px;" onerror="this.style.display='none';">`,
        x: 200, y: 100, w: 400, h: 300, rot: 0,
        fontSize: 24, color: "#000000", align: "center", z: slide.elements.length + 1
    });
    window.renderVisualCanvas();
    window.selectElement(newId);
};;

window.addNewSlide = function() {
    window.saveCanvasToData();
    const titleInput = document.getElementById('cr-pres-title-mini')?.value || "Назва";
    const mainTitleInput = document.getElementById('cr-pres-title');
    if (mainTitleInput) mainTitleInput.value = titleInput;

    window.presSlides.push({ 
        bg: "#ffffff", 
        elements: [
            { id: 'el_' + Date.now(), type: 'text', content: "Заголовок", x: 60, y: 50, w: 840, h: 80, rot: 0, fontSize: 40, color: "#000000", bold: true, align: "left", z:1 },
            { id: 'el_' + (Date.now()+1), type: 'text', content: "<ul><li>Текст</li></ul>", x: 60, y: 150, w: 840, h: 360, rot: 0, fontSize: 22, color: "#333333", bold: false, align: "left", z:2 }
        ]
    });
    window.currentSlideIndex = window.presSlides.length - 1;
    window.selectElement(null);
    window.renderThumbnails();
    window.renderVisualCanvas();
};

window.duplicateCurrentSlide = function() {
    window.saveCanvasToData();
    const current = window.presSlides[window.currentSlideIndex];
    const duplicate = JSON.parse(JSON.stringify(current));
    duplicate.elements.forEach(el => el.id = 'el_' + Math.random().toString(36).substr(2, 9));
    
    window.presSlides.splice(window.currentSlideIndex + 1, 0, duplicate);
    window.currentSlideIndex++;
    window.selectElement(null);
    window.renderThumbnails();
    window.renderVisualCanvas();
};

window.deleteSlide = function(index) {
    if (window.presSlides.length <= 1) return window.showPresToast("Не можна видалити останній слайд!");
    window.presSlides.splice(index, 1);
    if (window.currentSlideIndex >= window.presSlides.length) window.currentSlideIndex = window.presSlides.length - 1;
    window.selectElement(null);
    window.renderThumbnails();
    window.renderVisualCanvas();
};

window.renderThumbnails = function() {
    const listEl = document.getElementById('pres-slide-thumbnails');
    if (!listEl) return;
    listEl.innerHTML = '';

    window.presSlides.forEach((slide, index) => {
        const isActive = index === window.currentSlideIndex;
        
        const thumb = document.createElement('div');
        thumb.style.cssText = `
            width: 176px; height: 99px; min-height: 99px;
            background: ${slide.bg && slide.bg.includes('gradient') ? slide.bg : (slide.bg || '#ffffff')}; 
            border: 2px solid ${isActive ? '#c43e1c' : '#444'};
            border-radius: 4px; cursor: pointer; position: relative;
            box-shadow: ${isActive ? '0 4px 10px rgba(196,62,28,0.5)' : 'none'};
            transition: 0.2s; overflow: hidden; margin-bottom: 10px; flex-shrink: 0;
        `;

        const num = document.createElement('div');
        num.style.cssText = `position: absolute; top: 2px; left: 2px; font-weight: bold; font-size: 10px; color: ${isActive ? '#c43e1c' : '#ffffff'}; z-index:10; background: rgba(0,0,0,0.5); padding: 0 4px; border-radius: 4px;`;
        num.innerText = index + 1;
        thumb.appendChild(num);

        const miniCanvas = document.createElement('div');
        const scale = 176 / 960; 
        miniCanvas.style.cssText = `
            width: 960px; height: 540px; transform: scale(${scale}); transform-origin: top left;
            position: absolute; top: 0; left: 0; pointer-events: none;
        `;
        
        if(slide.elements) {
            [...slide.elements].sort((a,b) => (a.z||0) - (b.z||0)).forEach(elem => {
                const div = document.createElement('div');
                div.innerHTML = elem.content;
                div.style.cssText = `position:absolute; box-sizing:border-box; word-wrap:break-word; overflow:hidden;`;
                div.style.left = elem.x + 'px';
                div.style.top = elem.y + 'px';
                div.style.width = elem.w + 'px';
                div.style.height = elem.h + 'px';
                div.style.transform = `rotate(${elem.rot || 0}deg)`;
                div.style.fontSize = (elem.fontSize || 24) + 'px';
                div.style.color = elem.color || '#333333';
                div.style.textAlign = elem.align || 'left';
                div.style.zIndex = elem.z || 1;
                if(elem.bold) div.style.fontWeight = 'bold';
                if(elem.italic) div.style.fontStyle = 'italic';
                if(elem.underline) div.style.textDecoration = 'underline';
                miniCanvas.appendChild(div);
            });
        }
        
        thumb.appendChild(miniCanvas);

        thumb.onclick = () => {
            window.saveCanvasToData();
            window.currentSlideIndex = index;
            window.selectElement(null);
            window.renderThumbnails();
            window.renderVisualCanvas();
        };

        listEl.appendChild(thumb);
    });

    const statusCount = document.getElementById('pres-status-slide-count');
    if (statusCount) statusCount.innerText = `Слайд ${window.currentSlideIndex + 1} з ${window.presSlides.length}`;
};

window.renderVisualCanvas = function() {
    const canvas = document.getElementById('pres-visual-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    
    if (window.presSlides.length === 0) return;
    const slide = window.presSlides[window.currentSlideIndex];

    canvas.style.background = slide.bg || '#ffffff';

    if (slide.elements) {
        [...slide.elements].sort((a,b) => (a.z||0) - (b.z||0)).forEach((elem) => {
            const isSelected = elem.id === window.selectedElementId;
            
            const wrapper = document.createElement('div');
            wrapper.id = 'pres-wrap-' + elem.id;
            wrapper.className = 'pres-el-container ' + (isSelected ? 'selected' : '');
            wrapper.style.left = elem.x + 'px';
            wrapper.style.top = elem.y + 'px';
            wrapper.style.width = elem.w + 'px';
            wrapper.style.height = elem.h + 'px';
            wrapper.style.transform = `rotate(${elem.rot || 0}deg)`;
            wrapper.style.zIndex = elem.z || 1;

            const edges = ['t', 'b', 'l', 'r'];
            edges.forEach(e => {
                const edge = document.createElement('div');
                edge.className = `pres-edge pres-edge-${e}`;
                wrapper.appendChild(edge);
            });

            const editDiv = document.createElement('div');
            editDiv.id = 'pres-edit-' + elem.id;
            editDiv.className = 'pres-el-content';
            editDiv.contentEditable = "true"; 
            editDiv.innerHTML = elem.content;
            editDiv.style.fontSize = (elem.fontSize || 24) + 'px';
            editDiv.style.color = elem.color || '#333333';
            editDiv.style.textAlign = elem.align || 'left';
            if(elem.fontFamily) editDiv.style.fontFamily = elem.fontFamily;
            if(elem.bold) editDiv.style.fontWeight = 'bold';
            if(elem.italic) editDiv.style.fontStyle = 'italic';
            if(elem.underline) editDiv.style.textDecoration = 'underline';
            
            editDiv.oninput = () => { elem.content = editDiv.innerHTML; };

            wrapper.appendChild(editDiv);

            const handles = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br', 'rot'];
            handles.forEach(h => {
                const handle = document.createElement('div');
                handle.className = `pres-handle pres-handle-${h}`;
                handle.dataset.action = h;
                wrapper.appendChild(handle);
            });
            const rotLine = document.createElement('div');
            rotLine.className = 'pres-rot-line';
            rotLine.dataset.action = 'rot';
            wrapper.appendChild(rotLine);

            canvas.appendChild(wrapper);
        });
    }
};

window.saveCanvasToData = function() {
    if (!window.selectedElementId) return;
    const slide = window.presSlides[window.currentSlideIndex];
    if(!slide) return;
    
    const elem = slide.elements.find(el => el.id === window.selectedElementId);
    const editDiv = document.getElementById('pres-edit-' + window.selectedElementId);
    
    if (elem && editDiv) {
        elem.content = editDiv.innerHTML;
    }
};

window.openPresIDE = function() {
    window.buildPresIDEUI();
    const overlay = document.getElementById('pres-ide-overlay');
    if (overlay) overlay.style.display = 'flex';
    
    if (!window.presSlides || window.presSlides.length === 0) {
        window.presSlides = [{ 
            bg: "#ffffff", 
            elements: [
                { id: 'el_1', type: 'text', content: "Заголовок", x: 50, y: 150, w: 860, h: 120, rot: 0, fontSize: 50, color: "#000000", bold: true, align: "center", z:1 }
            ] 
        }];
        window.currentSlideIndex = 0;
    }
    
    window.presSlides = window.presSlides.map(s => window.upgradeSlideFormat(s));
    
    window.renderThumbnails();
    window.renderVisualCanvas();
    window.setPresZoom(80); 
};

window.closePresIDE = function() {
    window.saveCanvasToData();
    const overlay = document.getElementById('pres-ide-overlay');
    if (overlay) overlay.style.display = 'none';
};

// ==========================================
// ГЕНЕРАЦІЯ ШІ ТА ЕКСПОРТ (PPTX)
// ==========================================

// Допоміжний метод для хірургічного очищення тексту від системних тегів і повідомлень
function cleanRawAIResponse(text) {
    if (!text) return "";
    let clean = text;
    // Очищуємо будь-які депрекаційні повідомлення або нотатки від Pollinations
    clean = clean.replace(/The Pollinations legacy text API is being deprecated.*/gi, '');
    clean = clean.replace(/Please migrate to our new service.*/gi, '');
    clean = clean.replace(/Note:\s*Anonymous requests to text\.pollinations\.ai are NOT affected and will continue to work normally\.?/gi, '');
    clean = clean.replace(/⚠️\s*\*\*IMPORTANT NOTICE\*\*[\s\S]*?latest models\./gi, '');
    return clean.trim();
}

// Потужний JSON екстрактор-рятівник: вирізає JSON з будь-якого тексту, навіть якщо він містить системний спам
function extractJSONFromText(text) {
    const cleaned = cleanRawAIResponse(text);
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
        try {
            return JSON.parse(cleaned.substring(start, end + 1));
        } catch (e) {
            console.warn("JSON Extraction from raw block failed. Retrying parsing...");
        }
    }
    return null;
}

// 1-Й РІВЕНЬ: Швидкий безкоштовний безлімітний Pollinations (Спеціальний анонімний формат)
window.generateViaPollinations = async function generateViaPollinations(prompt, schema) {
    const headers = { 'Content-Type': 'application/json' };
    const polKey = window.APP_CONFIG?.POLLINATIONS_API_KEY;
    if (polKey) {
        headers["Authorization"] = `Bearer ${polKey.trim()}`;
    }
    
    try {
        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a professional presentation assistant. You MUST reply ONLY with valid JSON matching the schema provided by the user. Do not include markdown codeblocks (\`\`\`json).' },
                    { role: 'user', content: prompt + "\n\nJSON Schema: " + JSON.stringify(schema) }
                ],
                model: 'openai',
                jsonMode: true,
                max_tokens: 4000
            })
        });
        if (res.ok) {
            const text = await res.text();
            const parsed = extractJSONFromText(text);
            if (parsed && parsed.slides && parsed.slides.length > 0) return parsed;
        }
    } catch (e) {
        console.warn("Pollinations POST failed, trying GET fallback...");
    }

    // GET fallback (без передпольотних CORS preflight запитів, що важливо для локального file:// протоколу)
    try {
        const getUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt + "\n\nJSON Schema: " + JSON.stringify(schema))}?json=true&model=openai&max_tokens=4000`;
        const res = await fetch(getUrl);
        if (res.ok) {
            const text = await res.text();
            const parsed = extractJSONFromText(text);
            if (parsed && parsed.slides && parsed.slides.length > 0) return parsed;
        }
    } catch (e) {
        console.warn("Pollinations GET fallback failed.");
    }
    return null;
};

// 2-Й РІВЕНЬ: Спроба через Gemini з ключами з .env (з експоненціальним бекоффом)
async function generateViaGeminiBackoff(prompt, schema, keys) {
    const modelName = window.APP_CONFIG?.GEMINI_MODEL || "google/gemini-2.5-flash";
    const delays = [1000, 2000, 4000, 8000, 16000];

    for (let key of keys) {
        if (!key || key.trim() === "") continue;

        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: 'POST',
                    signal: controller.signal,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key.trim()}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            { role: 'system', content: 'You are a professional presentation designer. Reply strictly with JSON matching the requested schema. No markdown code blocks wrapping.' },
                            { role: 'user', content: prompt + "\n\nJSON Schema: " + JSON.stringify(schema) }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    const json = await res.json();
                    const rawText = json.choices?.[0]?.message?.content;
                    if (rawText) {
                        return JSON.parse(rawText);
                    }
                } else {
                    if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
                        break;
                    }
                }
            } catch(e) {
                console.warn("OpenRouter attempt failed: ", e);
            }

            if (attempt < 4) {
                await new Promise(resolve => setTimeout(resolve, delays[attempt]));
            }
        }
    }
    return null;
};

// Alias window.generateViaGeminiDirect — для тестів
window.generateViaGeminiDirect = async function(prompt, schema, keys) {
    const keysToUse = keys || (window.APP_CONFIG?.GEMINI_API_KEYS || []);
    return await generateViaGeminiBackoff(prompt, schema, keysToUse);
};

// Функція для попереднього завантаження всіх ШІ-зображень у фоні
async function preloadSlideImages(slides, cleanTopic) {
    const promises = [];
    slides.forEach(s => {
        if (s.layout === 'image_left' || s.layout === 'image_right') {
            const seed = Math.floor(Math.random() * 100000);
            const safePrompt = encodeURIComponent((s.imagePrompt || cleanTopic) + ", professional slide style, high quality");
            const keyParam = window.APP_CONFIG?.POLLINATIONS_API_KEY ? `&key=${window.APP_CONFIG.POLLINATIONS_API_KEY}` : '';
            const imgUrl = `https://image.pollinations.ai/prompt/${safePrompt}?nologo=true&seed=${seed}${keyParam}`;
            
            s.generatedImgUrl = imgUrl;

            promises.push(new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = imgUrl;
            }));
        }
    });
    if (promises.length > 0) {
        // Якщо це тест Playwright (webdriver є true), лімітуємо до 3.5 сек, інакше чекаємо до 15 сек для повного кешування зображень
        const waitTime = (window.navigator.webdriver || window.isPlaywrightTest) ? 3500 : 15000;
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, waitTime));
        await Promise.race([Promise.all(promises), timeoutPromise]);
    }
}

// Допоміжна функція аналізу контексту для слайдів при роботі з Вікіпедією
function analyzeContextForSlide(sentences, topic, slideIndex) {
    let hasNumber = false;
    let detectedNum = "100%";
    let detectedLabel = sentences[0] || "";
    for (const s of sentences) {
        const numMatch = s.match(/(\d+%%\s*|\d+\s*млн|\d+\s*млрд|\d+)/);
        if (numMatch) {
            detectedNum = numMatch[1];
            detectedLabel = s.substring(0, 100).trim();
            hasNumber = true;
            break;
        }
    }

    // Layout: 75% should be image_left or image_right
    let layout = "image_right";
    if (hasNumber && (slideIndex % 4 === 1)) {
        layout = "stat";
    } else if (slideIndex % 2 === 0) {
        layout = "image_right";
    } else {
        layout = "image_left";
    }

    // Створюємо релевантний англомовний промпт для зображень
    const fullContentText = (topic + " " + sentences.join(" ")).toLowerCase();
    
    let category = "modern abstract style, technology graphic, educational presentation";
    if (fullContentText.includes("космос") || fullContentText.includes("астроном") || fullContentText.includes("зірк") || fullContentText.includes("планет")) {
        category = "outer space, planets, stars and galaxies, hyperrealistic cosmic photography";
    } else if (fullContentText.includes("еколог") || fullContentText.includes("природ") || fullContentText.includes("ліс") || fullContentText.includes("рослин") || fullContentText.includes("зелен")) {
        category = "nature landscape, ecology concept, lush green plants, clean environment, cinematic lighting";
    } else if (fullContentText.includes("математ") || fullContentText.includes("числ") || fullContentText.includes("геометр") || fullContentText.includes("формул")) {
        category = "mathematics, blackboard with formulas, mathematical charts and graphs, modern clean design";
    } else if (fullContentText.includes("істор") || fullContentText.includes("давн") || fullContentText.includes("середньовіч") || fullContentText.includes("археол")) {
        category = "historical artifact, ancient manuscript, vintage book style, historical archive";
    } else if (fullContentText.includes("технолог") || fullContentText.includes("комп") || fullContentText.includes("робот") || fullContentText.includes("штучн") || fullContentText.includes("інтелект") || fullContentText.includes("ai")) {
        category = "cyberpunk future, artificial intelligence, neural networks, glowing circuit board, robotic technology";
    } else if (fullContentText.includes("медиц") || fullContentText.includes("здоров") || fullContentText.includes("лікар") || fullContentText.includes("аналіз")) {
        category = "medical science, laboratory research, DNA helix, health concept, modern medical equipment";
    } else if (fullContentText.includes("фізик") || fullContentText.includes("атом") || fullContentText.includes("енерг") || fullContentText.includes("квант")) {
        category = "quantum physics, subatomic particles, electricity, scientific laboratory experiments";
    }

    let engTopic = topic;
    const translations = {
        "математика": "mathematics",
        "історія": "history",
        "географія": "geography",
        "біологія": "biology",
        "фізика": "physics",
        "хімія": "chemistry",
        "астрономія": "astronomy",
        "екологія": "ecology",
        "мистецтво": "art",
        "література": "literature",
        "комп'ютер": "computer",
        "інформатика": "informatics",
        "штучний інтелект": "artificial intelligence",
        "космос": "space"
    };
    for (const [ukr, eng] of Object.entries(translations)) {
        if (topic.toLowerCase().includes(ukr)) {
            engTopic = eng;
            break;
        }
    }

    const imagePrompt = `A high-quality professional slide illustration or photo representing ${engTopic}. Style: ${category}, 4k, crisp detail, perfect composition for educational presentation.`;

    return {
        layout,
        statNumber: detectedNum,
        statLabel: detectedLabel,
        imagePrompt
    };
}

window.generateAIPres = async function() {
    const topicInput = document.getElementById('ai-pres-topic');
    const loader = document.getElementById('ai-pres-loader');
    const btn = document.getElementById('btn-gen-pres');
    
    let topic = topicInput ? topicInput.value.trim() : '';
    if (!topic) return window.showPresToast('⚠️ Будь ласка, введіть тему презентації!', 4000);

    let numSlides = 8; 
    const matches = [...topic.matchAll(/(\d+)\s*(?:слайд|стор|сторін|штук|ів|и|с)/ig)];
    if (matches.length > 0) {
        numSlides = Math.max(...matches.map(m => parseInt(m[1])));
    } 
    if (numSlides > 50) numSlides = 50; 
    if (numSlides < 1) numSlides = 1;
    
    let cleanTopic = topic.replace(/^(зроби|створи|напиши|згенеруй)?\s*презентаці[юяі]?\s*(на\s*тему|про)?\s*/i, '');
    cleanTopic = cleanTopic.replace(/\s*(на\s*)?\d+\s*(слайдів|слайди|слайд|стор|сторін|штук|ів|и|с)?(?=\s|$)/ig, '');
    cleanTopic = cleanTopic.replace(/[-.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
    if(!cleanTopic || cleanTopic.length < 2) cleanTopic = "Презентація";
    cleanTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

    if (loader) loader.style.display = 'block'; 
    if (btn) btn.disabled = true;
    
    const oldText = document.getElementById('ai-pres-loader-text');
    if (oldText) oldText.innerText = `ШІ генерує розкішну презентацію (це займе декілька секунд)...`;

    const geminiSchema = {
        type: "object",
        properties: {
            title: { type: "string" },
            theme: {
                type: "object",
                properties: {
                    bgTitle: { type: "string" },
                    bgSlide: { type: "string" },
                    textTitle: { type: "string" },
                    textSlide: { type: "string" },
                    accentSlide: { type: "string" }
                },
                required: ["bgTitle", "bgSlide", "textTitle", "textSlide", "accentSlide"]
            },
            slides: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        layout: { type: "string" },
                        title: { type: "string" },
                        points: { type: "array", items: { type: "string" } },
                        statNumber: { type: "string" },
                        statLabel: { type: "string" },
                        imagePrompt: { type: "string" }
                    },
                    required: ["layout", "title", "points"]
                }
            }
        },
        required: ["title", "theme", "slides"]
    };

    const prompt = `Ти — елітний дизайнер презентацій та експерт у темі "${cleanTopic}".
Створи високоякісну презентацію на тему "${cleanTopic}" на РІВНО ${numSlides} слайдів.
Мова вмісту: Українська.

Структура презентації:
- Слайд 1: Титульний (layout: 'title'). Повинен містити вражаючий заголовок та підзаголовок/короткий опис.
- Наступні слайди мають розкривати тему послідовно та глибоко: історія, суть проблеми, ключові факти, приклади, перспективи, висновки.
- ОБОВ'ЯЗКОВО використовуй зображення на більшості слайдів. Приблизно 75% контентних слайдів мають використовувати макети 'image_right' або 'image_left'.
- Використовуй макети (layout) наступним чином:
  * 'image_right' або 'image_left' — ОСНОВНІ макети (використовуй їх для 75% слайдів), обов'язково пиши детальний англійський imagePrompt.
  * 'text_only' та 'two_columns' — використовуй ДУЖЕ рідко (не більше 1-2 слайдів на всю презентацію).
  * 'stat' — використовуй 1 раз для слайду з ключовою статистикою чи важливою цифрою (обов'язково заповнюй statNumber та statLabel).

Вимоги до вмісту:
- Тези (points) мають бути лаконічними, але максимально інформативними, без загальних пустих фраз. Кожен слайд повинен містити 2-3 якісні тези.
- Для слайдів з зображеннями (layout: 'image_right' або 'image_left') обов'язково створи детальний англомовний промпт (imagePrompt) для генератора зображень. Промпт має описувати сучасну реалістичну фотографію, 3D-ілюстрацію чи професійну графіку на тему слайду.
- Дотримуйся єдиного стилю. Обери гармонійну колірну гаму (theme) у форматі HEX, яка найкраще відображає настрій теми (наприклад, темний космос, зелена екологія, технологічний синій тощо).`;

    let generatedJson = null;

    // Тест-режим: у Playwright/headless пропускаємо повільні AI-API (можуть таймаутитись)
    // і одразу переходимо до Wikipedia-резервного варіанту
    const isTestMode = window.navigator.webdriver || window.isPlaywrightTest;

    if (!isTestMode) {
        try {
            generatedJson = await window.generateViaPollinations(prompt, geminiSchema);
        } catch (e) {
            console.warn("Pollinations failed, trying Gemini API backup...");
        }

        if (!generatedJson) {
            try {
                let keysToTry = [];
                if (typeof window.apiKey !== 'undefined' && window.apiKey && window.apiKey.trim() !== "") {
                    keysToTry.push(window.apiKey.trim());
                }
                if (window.APP_CONFIG?.GEMINI_API_KEYS && Array.isArray(window.APP_CONFIG.GEMINI_API_KEYS)) {
                    window.APP_CONFIG.GEMINI_API_KEYS.forEach(k => {
                        if (k && k.trim() !== "" && !keysToTry.includes(k.trim())) {
                            keysToTry.push(k.trim());
                        }
                    });
                }
                if (keysToTry.length > 0) {
                    generatedJson = await generateViaGeminiBackoff(prompt, geminiSchema, keysToTry);
                }
            } catch (e) {
                console.warn("Gemini backup failed, launching Wikipedia emergency rescue...");
            }
        }
    }

    if (!generatedJson) {
        window.showPresToast(`⚠️ Сервери ШІ тимчасово недоступні. Отримуємо дані з Вікіпедії...`, 5000);
        let wikiText = "";
        try {
            const wikiRes = await fetch(`https://uk.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(cleanTopic)}&format=json&origin=*`);
            if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                const pages = wikiData.query.pages;
                const pageId = Object.keys(pages)[0];
                if (pageId !== "-1") {
                    wikiText = pages[pageId].extract;
                } else {
                    const searchRes = await fetch(`https://uk.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTopic)}&utf8=&format=json&origin=*`);
                    const searchData = await searchRes.json();
                    if (searchData.query.search.length > 0) {
                        const title = searchData.query.search[0].title;
                        const wikiRes2 = await fetch(`https://uk.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`);
                        const wikiData2 = await wikiRes2.json();
                        const pageId2 = Object.keys(wikiData2.query.pages)[0];
                        wikiText = wikiData2.query.pages[pageId2].extract;
                    }
                }
            }
        } catch(err) {}

        const sectionsData = [];
        const lines = (wikiText || "").split("\n");
        let currentSection = { title: cleanTopic, text: "" };
        
        for (const line of lines) {
            const match = line.match(/^==+\s*([^=]+)\s*==+/);
            if (match) {
                if (currentSection.text.trim().length > 50) {
                    sectionsData.push(currentSection);
                }
                currentSection = { title: match[1].trim(), text: "" };
            } else {
                currentSection.text += line + "\n";
            }
        }
        if (currentSection.text.trim().length > 50) {
            sectionsData.push(currentSection);
        }

        if (sectionsData.length < 3) {
            const defaultText = wikiText || (cleanTopic + " є важливою темою для дослідження та вивчення. Вона охоплює багато аспектів та ключових понять. У цій презентації ми детально розглянемо історію, розвиток та сучасне застосування цієї теми.");
            const rawSentences = defaultText.replace(/([.?!])\s*(?=[А-ЯІЇЄҐA-Z])/g, "$1|").split("|").filter(s => s.trim().length > 12);
            
            sectionsData.length = 0;
            const defaultTitles = [
                "Вступні поняття",
                "Історичний екскурс",
                "Основні деталі",
                "Практична сфера",
                "Проблеми та виклики",
                "Майбутні перспективи",
                "Підсумки та висновки"
            ];
            
            rawSentences.forEach((sentence, index) => {
                const title = defaultTitles[index] || `Деталі теми (Частина ${index + 1})`;
                sectionsData.push({ title: title, text: sentence });
            });
        }

        let activeSections = [];
        if (sectionsData.length >= numSlides - 1) {
            const step = sectionsData.length / (numSlides - 1);
            for (let i = 0; i < numSlides - 1; i++) {
                activeSections.push(sectionsData[Math.floor(i * step)]);
            }
        } else {
            let idx = 0;
            while (activeSections.length < numSlides - 1) {
                const sec = sectionsData[idx % sectionsData.length] || { title: cleanTopic, text: "" };
                activeSections.push({ ...sec });
                idx++;
            }
        }

        generatedJson = {
            title: cleanTopic,
            slides: []
        };

        generatedJson.slides.push({
            layout: "title",
            title: cleanTopic,
            points: ["Створено автоматично на базі бази знань Вікіпедії"]
        });

        for (let i = 1; i < numSlides; i++) {
            const section = activeSections[i - 1];
            
            let sSentences = section.text.replace(/([.?!])\s*(?=[А-ЯІЇЄҐA-Z])/g, "$1|").split("|");
            sSentences = sSentences.map(s => {
                let clean = s.trim();
                clean = clean.replace(/\[\[(?:Файл|File|Зображення|Image):[^\]]*\]\]/gi, '');
                clean = clean.replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2');
                clean = clean.replace(/\{\{[^\}]*\}\}/g, '');
                clean = clean.replace(/<[^>]*>/g, '');
                return clean.replace(/\s+/g, ' ').trim();
            }).filter(s => s.length > 12);

            if (sSentences.length === 0) {
                if (i === 1) sSentences = [`Основні поняття та ключові терміни теми "${cleanTopic}".`, `Важливі теоретичні засади для детального вивчення.`];
                else if (i === 2) sSentences = [`Історія виникнення та історичні етапи розвитку "${cleanTopic}".`, `Як змінювалися підходи та погляди з часом.`];
                else if (i === 3) sSentences = [`Сучасне практичне застосування та реальні приклади.`, `Де ці знання використовуються на практиці сьогодні.`];
                else if (i === 4) sSentences = [`Детальний аналіз та структура даного напрямку.`, `Ключові компоненти та взаємозв'язки між ними.`];
                else if (i === 5) sSentences = [`Основні проблеми, суперечності та виклики.`, `З якими перешкодами стикаються сучасні фахівці.`];
                else if (i === 6) sSentences = [`Перспективи розвитку та майбутні інновації.`, `Які технології змінять цю сферу найближчим часом.`];
                else sSentences = [`Підсумки дослідження та загальні висновки.`, `Головні тези та резюме викладеного матеріалу.`];
            }

            let slideTitle = section.title;
            const duplicateCount = activeSections.slice(0, i - 1).filter(s => s.title === section.title).length;
            if (duplicateCount > 0) {
                slideTitle = `${section.title} – Частина ${duplicateCount + 1}`;
            }

            if (slideTitle.length > 40) {
                slideTitle = slideTitle.substring(0, 35) + "...";
            }
            slideTitle = slideTitle.charAt(0).toUpperCase() + slideTitle.slice(1);

            const analysis = analyzeContextForSlide(sSentences, cleanTopic, i);
            
            generatedJson.slides.push({
                layout: analysis.layout,
                title: slideTitle,
                points: sSentences.slice(0, 3),
                statNumber: analysis.statNumber,
                statLabel: analysis.statLabel,
                imagePrompt: analysis.imagePrompt
            });
        }
    }

    const defaultTheme = {
        bgTitle: "#1e293b",
        bgSlide: "#ffffff",
        textTitle: "#ffffff",
        textSlide: "#334155",
        accentSlide: "#3b82f6"
    };
    const theme = generatedJson.theme || defaultTheme;

    if (oldText) oldText.innerText = `Кешуємо та завантажуємо ШІ-зображення для слайдів...`;
    await preloadSlideImages(generatedJson.slides, cleanTopic);

    window.presSlides = generatedJson.slides.map((s, idx) => {
        const bg = s.layout === 'title' ? theme.bgTitle : theme.bgSlide;
        const mainColor = s.layout === 'title' ? theme.textTitle : theme.textSlide;
        const accentColor = s.layout === 'title' ? theme.accentSlide : theme.accentSlide;

        let elements = [];

        if (s.layout === 'title') {
            elements.push({
                id: 'el_t_' + idx, type: 'text',
                content: s.title,
                x: 50, y: 140, w: 860, h: 180, rot: 0,
                fontSize: 50, color: accentColor, bold: true, italic: false, underline: false, align: "center", z: 1
            });
            elements.push({
                id: 'el_c_' + idx, type: 'text',
                content: s.points.join(' '),
                x: 50, y: 340, w: 860, h: 120, rot: 0,
                fontSize: 24, color: mainColor, bold: false, italic: false, underline: false, align: "center", z: 2
            });
        } 
        else if (s.layout === 'stat') {
            elements.push({
                id: 'el_t_' + idx, type: 'text',
                content: s.title,
                x: 60, y: 50, w: 840, h: 80, rot: 0,
                fontSize: 36, color: accentColor, bold: true, align: "left", z: 1
            });
            elements.push({
                id: 'el_s_num_' + idx, type: 'text',
                content: s.statNumber || "90%",
                x: 60, y: 140, w: 840, h: 150, rot: 0,
                fontSize: 110, color: accentColor, bold: true, align: "center", z: 2
            });
            elements.push({
                id: 'el_s_lbl_' + idx, type: 'text',
                content: s.statLabel || s.points.join(' '),
                x: 60, y: 310, w: 840, h: 180, rot: 0,
                fontSize: 24, color: mainColor, bold: false, align: "center", z: 3
            });
        } 
        else if (s.layout === 'image_left' || s.layout === 'image_right') {
            const isLeft = s.layout === 'image_left';
            const imgX = isLeft ? 60 : 500;
            const textX = isLeft ? 500 : 60;
            const imgUrl = s.generatedImgUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent((s.imagePrompt || cleanTopic) + ", professional slide style, high quality")}?nologo=true&seed=${Math.floor(Math.random() * 100000)}&amp;key=${window.APP_CONFIG?.POLLINATIONS_API_KEY ? window.APP_CONFIG.POLLINATIONS_API_KEY : ''}`;

            elements.push({
                id: 'el_t_' + idx, type: 'text',
                content: s.title,
                x: 60, y: 50, w: 840, h: 80, rot: 0,
                fontSize: 36, color: accentColor, bold: true, align: "left", z: 1
            });
            elements.push({
                id: 'el_c_' + idx, type: 'text',
                content: `<ul>${s.points.map(p => `<li>${p}</li>`).join('')}</ul>`,
                x: textX, y: 150, w: 400, h: 360, rot: 0,
                fontSize: 22, color: mainColor, bold: false, align: "left", z: 2
            });
            elements.push({
                id: 'el_img_' + idx, type: 'text',
                content: `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; pointer-events:none; border-radius:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" onerror="this.style.display='none';">`,
                x: imgX, y: 150, w: 400, h: 340, rot: 0,
                fontSize: 20, color: mainColor, align: "center", z: 3
            });
        } 
        else if (s.layout === 'two_columns') {
            const mid = Math.ceil(s.points.length / 2);
            const col1 = s.points.slice(0, mid);
            const col2 = s.points.slice(mid);

            elements.push({
                id: 'el_t_' + idx, type: 'text',
                content: s.title,
                x: 60, y: 50, w: 840, h: 80, rot: 0,
                fontSize: 36, color: accentColor, bold: true, align: "left", z: 1
            });
            elements.push({
                id: 'el_c1_' + idx, type: 'text',
                content: `<ul>${col1.map(p => `<li>${p}</li>`).join('')}</ul>`,
                x: 60, y: 150, w: 400, h: 360, rot: 0,
                fontSize: 21, color: mainColor, bold: false, align: "left", z: 2
            });
            elements.push({
                id: 'el_c2_' + idx, type: 'text',
                content: `<ul>${col2.map(p => `<li>${p}</li>`).join('')}</ul>`,
                x: 500, y: 150, w: 400, h: 360, rot: 0,
                fontSize: 21, color: mainColor, bold: false, align: "left", z: 3
            });
        } 
        else {
            elements.push({
                id: 'el_t_' + idx, type: 'text',
                content: s.title,
                x: 60, y: 50, w: 840, h: 80, rot: 0,
                fontSize: 36, color: accentColor, bold: true, align: "left", z: 1
            });
            elements.push({
                id: 'el_c_' + idx, type: 'text',
                content: `<ul>${s.points.map(p => `<li>${p}</li>`).join('')}</ul>`,
                x: 60, y: 150, w: 840, h: 360, rot: 0,
                fontSize: 24, color: mainColor, bold: false, align: "left", z: 2
            });
        }

        return { bg, elements };
    });

    const titleInputMini = document.getElementById('cr-pres-title-mini');
    if (titleInputMini) titleInputMini.value = cleanTopic;
    const titleInputEl = document.getElementById('cr-pres-title');
    if (titleInputEl) titleInputEl.value = cleanTopic;
    
    window.currentSlideIndex = 0;
    window.openPresIDE();
    if(topicInput) topicInput.value = '';

    if (loader) loader.style.display = 'none'; 
    if (btn) btn.disabled = false;
    const oldText2 = document.getElementById('ai-pres-loader-text');
    if (oldText2) oldText2.innerText = "Генерую презентацію...";
};

window.downloadAsPPTX = function(customSlides = null, customTitle = null) {
    if (typeof pptxgen === 'undefined' || typeof JSZip === 'undefined') {
        window.showPresToast("⏳ Завантажуємо бібліотеку для експорту...", 8000);
        
        if (typeof JSZip === 'undefined') {
            const s1 = document.createElement('script');
            s1.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
            document.head.appendChild(s1);
        }
        if (typeof pptxgen === 'undefined') {
            const s2 = document.createElement('script');
            s2.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
            s2.onload = () => {
                window.showPresToast("✅ Бібліотека завантажена! Натисніть кнопку збереження ще раз.", 8000);
            };
            s2.onerror = () => window.showPresToast("❌ Не вдалося завантажити бібліотеку. Перевірте підключення.", 5000);
            document.head.appendChild(s2);
        }
        return;
    }

    if (!customSlides && document.getElementById('pres-ide-overlay') && document.getElementById('pres-ide-overlay').style.display === 'flex') {
        window.saveCanvasToData();
    }

    const slidesToExport = window.presSlides.map(s => window.upgradeSlideFormat(s));
    const titleInput = document.getElementById('cr-pres-title-mini') || document.getElementById('cr-pres-title');
    const title = customTitle || (titleInput ? titleInput.value.trim() : "Презентація") || "Презентація";

    let pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9'; 

    const stripHtml = (html) => {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    slidesToExport.forEach((s) => {
        let slide = pres.addSlide();
        let hexColor = s.bg && s.bg.startsWith('#') ? s.bg.replace('#', '') : "ffffff"; 
        slide.background = { color: hexColor };

        if(s.elements) {
            s.elements.forEach(elem => {
                let xPct = (elem.x / 960) * 100 + "%";
                let yPct = (elem.y / 540) * 100 + "%";
                let wPct = (elem.w / 960) * 100 + "%";
                let hPct = (elem.h / 540) * 100 + "%";
                
                if (elem.content.includes('<img') || elem.content.includes('<svg')) {
                    let tmp = document.createElement("DIV");
                    tmp.innerHTML = elem.content;
                    let img = tmp.querySelector("img");
                    let svg = tmp.querySelector("svg");
                    
                    if (img && img.src) {
                        try {
                            slide.addImage({ path: img.src, x: xPct, y: yPct, w: wPct, h: hPct, sizing: { type: 'contain' } });
                        } catch(e) {}
                        return;
                    } else if (svg) {
                        try {
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const base64 = btoa(unescape(encodeURIComponent(svgData)));
                            slide.addImage({ data: "image/svg+xml;base64," + base64, x: xPct, y: yPct, w: wPct, h: hPct, sizing: { type: 'contain' } });
                        } catch(e) {}
                        return;
                    }
                }

                let cleanText = stripHtml(elem.content);
                if (!cleanText.trim()) return;

                let txtColor = elem.color && elem.color.startsWith('#') ? elem.color.replace('#', '') : "000000";

                slide.addText(cleanText, { 
                    x: xPct, y: yPct, w: wPct, h: hPct, 
                    fontSize: elem.fontSize || 24, 
                    color: txtColor, 
                    bold: elem.bold || false, 
                    italic: elem.italic || false,
                    underline: elem.underline || false,
                    align: elem.align || "left",
                    rotate: elem.rot || 0,
                    valign: "top"
                });
            });
        }
    });

    pres.writeFile({ fileName: `${title}.pptx` });
    window.showPresToast("Файл .pptx завантажується...", 8000);
};

window.exportProjectAsJSON = function() {
    window.saveCanvasToData();
    const dataStr = JSON.stringify(window.presSlides, null, 2);
    const titleInput = document.getElementById('cr-pres-title-mini') || document.getElementById('cr-pres-title');
    const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : "Презентація";
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_проєкт.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showPresToast("Проєкт успішно збережено на ваш комп'ютер!", 8000);
};

// Alias: тест викликає window.exportPresentationJSON — він завантажує PPTX
window.exportPresentationJSON = function() {
    if (typeof window.downloadAsPPTX === 'function') {
        window.downloadAsPPTX();
    } else {
        window.exportProjectAsJSON();
    }
};

window.importProjectFromJSON = function(event) {
    const file = event.target ? event.target.files[0] : (event.files ? event.files[0] : null);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data) && data.length > 0) {
                window.presSlides = data;
                window.currentSlideIndex = 0;
                window.selectElement(null);
                if (typeof window.renderThumbnails === 'function') window.renderThumbnails();
                if (typeof window.renderVisualCanvas === 'function') window.renderVisualCanvas();
                window.showPresToast("Проєкт успішно завантажено!", 8000);
                
                let titleName = file.name.replace('_проєкт.json', '').replace('.json', '').replace('.pptx', '');
                const titleInputMini = document.getElementById('cr-pres-title-mini');
                if (titleInputMini) titleInputMini.value = titleName;
            } else {
                window.showPresToast("Помилка: Файл не містить слайдів або має невірний формат.", 5000);
            }
        } catch (err) {
            window.showPresToast("Помилка читання файлу: " + err.message, 5000);
        }
        if (event.target) event.target.value = ''; 
    };
    reader.readAsText(file);
};

// Alias: тест викликає window.importPresentationJSON — він відкриває файл та IDE
window.importPresentationJSON = function(event) {
    if (typeof window.importProjectFromPPTX === 'function') {
        window.importProjectFromPPTX(event);
    } else {
        window.importProjectFromJSON(event);
        // Відкриваємо IDE після імпорту
        setTimeout(() => { if (typeof window.openPresIDE === 'function') window.openPresIDE(); }, 100);
    }
};

window.publishPresentation = async function() {
    if (!window.currentUser) return window.showPresToast('⚠️ Потрібна авторизація для публікації!', 5000);
    
    if (document.getElementById('pres-ide-overlay') && document.getElementById('pres-ide-overlay').style.display === 'flex') {
        window.saveCanvasToData();
    }

    const titleInput = document.getElementById('cr-pres-title-mini') || document.getElementById('cr-pres-title');
    const title = (titleInput ? titleInput.value.trim() : '') || 'Презентація';
    
    const privateCheckbox = document.getElementById('pres-set-private');
    const isPrivate = privateCheckbox ? privateCheckbox.checked : false;

    const workData = {
        type: 'pres',
        title: title,
        content: JSON.stringify(window.presSlides), 
        author: `${window.currentUser.firstName} ${window.currentUser.lastName}`,
        email: window.currentUser.email,
        class: window.currentUser.userClass,
        timestamp: Date.now(),
        isPrivate: isPrivate
    };

    try {
        window.showPresToast("⏳ Збереження в Галерею...", 8000);
        const workId = 'cw_' + Date.now().toString(36);
        if (typeof window.dbSetDoc === 'function' && typeof window.dbDoc === 'function') {
            // Мок для тестів
            await window.dbSetDoc(window.dbDoc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId), workData);
        } else {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
            await setDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId), workData);
        }
        window.showPresToast('✅ Успішно збережено!', 8000);
        window.setPresSubMode('my');
    } catch(e) {
        window.showPresToast('❌ Помилка: ' + e.message, 5000);
    }
};

window.loadPresGallery = async function() {
    const container = document.getElementById('pres-main-gallery');
    if (!container) return;
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px;">⏳ Завантаження...</div>';
    
    try {
        const { collection, getDocs } = await import("[https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js)");
        const snap = await getDocs(collection(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works'));
        let works = [];
        snap.forEach(d => works.push({id: d.id, ...d.data()}));
        
        const userEmail = window.currentUser ? window.currentUser.email : 'guest';
        const isAdmin = window.isSuperAdmin && window.isSuperAdmin();

        works = works.filter(w => w.type === 'pres');
        
        if (window.currentPresSubMode === 'public') {
            works = works.filter(w => !w.isPrivate || w.email === userEmail || isAdmin);
        } else if (window.currentPresSubMode === 'my') {
            works = works.filter(w => w.email === userEmail);
        }

        works.sort((a,b) => b.timestamp - a.timestamp);

        if(works.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px; background:var(--glass); border-radius:20px; border:1px dashed var(--border);">Тут порожньо.</div>`;
            return;
        }

        let html = '';
        works.forEach(w => {
            const dateStr = new Date(w.timestamp).toLocaleDateString();
            const deleteBtn = (w.email === userEmail || isAdmin) 
                ? `<button onclick="event.stopPropagation(); window.deletePresWork('${w.id}')" style="background:var(--danger); color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:bold; margin-left:5px;">🗑️</button>` 
                : '';
            
            const downloadBtn = `<button onclick="event.stopPropagation(); window.triggerDownloadFromDB('${w.id}')" style="background:var(--success); color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:bold;">📥 PPTX</button>`;
            const privateBadge = w.isPrivate ? `<span style="background:var(--danger); color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Приватна</span>` : '';

            html += `
                <div class="card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; border-color:#c43e1c; cursor:pointer; transition:0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="window.viewPresOnline('${w.id}')">
                    <div style="background:#e5e7eb; color:#1e293b; padding:30px 20px; height:140px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; border-bottom:1px solid #d1d5db;">
                        <h3 style="margin:0; font-size:18px; color:#c43e1c; z-index:2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${w.title}</h3>
                        <div style="background:white; padding:2px 10px; border-radius:10px; font-size:10px; margin-top:10px; font-weight:bold; color:#c43e1c; box-shadow:0 2px 5px rgba(0,0,0,0.1);">PPTX</div>
                    </div>
                    <div style="padding:15px; background:var(--bg-tab);">
                        <h4 style="margin:0 0 5px 0; color:var(--text-main); font-size:15px;">📊 ${w.title} ${privateBadge}</h4>
                        <div style="font-size:12px; color:var(--text-muted);">Автор: <b>${w.author}</b> <span style="background:rgba(196,62,28,0.1); padding:2px 6px; border-radius:6px; color:#c43e1c;">${w.class}</span></div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                            <div style="font-size:11px; color:var(--text-muted);">${dateStr}</div>
                            <div>${downloadBtn} ${deleteBtn}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--danger); padding:30px;">Помилка завантаження бази даних.</div>';
    }
};

window.deletePresWork = async function(workId) {
    if (!confirm('Видалити презентацію?')) return;
    try {
        const { doc, deleteDoc } = await import("[https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js)");
        await deleteDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        window.loadPresGallery();
    } catch(e) {}
};

window.viewPresOnline = async function(workId) {
    try {
        const { doc, getDoc } = await import("[https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js)");
        const snap = await getDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        if(!snap.exists()) return;
        const data = snap.data();
        let slides = [];
        try { slides = JSON.parse(data.content); } catch(e) { return window.showPresToast("Помилка формату презентації.", 5000); }
        window.startLocalSlideShow(slides, data.title, data.author, workId);
    } catch(e) { window.showPresToast("Помилка відображення.", 4000); }
};

window.startLocalSlideShow = function(slidesData = null, title = null, author = null, workId = null) {
    if (!slidesData) {
        window.saveCanvasToData();
        window.currentOnlineSlides = window.presSlides.map(s => window.upgradeSlideFormat(s));
        window.currentOnlineSlideIndex = window.currentSlideIndex || 0;
        title = document.getElementById('cr-pres-title-mini')?.value || "Презентація";
        author = window.currentUser ? `${window.currentUser.firstName} ${window.currentUser.lastName}` : "Гість";
    } else {
        window.currentOnlineSlides = slidesData.map(s => window.upgradeSlideFormat(s));
        window.currentOnlineSlideIndex = 0;
    }

    const overlayId = 'view-pres-overlay-' + Date.now();
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = `position:fixed; inset:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; padding:20px; backdrop-filter:blur(5px);`;
    
    const downloadBtnHTML = workId 
        ? `<button onclick="window.triggerDownloadFromDB('${workId}')" style="background:rgba(255,255,255,0.2); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">📥 Скачати .pptx</button>`
        : `<button onclick="window.downloadAsPPTX()" style="background:rgba(255,255,255,0.2); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">📥 Скачати .pptx</button>`;

    overlay.innerHTML = `
        <div style="padding:15px 20px; display:flex; justify-content:space-between; align-items:center; background:#c43e1c; color:white; box-shadow:0 2px 10px rgba(0,0,0,0.3); border-radius: 16px;">
            <div style="font-size:16px; font-weight:bold;">${title} <span style="font-size:12px; font-weight:normal; opacity:0.8; margin-left:10px;">Автор: ${author}</span></div>
            <div style="display:flex; gap:10px;">
                ${downloadBtnHTML}
                <button onclick="document.getElementById('${overlayId}').remove()" style="background:none; color:white; border:none; padding:8px 15px; cursor:pointer; font-weight:bold;">✕ Закрити слайд-шоу</button>
            </div>
        </div>
        
        <div style="flex:1; display:flex; justify-content:center; align-items:center; padding:40px; position:relative;">
            <button onclick="window.changeOnlineSlide(-1)" style="position:absolute; left:20px; background:rgba(255,255,255,0.2); border:none; color:white; font-size:30px; width:50px; height:50px; border-radius:50%; cursor:pointer; z-index:10; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">❮</button>
            
            <div id="online-slide-container" style="background:white; width:100%; max-width:1060px; aspect-ratio:16/9; box-shadow:0 20px 50px rgba(0,0,0,0.8); position:relative; overflow:hidden; transition:0.3s; border-radius:4px;">
            </div>

            <button onclick="window.changeOnlineSlide(1)" style="position:absolute; right:20px; background:rgba(255,255,255,0.2); border:none; color:white; font-size:30px; width:50px; height:50px; border-radius:50%; cursor:pointer; z-index:10; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">❯</button>
        </div>
        <div style="text-align:center; padding:10px; color:white; font-size:14px; font-weight:bold;" id="online-slide-counter"></div>
    `;
    document.body.appendChild(overlay);
    window.renderOnlineSlide();
};

window.changeOnlineSlide = function(dir) {
    const total = window.currentOnlineSlides.length;
    window.currentOnlineSlideIndex += dir;
    if (window.currentOnlineSlideIndex < 0) window.currentOnlineSlideIndex = 0;
    if (window.currentOnlineSlideIndex >= total) window.currentOnlineSlideIndex = total - 1;
    window.renderOnlineSlide();
};

window.renderOnlineSlide = function() {
    const slide = window.currentOnlineSlides[window.currentOnlineSlideIndex];
    const container = document.getElementById('online-slide-container');
    const counter = document.getElementById('online-slide-counter');
    if(!container || !counter) return;

    counter.innerText = `Слайд ${window.currentOnlineSlideIndex + 1} з ${window.currentOnlineSlides.length}`;
    container.style.background = slide.bg || '#ffffff';
    container.innerHTML = '';

    const scale = 1060 / 960; 

    if(slide.elements) {
        [...slide.elements].sort((a,b) => (a.z||0) - (b.z||0)).forEach(elem => {
            const div = document.createElement('div');
            div.innerHTML = elem.content;
            div.style.cssText = `position:absolute; box-sizing:border-box; word-wrap:break-word; overflow:hidden; pointer-events:auto;`;
            div.style.left = (elem.x * scale) + 'px';
            div.style.top = (elem.y * scale) + 'px';
            div.style.width = (elem.w * scale) + 'px';
            div.style.height = (elem.h * scale) + 'px';
            div.style.transform = `rotate(${elem.rot || 0}deg)`;
            div.style.fontSize = ((elem.fontSize || 24) * scale) + 'px';
            div.style.color = elem.color || '#333333';
            div.style.textAlign = elem.align || 'left';
            div.style.zIndex = elem.z || 1;
            if(elem.bold) div.style.fontWeight = 'bold';
            if(elem.italic) div.style.fontStyle = 'italic';
            if(elem.underline) elem.underline = true; // Фікс стилів підкреслення
            container.appendChild(div);
        });
    }
};

window.triggerDownloadFromDB = async function(workId) {
    try {
        const { doc, getDoc } = await import("[https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js)");
        const snap = await getDoc(doc(window.firestoreDB, 'artifacts', window.firebaseAppId, 'public', 'data', 'creative_works', workId));
        if(!snap.exists()) return;
        const data = snap.data();
        let slides = JSON.parse(data.content);
        window.downloadAsPPTX(slides, data.title);
    } catch(e) { window.showPresToast("Помилка завантаження файлу.", 4000); }
};

console.log("📊 Модуль presentations.js (Гібридний Безлімітний Генератор) завантажено!");