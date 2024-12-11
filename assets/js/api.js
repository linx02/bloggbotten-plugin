export const Api = {
    wpNonce: (typeof bloggbottenData !== 'undefined') ? bloggbottenData.nonce : '',
    baseApiUrl: 'http://localhost:8081/api',

    async fetchSettings() {
        const response = await fetch('/wp-json/bloggbotten/v1/settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
    },

    async saveSettings(data) {
        const response = await fetch('/wp-json/bloggbotten/v1/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    async fetchSiteUrl() {
        const response = await fetch('/wp-json/bloggbotten/v1/site-url', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch site URL');
        return response.json();
    },

    async fetchScheduledPosts() {
        const response = await fetch('/wp-json/wp/v2/posts?status=future', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch posts');
        return response.json();
    },

    async updatePostDate(postId, isoDate) {
        const response = await fetch(`/wp-json/wp/v2/posts/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
            body: JSON.stringify({ date: isoDate }),
        });
        return response.ok;
    },

    async generateCompanyDescription(userId, authKey, siteUrl) {
        const response = await fetch(`${this.baseApiUrl}/content/company-description?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': authKey,
            },
            body: JSON.stringify({ url: siteUrl }),
        });
        if (!response.ok) throw new Error('Failed to generate company description');
        return response.json();
    },

    async generateSeoKeywords(userId, authKey, description) {
        const response = await fetch(`${this.baseApiUrl}/content/seo-keywords?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': authKey,
            },
            body: JSON.stringify({ companyDescription: description }),
        });
        if (!response.ok) throw new Error('Failed to generate SEO keywords');
        return response.json();
    },

    async generateTitles(userId, authKey, description, seoKeywords, amount, negativeTitles, additionalInstructions) {
        const response = await fetch(`${this.baseApiUrl}/content/titles?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': authKey,
            },
            body: JSON.stringify({
                companyDescription: description,
                seoKeywords,
                amount,
                negativeTitles,
                additionalInstructions,
            }),
        });
        if (!response.ok) throw new Error('Failed to fetch titles');
        return response.json();
    },

    async generateArticle(userId, authKey, title, seoKeywords) {
        const response = await fetch(`${this.baseApiUrl}/content/article?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': authKey,
            },
            body: JSON.stringify({ title, seoKeywords }),
        });
        if (!response.ok) throw new Error('Failed to fetch article');
        return response.json();
    },

    async saveArticleWithStatus(title, content, status = 'draft', date = null) {
        const bodyData = {
            title,
            content,
            status
        };

        // If we're scheduling a future post, include the date
        if (status === 'future' && date) {
            bodyData.date = date; 
        }

        const response = await fetch('/wp-json/wp/v2/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
            body: JSON.stringify(bodyData),
        });

        if (!response.ok) throw new Error('Failed to save the article');
        return response.json();
    },

    async getLastScheduledPostDate() {
        const response = await fetch('/wp-json/wp/v2/posts?status=future&orderby=date&order=desc', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': bloggbottenData.nonce,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch scheduled posts');
        const posts = await response.json();
        if (posts.length === 0) {
            // No scheduled posts yet, so no last scheduled date
            return null;
        }
        // The first post in the array is the most recently scheduled
        return new Date(posts[0].date);
    },

    async getPostTitles() {
        const response = await fetch('/wp-json/wp/v2/posts?per_page=100&status=future,publish,draft', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpNonce,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch posts');
        const posts = await response.json();
        return posts.map(post => post.title.rendered);
    },

    async getCredits(userId, authKey) {
        const response = await fetch(`${this.baseApiUrl}/credits?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': authKey,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch credits');
        return response.json();
    },
};