import { Api } from './api.js';

export const Calendar = {
    async render() {
        try {
            const posts = await Api.fetchScheduledPosts();
            this.renderCalendar(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            alert('Could not load posts. Please try again later.');
        }
    },

    renderCalendar(posts) {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <h2>Innläggsschema</h2>
            <p>Här kan du se dina schemalagda inlägg</p>
            <p>Du kan ändra inställningarna för schemaläggningen under fliken "Inställningar"</p>
            <ul class="posts"></ul>
        `;

        posts.sort((a, b) => new Date(a.date) - new Date(b.date));

        const postsContainer = content.querySelector('.posts');
        posts.forEach(post => {
            const postContainer = document.createElement('li');
            postContainer.classList.add('post-container');
            postContainer.innerHTML = `
                <p>${post.title.rendered}</p>
                <p>${new Date(post.date).toLocaleDateString()}</p>
            `;
            postsContainer.appendChild(postContainer);
        });
    },

    exitIsSafe() {
        return true;
    },
};