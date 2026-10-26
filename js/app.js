/* Split-shell bootstrap and compatibility hooks. */
(() => {
    const original = window.renderSearchResults;
    const normalize = value => String(value || '').toLowerCase().trim();
    const distance = (a, b) => {
        const row = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let diagonal = row[0]; row[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const prior = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)); diagonal = prior;
            }
        }
        return row[b.length];
    };
    window.fuzzyTitleScore = (term, media) => {
        const query = normalize(term);
        const titles = [media?.title?.english, media?.title?.romaji, media?.title?.native].map(normalize).filter(Boolean);
        return Math.max(...titles.map(title => title === query ? 1000 : title.startsWith(query) ? 800 - title.length : 500 - distance(query, title)));
    };
    if (typeof original === 'function') {
        window.renderSearchResults = (media, isCurrentRequest) => {
            const input = document.getElementById('search-input');
            const term = input?.value || '';
            const sorted = [...(media || [])].sort((a, b) => window.fuzzyTitleScore(term, b) - window.fuzzyTitleScore(term, a));
            return original(sorted, isCurrentRequest);
        };
    }
    window.openRandomAnime = async () => {
        try {
            const data = await window.MetroApi.query(`query { Page(page: 1, perPage: 50) { media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { id } } }`);
            const ids = data?.Page?.media?.map(item => item.id).filter(Boolean) || [];
            if (ids.length && typeof window.openDetailById === 'function') {
                window.openDetailById(ids[Math.floor(Math.random() * ids.length)], 'ANIME');
            }
        } catch (error) {
            console.error('random anime failed:', error);
            window.showToast?.('random anime unavailable');
        }
    };
    document.addEventListener('mouseover', event => {
        const card = event.target.closest('.user-activity-card');
        if (!card || card.title) return;
        const time = card.querySelector('.user-activity-time')?.textContent || '';
        card.title = time ? `activity: ${time}` : 'activity update';
    });
})();
