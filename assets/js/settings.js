import { Api } from './api.js';
import { getNextScheduledDate } from './utils.js';
import { setLoading } from './state.js';

export const Settings = {
    data: {
        userId: '',
        authKey: '',
        description: '',
        keywords: '',
        schedule: { time: '', days: [] },
    },

    hasSavedSettings: false,

    exitIsSafe() {

        console.log(this.hasSavedSettings);

        if (this.hasSavedSettings) return true;

        const userId = document.getElementById('user-id').value;
        const authKey = document.getElementById('auth-key').value;
        const description = document.getElementById('description-textarea').value;
        const keywords = document.getElementById('seo-textarea').value;
        const schedule = {
            time: document.getElementById('publish-time').value,
            days: Array.from(document.querySelectorAll('.schedule input[type="checkbox"]:checked')).map(c => c.value),
        };

        const hasChanged = userId !== this.data.userId
            || authKey !== this.data.authKey
            || description !== this.data.description
            || keywords !== this.data.keywords
            || schedule.time !== this.data.schedule.time
            || schedule.days.length !== this.data.schedule.days.length

        if (hasChanged) {
            return false;
        }

        return true;
    },

    async render() {
        try {
            const fetchedData = await Api.fetchSettings();
            this.data.userId = fetchedData.user_id || '';
            this.data.authKey = fetchedData.auth_key || '';
            this.data.description = fetchedData.description || '';
            this.data.keywords = fetchedData.keywords || '';
            this.data.schedule = fetchedData.schedule || { time: '', days: [] };

            this.renderSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Could not load settings. Please try again later.');
        }
    },

    renderSettings() {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <h2>Autentiseringsnyckel</h2>
            <p>Har du ingen? Hämta din nyckel <a href="/">här</a></p>
            <input id="auth-key" type="text" value="${this.data.authKey}">

            <h2>Användar-ID</h2>
            <p>Har du inget? Hämta ditt användar-id <a href="/">här</a></p>
            <input id="user-id" type="text" value="${this.data.userId}">

            <h2>Beskrivning av hemsidan</h2>
            <p>Denna används av AI för att generera relevanta inlägg för din målgrupp, max 500 tecken.</p>
            <p class="paragraph-link">Generera med AI</p>
            <textarea id="description-textarea" placeholder="Bolagets syfte bla bla" rows="5">${this.data.description}</textarea>

            <h2>SEO-nyckelord</h2>
            <p>Dessa används av AI för att generera inlägg som hjälper dig att ranka. Ett nyckelord per rad, max 20</p>
            <p class="paragraph-link">Generera med AI</p>
            <textarea id="seo-textarea" placeholder="Nyckelord 1\nNyckelord 2" rows="5">${this.data.keywords}</textarea>

            <h2>Schemaläggning</h2>
            <p>Ställ in när inlägg ska publiceras</p>
            <h3>Publicera inlägg varje</h3>
            <div class="schedule">
                ${this.renderScheduleCheckboxes()}
            </div>
            <h3>Publicera inlägg kl</h3>
            <input type="time" id="publish-time" name="publish-time" value="${this.data.schedule.time || ''}">
            <br>
            <button id="save-button">Spara ändringar</button>
        `;

        this.populateScheduleCheckboxes();
        this.addEventListeners();
    },

    renderScheduleCheckboxes() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const swedishDayMap = {
            monday: 'Måndag',
            tuesday: 'Tisdag',
            wednesday: 'Onsdag',
            thursday: 'Torsdag',
            friday: 'Fredag',
            saturday: 'Lördag',
            sunday: 'Söndag',
        };
        return days.map(day => `
            <li>
                <input type="checkbox" id="${day}" name="${day}" value="${day}">
                <label for="${day}">${swedishDayMap[day]}</label>
            </li>
        `).join('');
    },

    populateScheduleCheckboxes() {
        const { days } = this.data.schedule;
        days.forEach(day => {
            const checkbox = document.getElementById(day);
            if (checkbox) checkbox.checked = true;
        });
    },

    addEventListeners() {
        const generateButtons = document.querySelectorAll('.paragraph-link');
        const [generateCompanyDescriptionButton, generateSeoKeywordsButton] = generateButtons;

        generateCompanyDescriptionButton.addEventListener('click', () => this.generateCompanyDescription());
        generateSeoKeywordsButton.addEventListener('click', () => this.generateSeoKeywords());

        document.getElementById('save-button').addEventListener('click', () => this.saveSettings());
    },

    async generateCompanyDescription() {
        try {
            const urlData = await Api.fetchSiteUrl();
            urlData.site_url = "https://guidelight.se"; // temp override
            const userId = document.getElementById('user-id').value;
            const authKey = document.getElementById('auth-key').value;

            const data = await Api.generateCompanyDescription(userId, authKey, urlData.site_url);
            document.getElementById('description-textarea').value = data.companyDescription;
        } catch (error) {
            console.error(error);
            alert('Error generating company description.');
        }
    },

    async generateSeoKeywords() {
        try {
            const userId = document.getElementById('user-id').value;
            const authKey = document.getElementById('auth-key').value;
            const description = document.getElementById('description-textarea').value;

            const data = await Api.generateSeoKeywords(userId, authKey, description);
            document.getElementById('seo-textarea').value = data.seoKeywords.join('\n');
        } catch (error) {
            console.error(error);
            alert('Error generating SEO keywords.');
        }
    },

    async saveSettings() {
        const userId = document.getElementById('user-id').value;
        const authKey = document.getElementById('auth-key').value;
        const description = document.getElementById('description-textarea').value;
        const keywords = document.getElementById('seo-textarea').value;
        const days = Array.from(document.querySelectorAll('.schedule input[type="checkbox"]:checked')).map(c => c.value);
        const time = document.getElementById('publish-time').value;

        if (!time || days.length === 0) {
            alert('Please provide a time and select at least one day.');
            return;
        }

        const schedule = { time, days };

        try {
            setLoading(true, 'Sparar inställningar...');
            const response = await Api.saveSettings({
                user_id: userId,
                auth_key: authKey,
                description,
                keywords,
                schedule,
            });

            if (!response.success) throw new Error('Failed to save settings');
            await this.reschedulePosts(schedule);
            this.hasSavedSettings = true;
            setLoading(false);

        } catch (error) {
            console.error(error);
            alert('Error saving settings or rescheduling posts.');
        }
    },

    async reschedulePosts(schedule) {
        try {
            setLoading(true, 'Schemalägger inlägg...');
            const posts = await Api.fetchScheduledPosts();
            if (!posts.length) {
                alert('No scheduled posts to reschedule.');
                return;
            }
    
            const [hour, minute] = schedule.time.split(':');
            const scheduleDaysLower = schedule.days.map(day => day.toLowerCase());
    
            // Start scheduling from now (or any other baseline date you prefer)
            let schedulingDate = new Date();
    
            for (const post of posts) {
                // Get the next scheduled date after 'schedulingDate'
                schedulingDate = getNextScheduledDate(schedulingDate, scheduleDaysLower);
                schedulingDate.setHours(hour, minute, 0, 0);
    
                // Update the post date to this newly computed scheduled date
                await Api.updatePostDate(post.id, schedulingDate.toISOString());
    
                // Increment schedulingDate slightly so the next post finds a new day
                schedulingDate = new Date(schedulingDate.getTime() + 1000);
            }

            setLoading(false);
    
        } catch (error) {
            console.error('Error in rescheduling posts:', error);
            alert('Error rescheduling posts.');
        }
    }
};