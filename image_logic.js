// image_logic.js

(function(window) {
    'use strict';

    /**
     * Створює HTML-код для згенерованого зображення на основі текстового запиту з урахуванням розмірів.
     * @param {string} prompt - Текстовий опис для генерації зображення.
     * @returns {string} - Рядок HTML з тегом <img>.
     */
    window.renderGeneratedImage = function(prompt) {
        if (!prompt) {
            return '<p style="color:red;">Помилка: Немає опису для генерації зображення.</p>';
        }

        // Очищуємо промпт від зайвих символів для URL
        let cleanPrompt = prompt.replace(/[&<>"']/g, '').trim();
        let width = 1024;
        let height = 768;
        let formatLabel = "Стандартний (1024x768)";
        let isAvatar = false;

        const promptLower = cleanPrompt.toLowerCase();

        // Визначаємо формат та розміри зображення
        if (/(шпалери на пк|пк|комп'ютер|компютер|pc|desktop|wallpaper pc)/i.test(promptLower)) {
            width = 1920;
            height = 1080;
            formatLabel = "💻 Шпалери на ПК (1920x1080)";
        } else if (/(шпалери на телефон|телефон|мобільн|смартфон|phone|mobile|smartphone)/i.test(promptLower)) {
            width = 1080;
            height = 1920;
            formatLabel = "📱 Шпалери на телефон (1080x1920)";
        } else if (/(аватарка|аватар|профіль|avatar|profile pic|круг)/i.test(promptLower)) {
            width = 1024;
            height = 1024;
            formatLabel = "👤 Кругла аватарка (1024x1024)";
            isAvatar = true;
        }

        // Динамічний стиль для уникнення деформації зображення
        let imgStyle = "";
        if (isAvatar) {
            imgStyle = "width:250px;height:250px;aspect-ratio:1/1;border-radius:50%;object-fit:cover;opacity:0.5;transition:opacity 0.5s;display:block;margin:10px auto;box-shadow: 0 6px 20px rgba(0,0,0,0.15);border:3px solid var(--primary);";
        } else {
            imgStyle = `width:100%;max-width:100%;height:auto;aspect-ratio:${width}/${height};object-fit:cover;border-radius:12px;opacity:0.5;transition:opacity 0.5s;box-shadow: 0 4px 15px rgba(0,0,0,0.1);`;
        }

        // Покращуємо промпт для Flux.1 в залежності від стилю запиту
        let enhanceSuffix = ", masterpiece, high quality, highly detailed, sharp focus, 8k resolution, perfect lighting, correct proportions, no blur, extremely clear details";
        const isAnime = /(аніме|anime|manga|манга|cartoon|мультяшн|малюнок|ілюстрація|drawing|illustration|chibi|чиби|2d)/i.test(promptLower);
        if (isAnime) {
            enhanceSuffix += ", vibrant colors, clean lineart, aesthetic anime art style, colorful, exquisite details";
        } else {
            enhanceSuffix += ", photorealistic, hyperrealistic, detailed textures, realistic lighting";
        }
        const enhancedPrompt = cleanPrompt + enhanceSuffix;

        // Формуємо URL для API Pollinations.ai з моделлю flux та автопокращенням
        const keyParam = window.APP_CONFIG?.POLLINATIONS_API_KEY ? `&key=${window.APP_CONFIG.POLLINATIONS_API_KEY}` : '';
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&model=flux&enhance=true&seed=${Math.random()}${keyParam}`;

        // Повертаємо HTML-код зображення з прелоадером
        return `<div style="background:var(--bg-tab);border:1px solid var(--border);border-radius:16px;padding:15px;text-align:center;margin:10px 0;">` +
               `<p style="font-size:13px;color:var(--text-muted);margin-bottom:10px;font-weight:600;">🎨 Генеруємо: <span style="color:var(--primary);">${formatLabel}</span>...</p>` +
               `<img src="${imageUrl}" alt="Згенероване зображення: ${cleanPrompt}" style="${imgStyle}" onload="this.style.opacity=1;this.previousElementSibling.style.display='none';" onerror="this.parentElement.innerHTML='&lt;p style=&quot;color:var(--danger);&quot;&gt;Помилка завантаження зображення. Спробуйте інший запит.&lt;/p&gt;';"/>` +
               `</div>`;
    };

    console.log("🖼️ Модуль image_logic.js завантажено.");

})(window);
