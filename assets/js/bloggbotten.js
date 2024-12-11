import { Settings } from './settings.js';
import { Generate } from './generate.js';
import { Calendar } from './calendar.js';
import { Profile } from './profile.js';
import { setCurrentTab, AppState } from './state.js';
import { confirmExit } from './utils.js';

export const Bloggbotten = {
    init() {
        this.setupNav();
        Generate.render(); // Default tab

        window.addEventListener('beforeunload', (e) => {
            if (!this.preventExit()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    preventExit() {
        switch (AppState.currentTab) {
            case 'settings':
                return Settings.exitIsSafe();
            case 'generate':
                return Generate.exitIsSafe();
            case 'calendar':
                return Calendar.exitIsSafe();
            case 'profile':
                return Profile.exitIsSafe();
            default:
                console.warn('Unknown tab:', AppState.currentTab);
        }
    },

    setupNav() {

        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach((button) => {
            button.addEventListener('click', async () => {
                if (button.classList.contains('active')) return;

                let exitIsSafe = this.preventExit();

                if (!exitIsSafe) {
                    const exitConfirmed = await confirmExit();
                    if (!exitConfirmed) return;
                }

                navButtons.forEach((el) => el.classList.remove('active'));
                button.classList.add('active');

                const dataTarget = button.getAttribute('data-target');

                switch (dataTarget) {
                    case 'settings':
                        Settings.render();
                        setCurrentTab('settings');
                        break;
                    case 'generate':
                        Generate.render();
                        setCurrentTab('generate');
                        break;
                    case 'calendar':
                        Calendar.render();
                        setCurrentTab('calendar');
                        break;
                    case 'profile':
                        Profile.render();
                        setCurrentTab('profile');
                        break;
                    default:
                        console.warn('Unknown tab:', dataTarget);
                }
            });
        });
    },
};