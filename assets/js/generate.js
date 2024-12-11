import { Api } from './api.js';
import { Settings } from './settings.js';
import { getNextScheduledDate } from './utils.js';
import { setLoading } from './state.js';

export const Generate = {

    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="15px" height="100%"><path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM4.736,11.5l3.509,1.755L10,16.764l1.755-3.509L15.264,11.5,11.755,9.745,10,6.236,8.245,9.745ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"/></svg>`,

    exitIsSafe() {
        const titles = document.querySelectorAll('.title');
        const emptyTitles = Array.from(titles).filter(t => t.value);
        if (emptyTitles.length > 0) {
            return false;
        }
        return true;
    },

    async render() {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <h2>Bulk- handlingar</h2>
            <div class="generate-all-buttons">
                <button id="generate-all-titles-button" class="ai-button">${this.svgIcon} Generera alla rubriker</button>
                <div class="divider-vertical"></div>
                <button id="generate-all-articles-button" class="ai-button">${this.svgIcon} Generera alla artiklar</button>
            </div>
            <div class="divider"></div>
            <h2>Instruktioner till AI:n</h2>
            <p>Lägg till ytterligare instruktioner till AI:n för att styra resultatet. (Valfritt)</p>
            <textarea rows="5" class="additional-instructions" placeholder="Exempel: Artiklarna ska ge svar på mycket specifika sökfrågor relevanta till min kundgrupp, exempelvis: Hur man migrerar en Wordpress installation från en subdomän till huvuddomänen"></textarea>
            <div class="divider"></div>
            <h2>Lägg till artiklar</h2>
            <div class="add-title-buttons">
                <button class="add-title" data-amount="1">+1</button>
                <div class="divider-vertical"></div>
                <button class="add-title" data-amount="4">+4</button>
                <div class="divider-vertical"></div>
                <button class="add-title" data-amount="26">+26</button>
                <div class="divider-vertical"></div>
                <button class="add-title" data-amount="52">+52</button>
            </div>
            <div class="divider"></div>
            <div class="titles"></div>
        `;
        this.addEventListeners();
    },

    addEventListeners() {
        document.querySelectorAll('.add-title').forEach(btn => {
            btn.addEventListener('click', () => this.addTitleInputs(btn.getAttribute('data-amount')));
        });
        document.getElementById('generate-all-titles-button').addEventListener('click', () => this.generateAllTitles());
        document.getElementById('generate-all-articles-button').addEventListener('click', () => this.generateAllArticles());
    },

    addTitleInputs(amount) {
        const titles = document.querySelector('.titles');
        for (let i = 0; i < amount; i++) {
            const titleContainer = document.createElement('div');
            titleContainer.classList.add('title-container');
            titleContainer.innerHTML = `
                <input class="title" type="text" placeholder="Rubrik">
                <button class="generate-title-button ai-button">${this.svgIcon} Generera rubrik</button>
                <button class="generate-article-button ai-button" style="display: none;">${this.svgIcon} Generera artikel</button>
                <button class="delete-title-button">Ta bort</button>
            `;
            titles.appendChild(titleContainer);
        }

        titles.querySelectorAll('.title-container').forEach(container => {
            const genTitleBtn = container.querySelector('.generate-title-button');
            const genArticleBtn = container.querySelector('.generate-article-button');
            const delTitleBtn = container.querySelector('.delete-title-button');
            const titleInput = container.querySelector('.title');

            titleInput.addEventListener('input', () => {
                if (titleInput.value) {
                    genTitleBtn.style.display = 'none';
                    genArticleBtn.style.display = 'inline-block';
                } else {
                    genTitleBtn.style.display = 'inline-block';
                    genArticleBtn.style.display = 'none';
                }
            });

            genTitleBtn.addEventListener('click', async () => {
                const titleInput = container.querySelector('.title');
                titleInput.value = await this.generateSingleTitle();

                genTitleBtn.style.display = 'none';
                genArticleBtn.style.display = 'inline-block';
            });

            genArticleBtn.addEventListener('click', async () => {
                const titleInput = container.querySelector('.title');
                const article = await this.generateArticle(titleInput.value);
                const articleContent = article.article.replace(/^```html\s*/, '').replace(/```$/, '').replace(`<h1>${title}</h1>`, '');
                if (articleContent) await this.saveArticle(titleInput.value, articleContent);
                container.remove();
            });

            delTitleBtn.addEventListener('click', () => {
                container.remove();
            });
        });
    },

    async generateSingleTitle() {
        const { userId, authKey, description, keywords } = await this.loadBasicSettings();
        setLoading(true, 'Genererar rubrik...');

        const negativeTitles = await Api.getPostTitles();
        const additionalInstructions = document.querySelector('.additional-instructions').value || '';

        const data = await Api.generateTitles(userId, authKey, description, keywords.split('\n'), 1, negativeTitles, additionalInstructions);
        setLoading(false);
        if (!data || !data.articleTitles) return;

        return data.articleTitles[0];
    },


    async generateAllTitles() {
        const titles = document.querySelectorAll('.title');
        const emptyTitles = Array.from(titles).filter(t => !t.value);
        const amount = emptyTitles.length;
        if (amount === 0) return;

        const negativeTitles = await Api.getPostTitles();
        const additionalInstructions = document.querySelector('.additional-instructions').value || '';

        const { userId, authKey, description, keywords } = await this.loadBasicSettings();
        setLoading(true, 'Genererar rubriker...');
        const data = await Api.generateTitles(userId, authKey, description, keywords.split('\n'), amount, negativeTitles, additionalInstructions);
        if (!data || !data.articleTitles) return;

        let index = 0;
        titles.forEach((title) => {
            if (!title.value) {
                title.value = data.articleTitles[index++];
                title.dispatchEvent(new Event('input'));
            }
        });

        setLoading(false);
    },

    async generateArticle(title, i = 1, length = 1) {
        if (!title) {
            alert('Please provide a title first.');
            return;
        }

        const { userId, authKey, keywords } = await this.loadBasicSettings();
        setLoading(true, `Genererar artikel ${i} av ${length}, lämna sidan öppen...`);
        return Api.generateArticle(userId, authKey, title, keywords.split('\n'));
    },

    async generateAllArticles() {
        let i = 1;
        let originalLength = document.querySelectorAll('.title').length;
        while (true) {
            const titles = document.querySelectorAll('.title'); // Re-query dynamically
            if (titles.length === 0) break; // Exit when no titles are left
    
            const titleInput = titles[0];
            const title = titleInput.value;
    
            if (!title) {
                titleInput.parentNode.remove();
                continue;
            }
    
            const article = await this.generateArticle(title, i, originalLength);
            const articleContent = article.article
                .replace(/^```html\s*/, '')
                .replace(/```$/, '')
                .replace(`<h1>${title}</h1>`, '');
    
            if (articleContent) await this.saveArticle(title, articleContent);
    
            // Remove container after saving
            titleInput.parentNode.remove();
            i++;
        }
    },

    async loadBasicSettings() {
        try {
            setLoading(true, 'Laddar inställningar...');
            const data = await Api.fetchSettings();
            setLoading(false);
            return {
                userId: data.user_id || '',
                authKey: data.auth_key || '',
                description: data.description || '',
                keywords: data.keywords || '',
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Could not load settings. Please try again later.');
            return {};
        }
    },

    async saveArticle(title, content) {
        setLoading(true, 'Sparar artikel...');
        const settingsData = await Api.fetchSettings();
        const schedule = settingsData.schedule;
        const { time, days } = schedule;
    
        if (!time || !days || days.length === 0) {
            // No schedule, save as draft
            const data = await Api.saveArticleWithStatus(title, content, 'draft');
            setLoading(false);
            alert(`No schedule defined. Article saved as draft with ID: ${data.id}`);
            return;
        }
    
        const [hour, minute] = time.split(':');
        const scheduleDays = days.map(d => d.toLowerCase());
    
        const lastScheduledDate = await Api.getLastScheduledPostDate();
        let startDate = lastScheduledDate ? new Date(lastScheduledDate) : new Date();
    
        // To ensure strictly future scheduling, increment by a second if a last date exists
        if (lastScheduledDate) {
            startDate = new Date(startDate.getTime() + 1000);
        }
    
        const nextDate = getNextScheduledDate(startDate, scheduleDays);
        nextDate.setHours(hour, minute, 0, 0);
    
        const isoDate = nextDate.toISOString();
        const data = await Api.saveArticleWithStatus(title, content, 'future', isoDate);
        
        setLoading(false);
    }
};