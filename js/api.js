/* Shared AniList API facade. The legacy engine remains the source of truth during migration. */
window.MetroApi = window.MetroApi || {
    query(query, variables) {
        if (typeof window.fetchAPI !== 'function') {
            return Promise.reject(new Error('AniList API is not ready'));
        }
        return window.fetchAPI(query, variables || {});
    }
};
