import { Api } from './api.js';

export const Profile = {
    async render() {
        try {
            const settings = await Api.fetchSettings();
            const res = await Api.getCredits(settings.user_id, settings.auth_key);
            this.renderProfile(res.credits);
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Could not load profile. Please try again later.');
        }
    },

    renderProfile(credits) {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <h2>Profil</h2>
            <h3>${credits} krediter</h3>
            <a href="#">Köp fler</a>
        `;
    },

    exitIsSafe() {
        return true;
    },
}