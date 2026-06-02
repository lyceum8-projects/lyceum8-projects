/**
 * 🛡️ УНІВЕРСАЛЬНИЙ БЛОКУВАЛЬНИК РЕКЛАМИ (AD BLOCKER)
 * ВЕРСІЯ 2.0: Хірургічне видалення текстового спаму від API (op.wtf)
 */

(function() {
    'use strict';

    // ==========================================
    // 1. ЖОРСТКЕ БЛОКУВАННЯ ПОСИЛАНЬ (CSS)
    // ==========================================
    // Вбудовуємо правило, щоб спам-посилання фізично не могли з'явитися на екрані
    if (!document.getElementById('anti-spam-styles')) {
        const style = document.createElement('style');
        style.id = 'anti-spam-styles';
        style.textContent = `
            a[href*="op.wtf"], 
            a[href*="proxy"] { 
                display: none !important; 
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
            }
        `;
        document.head.appendChild(style);
    }

    const adSelectors = [
        '.ad', '.ads', '.advert', '.advertisement', '.ad-container',
        '.ad-banner', '.banner-ad', '.sponsor', '.sponsored',
        '[id^="div-gpt-ad"]', '[id^="google_ads"]', '[id^="ad-"]',
        'ins.adsbygoogle', 'iframe[src*="doubleclick.net"]',
        'iframe[src*="googlesyndication.com"]',
        '.ytd-promoted-sparkles-web-renderer',
        '.video-ads', '.ytp-ad-module',
        'div[data-ad-preview="message"]',
        '#carbonads', '#carbonads *'
    ];

    const destroyAds = () => {
        // Видалення стандартних банерів
        document.querySelectorAll(adSelectors.join(', ')).forEach(el => {
            if (el && el.parentNode) {
                el.style.display = 'none !important';
                el.remove();
            }
        });

        const antiAdblocks = document.querySelectorAll('[class*="anti-ad"], [id*="anti-ad"], .adblock-msg');
        antiAdblocks.forEach(el => el.remove());

        if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = 'auto';
        }

        // ==========================================
        // 2. ХІРУРГІЧНЕ ОЧИЩЕННЯ ТЕКСТУ
        // ==========================================
        
        // Крок А: Безпечно стираємо спам-фразу з текстових вузлів (не ламаючи React/Vue)
        const walk = document.createTreeWalker(
            document.body || document.documentElement, 
            NodeFilter.SHOW_TEXT, 
            null, 
            false
        );
        let node;
        const spamNodes = [];
        
        while ((node = walk.nextNode())) {
            if (node.nodeValue && /Need proxies cheaper/i.test(node.nodeValue)) {
                spamNodes.push(node);
            }
        }
        
        // Замінюємо знайдений спам на порожнечу
        spamNodes.forEach(n => {
            n.nodeValue = n.nodeValue.replace(/Need proxies cheaper than the market\??/gi, '').trim();
        });

        // Крок Б: Прибираємо залишки HTML (наприклад, зайві перенесення рядків <br> перед посиланням)
        document.querySelectorAll('p, div, span').forEach(el => {
            if (el.innerHTML && el.innerHTML.includes('op.wtf')) {
                // Вирізаємо посилання та <br> перед ним
                el.innerHTML = el.innerHTML.replace(/(<br\s*\/?>)?\s*<a[^>]*href="[^"]*op\.wtf[^>]*>.*?<\/a>/gi, '');
                // Вирізаємо просто текст посилання, якщо воно не клікабельне
                el.innerHTML = el.innerHTML.replace(/(<br\s*\/?>)?\s*https?:\/\/op\.wtf/gi, '');
            }
        });
    };

    // Запускаємо відразу при завантаженні
    destroyAds();
    window.addEventListener('load', destroyAds);

    // Створюємо MutationObserver для стеження за текстом, що друкується в реальному часі
    const observer = new MutationObserver((mutations) => {
        let shouldClean = false;
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0 || mutation.type === 'characterData') {
                shouldClean = true;
                break;
            }
        }
        if (shouldClean) {
            // Використовуємо requestAnimationFrame, щоб не перевантажувати браузер
            requestAnimationFrame(destroyAds);
        }
    });

    // Спостерігаємо за всією сторінкою (і за змінами тексту всередині неї)
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Резервний таймер
    setInterval(destroyAds, 1500);

    console.log("🛡️ Посилений блокувальник API-спаму активовано!");
})();