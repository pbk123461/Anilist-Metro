// ==========================================
// CONFIG & STATE
// ==========================================
const CLIENT_ID = 40698;
let accessToken = localStorage.getItem('anilist_token');
let currentUserId = null;
let allListsData = { ANIME: {}, MANGA: {} };
let currentMediaType = 'ANIME';
let currentLibStatus = 'CURRENT';
let searchType = 'ANIME';
let searchSort = null;
let isGuest = false;
let feedMode = 'following';
let inboxMode = 'unread';
let currentMediaCache = null;
let libraryItemsPerPage = 50;
let currentLibraryPage = 1;
let activityPage = 1;
let notifPage = 1;
let communityPage = 1;
let wheelPickedColor = localStorage.getItem('metro_theme') || '#1ba1e2';

// ==========================================
// FLIP TILES
// ==========================================
function createFlipTile(id, type, coverImage, title, fullTitle, score, status, progressStr) {
    return `
    <div class="tile flip-tile" onclick="openDetailById(${id},'${type}')">
        <div class="flip-tile-inner">
            <div class="flip-tile-front">
                <img src="${coverImage}" loading="lazy"/>
                ${score ? `<div class="tile-score">${score}</div>` : ''}
                ${status ? `<div class="tile-badge">${status}</div>` : ''}
                <div class="tile-label">${title.toLowerCase()}</div>
            </div>
            <div class="flip-tile-back">
                <div class="tile-back-title">${fullTitle.toLowerCase()}</div>
                ${progressStr ? `<div style="font-size:12px; margin-bottom:5px; color:rgba(255,255,255,0.7);">${progressStr.toLowerCase()}</div>` : ''}
                <div class="tile-back-rating"><i class="fa-solid fa-star"></i> ${score || 'n/a'}</div>
            </div>
        </div>
    </div>`;
}

function initLiveTiles() {
    setInterval(() => {
        const tiles = document.querySelectorAll('.flip-tile');
        if (tiles.length === 0) return;
        const t = tiles[Math.floor(Math.random() * tiles.length)];
        t.classList.add('flipped');
        setTimeout(() => t.classList.remove('flipped'), 4000);
    }, 2500);
}

let container, bgHero, topNav, navItems;
let activeNavIndex = -1;
let isDown = false, startX, scrollLeft;

function getSectionWidth() {
    return container ? container.clientWidth : window.innerWidth;
}

const interactiveElements = 'button, a, i, input, select, .status-btn, .tile, .prog-item, .pivot-item, .filter-chip, .mts-btn, .feed-tab, .trending-tile, .inbox-item, .detail-close, canvas, .color-swatch, .dropbtn, .dropdown-content, .metro-tile-start, .anime-poster, iframe, .btn-back, .wp-setting-item, .btn-back-text, .switch, .check';

function setupPanorama() {
    container = document.getElementById('app-container');
    bgHero = document.getElementById('dynamic-header');
    topNav = document.getElementById('main-nav');
    navItems = document.querySelectorAll('.nav-item');
    if (!container) return;

    container.addEventListener('mousedown', (e) => {
        if (e.target.closest(interactiveElements)) return;
        isDown = true; container.style.cursor = 'grabbing'; container.style.scrollSnapType = 'none';
        startX = e.pageX - container.offsetLeft; scrollLeft = container.scrollLeft;
    });
    container.addEventListener('mouseleave', () => { if(isDown){ isDown = false; container.style.cursor = ''; container.style.scrollSnapType = 'x mandatory'; }});
    container.addEventListener('mouseup',    () => { if(isDown){ isDown = false; container.style.cursor = ''; container.style.scrollSnapType = 'x mandatory'; }});
    container.addEventListener('mousemove',  (e) => {
        if (!isDown) return; e.preventDefault(); container.scrollLeft = scrollLeft - (e.pageX - container.offsetLeft - startX) * 1.5;
    });
    container.addEventListener('wheel', (evt) => {
        if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) return;
        if (evt.shiftKey && evt.deltaY !== 0) { evt.preventDefault(); container.scrollLeft += evt.deltaY * 2; }
    }, { passive: false });
    container.addEventListener('scroll', () => {
        const width = getSectionWidth();
        const scrollRatio = container.scrollLeft / width;
        const idx = Math.round(scrollRatio);

        if (bgHero) bgHero.style.transform = `translateX(${-scrollRatio * 15}vw)`;

        if (activeNavIndex !== idx) {
            activeNavIndex = idx;
            navItems.forEach((n, i) => n.classList.toggle('active', i === idx));
            if (navItems[idx]) {
                const offset = navItems[idx].offsetLeft;
                topNav.style.transform = `translateX(-${offset}px)`;
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
        if (e.key === 'Escape') { closeDetail(); return; }
        const w = getSectionWidth();
        if (e.key === 'ArrowRight') { e.preventDefault(); container.scrollBy({ left:  w, behavior: 'smooth' }); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); container.scrollBy({ left: -w, behavior: 'smooth' }); }
    });
}

function scrollPanorama(dir) {
    const w = getSectionWidth();
    if (container) container.scrollBy({ left: dir * w, behavior: 'smooth' });
}

function scrollToSection(index) {
    const width = getSectionWidth();
    if (container) container.scrollTo({ left: width * index, behavior: 'smooth' });
    updateMobileNavActive(index);
}

function scrollToSectionMobile(index) {
    scrollToSection(index);
}

// ==========================================
// THEME
// ==========================================
function applyThemeMode(mode) {
    if (mode === 'system') {
        const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', mode);
    }
    const select = document.getElementById('theme-select');
    if(select) select.value = mode;
}
function setThemeMode(mode) { localStorage.setItem('theme_mode', mode); applyThemeMode(mode); updateThemeSubtitle(); }
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if(localStorage.getItem('theme_mode') === 'system') applyThemeMode('system');
});

function setTheme(color, name) {
    document.documentElement.style.setProperty('--accent', color);
    localStorage.setItem('metro_theme', color);
    localStorage.setItem('metro_theme_name', name || color);
    wheelPickedColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    const exact = document.querySelector(`.color-swatch[data-color="${color}"]`);
    if(exact) exact.classList.add('active');
    const cb = document.getElementById('color-preview-box'); if(cb) cb.style.background = color;
    const cd = document.getElementById('color-hex-display'); if(cd) cd.innerText = color;
    updateThemeSubtitle();
    showToast('accent updated');
}

function updateThemeSubtitle() {
    const mode = localStorage.getItem('theme_mode') || 'system';
    const name = localStorage.getItem('metro_theme_name') || 'cobalt';
    const sub = document.getElementById('st-theme-sub');
    if(sub) sub.innerText = `${mode}, ${name}`;
}

// Color wheel (from index.html)
function initColorWheel() {
    const canvas = document.getElementById('color-wheel-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, r = W/2 - 2;
    for (let a = 0; a < 360; a++) {
        const s = (a-1)*Math.PI/180, e = (a+1)*Math.PI/180;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,s,e); ctx.closePath();
        ctx.fillStyle = `hsl(${a},100%,50%)`; ctx.fill();
    }
    const wg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    wg.addColorStop(0,'rgba(255,255,255,1)'); wg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    const dg = ctx.createRadialGradient(cx,cy,r*0.45,cx,cy,r);
    dg.addColorStop(0,'rgba(0,0,0,0)'); dg.addColorStop(1,'rgba(0,0,0,0.65)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();

    let dragging = false;
    function pick(x, y) {
        const px = Math.max(0,Math.min(W-1,x)), py = Math.max(0,Math.min(H-1,y));
        const [r2,g,b] = ctx.getImageData(px,py,1,1).data;
        const hex = '#'+[r2,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
        wheelPickedColor = hex;
        const pb = document.getElementById('color-preview-box'); if(pb) pb.style.background = hex;
        const pd = document.getElementById('color-hex-display'); if(pd) pd.innerText = hex;
        const cr = document.getElementById('wheel-crosshair'); if(cr){ cr.style.left=px+'px'; cr.style.top=py+'px'; }
    }
    canvas.addEventListener('mousedown', e => { dragging=true; const rc=canvas.getBoundingClientRect(); pick(e.clientX-rc.left,e.clientY-rc.top); });
    canvas.addEventListener('mousemove', e => { if(!dragging)return; const rc=canvas.getBoundingClientRect(); pick(e.clientX-rc.left,e.clientY-rc.top); });
    document.addEventListener('mouseup', ()=>{ dragging=false; });
    canvas.addEventListener('touchstart', e=>{ e.preventDefault(); const rc=canvas.getBoundingClientRect(),t=e.touches[0]; pick(t.clientX-rc.left,t.clientY-rc.top); },{passive:false});
    canvas.addEventListener('touchmove',  e=>{ e.preventDefault(); const rc=canvas.getBoundingClientRect(),t=e.touches[0]; pick(t.clientX-rc.left,t.clientY-rc.top); },{passive:false});
}
function applyWheelColor() { setTheme(wheelPickedColor, wheelPickedColor); }

const savedTheme = localStorage.getItem('metro_theme') || '#1ba1e2';
document.documentElement.style.setProperty('--accent', savedTheme);

function updateMobileNavActive(index) {
    if (window.innerWidth > 768) return;
    const items = document.querySelectorAll('.mobile-nav-item');
    items.forEach(item => item.classList.remove('active'));
    if (items[index]) items[index].classList.add('active');
}

document.addEventListener("DOMContentLoaded", () => {
    initColorWheel();
    initLiveTiles();
    setupPanorama();
    updateThemeSubtitle();

    const cb = document.getElementById('color-preview-box'); if(cb) cb.style.background = savedTheme;
    const cd = document.getElementById('color-hex-display'); if(cd) cd.innerText = savedTheme;
    wheelPickedColor = savedTheme;

    document.querySelectorAll('#theme-colors .color-swatch:not(input)').forEach(swatch => {
        if (swatch.dataset.color === savedTheme) swatch.classList.add('active');
        swatch.addEventListener('click', e => { setTheme(e.target.dataset.color, e.target.dataset.name); });
    });
    const customPicker = document.getElementById('custom-color-picker');
    if(customPicker) {
        customPicker.value = savedTheme;
        customPicker.addEventListener('input', e => { setTheme(e.target.value, 'custom'); });
    }

    document.querySelectorAll('#library-pivots .pivot-item').forEach((p, i) => p.classList.toggle('active', i === 0));
    document.querySelectorAll('#library-pivots .pivot-item').forEach(item => {
        item.addEventListener('click', e => {
            document.querySelectorAll('#library-pivots .pivot-item').forEach(s => s.classList.remove('active'));
            e.target.classList.add('active'); currentLibStatus = e.target.dataset.status; renderLibrary(currentLibStatus);
        });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            clearTimeout(searchTimeout);
            const term = e.target.value.trim();
            if (term.length < 2) { document.getElementById('search-results').innerHTML = ''; return; }
            searchTimeout = setTimeout(() => doSearch(term), 450);
        });
    }

    checkAuth();

    const savedThemeMode = localStorage.getItem('theme_mode') || 'system';
    applyThemeMode(savedThemeMode);
});

// ==========================================
// AUTH & SETTINGS
// ==========================================
function checkAuth() {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (token) { localStorage.setItem('anilist_token', token); accessToken = token; window.history.replaceState(null, null, window.location.pathname); }
    if (accessToken) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        if(window.innerWidth > 768) {
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('main-arrows').style.display = 'flex';
        } else {
            document.getElementById('mobile-bottom-nav').style.display = 'flex';
        }
        document.getElementById('top-right-nav').style.display = 'block';
        const firstNav = navItems[0];
        if(firstNav) topNav.style.transform = `translateX(-${firstNav.offsetLeft}px)`;
        loadUserData();
    }
}
function login() { window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${CLIENT_ID}&response_type=token`; }
function guestMode() {
    isGuest = true;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    if(window.innerWidth > 768) {
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('main-arrows').style.display = 'flex';
    } else {
        document.getElementById('mobile-bottom-nav').style.display = 'flex';
    }
    const firstNav = navItems[0];
    if(firstNav) topNav.style.transform = `translateX(-${firstNav.offsetLeft}px)`;
    document.getElementById('user-page-name').innerText = 'guest';
    document.getElementById('start-tile-user').innerText = 'guest';
    document.getElementById('notif-list').innerHTML = '<div style="color:var(--text-dim);">sign in to see notifications.</div>';
    loadPublicCommunityFeed();
    loadTrending();
}
function logout() { localStorage.removeItem('anilist_token'); location.reload(); }

function openSettingsView(viewId) {
    document.getElementById('settings-main-list').style.display = 'none';
    document.getElementById('settings-subview-container').style.display = 'block';
    document.querySelectorAll('.settings-subview').forEach(v => v.classList.remove('active'));
    document.getElementById(`settings-tab-${viewId}`).classList.add('active');
}
function closeSettingsView() {
    document.getElementById('settings-subview-container').style.display = 'none';
    document.getElementById('settings-main-list').style.display = 'flex';
}

// ==========================================
// API
// ==========================================
async function fetchAPI(query, variables = {}) {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (accessToken && !isGuest) headers['Authorization'] = 'Bearer ' + accessToken;
    const res = await fetch('https://graphql.anilist.co', { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
    const json = await res.json();
    if (json.errors) { console.error(json.errors); throw new Error(json.errors[0].message); }
    return json.data;
}
function timeAgo(ts) {
    const h = Math.floor((Date.now() - ts * 1000) / 3600000), d = Math.floor(h / 24);
    if (h < 1) return 'just now'; if (h < 24) return h + 'h ago';
    if (d === 1) return 'yesterday'; if (d < 7) return d + 'd ago'; return d + ' days ago';
}
function showToast(msg) { const t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); }

// ==========================================
// USER DATA
// ==========================================
async function loadUserData() {
    if (isGuest) return;
    const q = `query { Viewer { id name avatar { large } statistics { anime { count episodesWatched minutesWatched meanScore } manga { count chaptersRead } } unreadNotificationCount } }`;
    try {
        const data = await fetchAPI(q);
        const v = data.Viewer; currentUserId = v.id;
        document.getElementById('user-page-name').innerText = v.name.toLowerCase();
        document.getElementById('start-tile-user').innerText = v.name.toLowerCase();
        document.getElementById('top-right-avatar').src = v.avatar.large;
        document.getElementById('user-page-avatar').src = v.avatar.large;
        document.getElementById('start-tile-avatar').src = v.avatar.large;
        document.getElementById('user-page-sub').innerText = `${v.statistics.anime.count} anime // ${v.statistics.manga.count} manga`;
        if (v.unreadNotificationCount > 0) {
            document.getElementById('notif-page-title').innerHTML = `inbox <span style="background:var(--accent); color:#fff; font-size:40px; padding:2px 10px; vertical-align:top;">${v.unreadNotificationCount}</span>`;
            document.getElementById('start-tile-notif').innerText = v.unreadNotificationCount;
        }
        loadLibrary('ANIME'); loadLibrary('MANGA');
        loadPublicCommunityFeed(); loadNotifications('unread'); loadTrending();
    } catch (err) { console.error(err); if (err.message.includes('Invalid token')) logout(); }
}

// ==========================================
// COMMUNITY FEED
// ==========================================
async function loadPublicCommunityFeed(append = false) {
    const el = document.getElementById('public-feed');
    if (!append) { el.innerHTML = '<div style="color:var(--text-dim);">loading...</div>'; communityPage = 1; }
    const q = `query($page: Int) { Page(page:$page,perPage:20) { pageInfo { hasNextPage } activities(isFollowing:false,sort:ID_DESC,type:MEDIA_LIST) { ... on ListActivity { status progress createdAt user { name avatar { large } } media { id type title { english romaji } coverImage { large } } } } } }`;
    try {
        const data = await fetchAPI(q, { page: communityPage });
        if (!append) el.innerHTML = '';
        const acts = data.Page.activities.filter(a => a.media && a.user);
        acts.forEach(act => {
            const title = act.media.title.english || act.media.title.romaji;
            let action = act.status || ''; if (act.progress) action += ' ' + act.progress + ' of';
            el.innerHTML += `<div class="prog-item">
                <img src="${act.user.avatar.large}" class="prog-avatar" onclick="openUserDetail('${act.user.name}')" onerror="this.onerror=null; this.src='https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png';"/>
                <div class="prog-info">
                    <div class="prog-user" onclick="openUserDetail('${act.user.name}')">${act.user.name.toLowerCase()}</div>
                    <div class="prog-status">${action.toLowerCase()} <span onclick="openDetailById(${act.media.id}, '${act.media.type}')">${title.toLowerCase()}</span></div>
                    <div class="prog-time">${timeAgo(act.createdAt)}</div>
                </div>
                <img src="${act.media.coverImage.large}" class="prog-thumb" style="width:42px;height:56px;" onclick="openDetailById(${act.media.id}, '${act.media.type}')"/>
            </div>`;
        });
        let btn = document.getElementById('load-more-community'); if (btn) btn.remove();
        if (data.Page.pageInfo.hasNextPage) el.innerHTML += `<button class="load-more-btn" id="load-more-community" onclick="loadMoreCommunity()">load more...</button>`;
    } catch(e) { if(!append) el.innerHTML = '<div style="color:var(--text-dim);">could not load.</div>'; }
}
function loadMoreCommunity() { communityPage++; loadPublicCommunityFeed(true); }

// ==========================================
// TRENDING & CURRENTLY WATCHING
// ==========================================
async function loadTrending() {
    const tq = `query { Page(page:1,perPage:12) { media(sort:TRENDING_DESC,type:ANIME,status:RELEASING) { id title { english romaji } coverImage { large } description(asHtml:false) averageScore } } }`;
    const tRow = document.getElementById('trending-row');
    try {
        const data = await fetchAPI(tq); tRow.innerHTML = '';
        data.Page.media.forEach((m, i) => {
            const title = m.title.english || m.title.romaji;
            const desc = (m.description || 'no description.').replace(/<[^>]+>/g,'').substring(0, 100) + '...';
            const score = m.averageScore ? `${m.averageScore}%` : 'n/a';
            tRow.innerHTML += `
            <div class="trending-tile tile flip-tile" onclick="openDetailById(${m.id},'ANIME')">
                <div class="flip-tile-inner">
                    <div class="flip-tile-front">
                        <img src="${m.coverImage.large}" loading="lazy"/>
                        <div class="trending-rank">#${i+1}</div>
                        <div class="tile-label">${title.toLowerCase()}</div>
                    </div>
                    <div class="flip-tile-back">
                        <div class="tile-back-title">${title.substring(0, 20).toLowerCase()}...</div>
                        <div style="font-size:10px; color:rgba(255,255,255,0.7); line-height:1.4;">${desc.toLowerCase()}</div>
                        <div style="margin-top:auto; font-size:16px; font-weight:400;"><i class="fa-solid fa-star"></i> ${score}</div>
                    </div>
                </div>
            </div>`;
        });
    } catch(e) { tRow.innerHTML = '<div style="color:var(--text-dim);">could not load.</div>'; }

    const wRow = document.getElementById('watching-row');
    if (isGuest || !currentUserId) { wRow.innerHTML = '<div style="color:var(--text-dim);">log in to see watching.</div>'; return; }
    const wq = `query ($userId:Int) { MediaListCollection(userId:$userId,type:ANIME,status:CURRENT) { lists { entries { media { id title { english romaji } coverImage { large } episodes } progress score(format:POINT_10) } } } }`;
    try {
        const wdata = await fetchAPI(wq, { userId: currentUserId }); wRow.innerHTML = '';
        const entries = wdata.MediaListCollection.lists[0]?.entries || [];
        if(!entries.length) { wRow.innerHTML = '<div style="color:var(--text-dim);">not watching anything.</div>'; return; }
        entries.forEach(e => {
            const title = e.media.title.english || e.media.title.romaji;
            const prog = `ep ${e.progress} / ${e.media.episodes || '?'}`;
            wRow.innerHTML += `
            <div class="trending-tile tile flip-tile" onclick="openDetailById(${e.media.id},'ANIME')">
                <div class="flip-tile-inner">
                    <div class="flip-tile-front">
                        <img src="${e.media.coverImage.large}" loading="lazy"/>
                        <div class="tile-badge">${prog}</div>
                        <div class="tile-label">${title.toLowerCase()}</div>
                    </div>
                    <div class="flip-tile-back">
                        <div class="tile-back-title">${title.substring(0, 20).toLowerCase()}</div>
                        <div style="font-size:10px; color:rgba(255,255,255,0.7);">progress: ${prog}</div>
                        <div style="margin-top:auto; font-size:16px;"><i class="fa-solid fa-star"></i> ${e.score || 'n/a'}</div>
                    </div>
                </div>
            </div>`;
        });
    } catch(e) { wRow.innerHTML = '<div style="color:var(--text-dim);">could not load.</div>'; }
}

// ==========================================
// LIBRARY
// ==========================================
async function loadLibrary(mediaType) {
    if (isGuest) return;
    const q = `query ($userId:Int,$type:MediaType) { MediaListCollection(userId:$userId,type:$type) { lists { status entries { score(format:POINT_10) progress media { id type title { english romaji } coverImage { large } episodes chapters status } } } } }`;
    const data = await fetchAPI(q, { userId: currentUserId, type: mediaType });
    allListsData[mediaType] = {};
    data.MediaListCollection.lists.forEach(list => { allListsData[mediaType][list.status] = list.entries; });
    if (mediaType === 'ANIME') renderLibrary('CURRENT');
}

function renderLibrary(status, append = false) {
    if (isGuest) { document.getElementById('library-grid').innerHTML = '<div style="color:var(--text-dim);">sign in to access library.</div>'; return; }
    const el = document.getElementById('library-grid');
    if (!append) { el.innerHTML = ''; currentLibraryPage = 1; }
    const entries = (allListsData[currentMediaType] || {})[status] || [];
    document.querySelector('#library-pivots .pivot-item[data-status="CURRENT"]').innerText = currentMediaType === 'ANIME' ? 'watching' : 'reading';
    if (!entries.length && !append) { el.innerHTML = '<div style="color:var(--text-dim);">no entries found.</div>'; return; }
    const chunk = entries.slice((currentLibraryPage - 1) * libraryItemsPerPage, currentLibraryPage * libraryItemsPerPage);
    const existingBtn = document.getElementById('load-more-lib-btn'); if (existingBtn) existingBtn.remove();
    chunk.forEach(entry => {
        const title = entry.media.title.english || entry.media.title.romaji;
        const total = currentMediaType === 'ANIME' ? entry.media.episodes : entry.media.chapters;
        const progressStr = `progress: ${entry.progress} / ${total || '?'}`;
        const badge = status === 'CURRENT' ? (entry.progress + (total ? '/'+total : '')) : '';
        el.innerHTML += createFlipTile(entry.media.id, currentMediaType, entry.media.coverImage.large, title, title, entry.score, badge, progressStr);
    });
    if (entries.length > currentLibraryPage * libraryItemsPerPage) {
        el.innerHTML += `<button class="load-more-btn" id="load-more-lib-btn" onclick="loadMoreLibrary()" style="grid-column: 1 / -1;">load more...</button>`;
    }
}
function loadMoreLibrary() { currentLibraryPage++; renderLibrary(currentLibStatus, true); }

function switchMediaType(type, btn) {
    currentMediaType = type;
    document.querySelectorAll('.mts-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLibStatus = 'CURRENT';
    document.querySelectorAll('#library-pivots .pivot-item').forEach((p, i) => p.classList.toggle('active', i === 0));
    renderLibrary('CURRENT');
}

// ==========================================
// SEARCH
// ==========================================
let searchTimeout = null;
async function doSearch(term) {
    const el = document.getElementById('search-results'); el.innerHTML = '<div style="color:var(--text-dim);">searching...</div>';
    const q = `query ($search:String,$type:MediaType,$sort:[MediaSort]) { Page(page:1,perPage:20) { media(search:$search,type:$type,sort:$sort) { id title { english romaji } coverImage { large } status averageScore } } }`;
    const data = await fetchAPI(q, { search: term, type: searchType, sort: ['SEARCH_MATCH'] });
    renderSearchResults(data.Page.media);
}
async function doSortedBrowse() {
    const el = document.getElementById('search-results'); el.innerHTML = '<div style="color:var(--text-dim);">loading...</div>';
    const q = `query ($type:MediaType,$sort:[MediaSort]) { Page(page:1,perPage:24) { media(type:$type,sort:$sort) { id title { english romaji } coverImage { large } status averageScore } } }`;
    const data = await fetchAPI(q, { type: searchType, sort: [searchSort] });
    renderSearchResults(data.Page.media);
}
function renderSearchResults(media) {
    const el = document.getElementById('search-results'); el.innerHTML = '';
    if (!media.length) { el.innerHTML = '<div style="color:var(--text-dim);">no results.</div>'; return; }
    media.forEach(m => {
        const title = m.title.english || m.title.romaji;
        const score = m.averageScore ? (m.averageScore/10).toFixed(1) : '';
        el.innerHTML += createFlipTile(m.id, searchType, m.coverImage.large, title, title, score, (m.status||'').toLowerCase(), null);
    });
}
function setSearchType(type, el) {
    searchType = type; document.querySelectorAll('.filter-chip[data-type]').forEach(c => c.classList.remove('active')); el.classList.add('active');
    const term = document.getElementById('search-input').value.trim();
    if (term.length >= 2) doSearch(term); else if (searchSort) doSortedBrowse();
}
function setSort(sort, el) {
    searchSort = sort; document.querySelectorAll('.filter-chip[data-sort]').forEach(c => c.classList.remove('active')); el.classList.add('active');
    doSortedBrowse();
}

// ==========================================
// INBOX / NOTIFICATIONS
// ==========================================
function switchInboxCategory(cat, el) {
    document.querySelectorAll('.pivot-headers .pivot-item').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    inboxMode = cat;
    loadNotifications(cat, false);
}
    loadNotifications(cat, false);
}

async function loadNotifications(mode, append = false) {
    if (isGuest) return;
    const el = document.getElementById('notif-list');
    if (!append) { el.innerHTML = '<div style="color:var(--text-dim);">loading...</div>'; notifPage = 1; }
    const resetCount = mode === 'unread';
    const q = `query ($page: Int, $reset: Boolean) { Page(page:$page,perPage:25) { pageInfo { hasNextPage } notifications(resetNotificationCount:$reset) {
        ... on AiringNotification { type episode createdAt media { id type title { english romaji } coverImage { large } } }
        ... on FollowingNotification { type createdAt user { name avatar { large } } }
        ... on ActivityLikeNotification { type createdAt user { name avatar { large } } }
        ... on ActivityMentionNotification { type createdAt user { name avatar { large } } }
        ... on ActivityReplyNotification { type createdAt user { name avatar { large } } }
        ... on RelatedMediaAdditionNotification { type createdAt media { id type title { english romaji } coverImage { large } } }
    } } }`;
    try {
        const data = await fetchAPI(q, { page: notifPage, reset: resetCount });
        if (!append) el.innerHTML = '';
        if (!append && !data.Page.notifications.length) { el.innerHTML = '<div style="color:var(--text-dim);">no notifications.</div>'; return; }
        data.Page.notifications.forEach(n => {
            let sender = 'anilist system', preview = '', action = '', avatar = 'https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png';
            const time = timeAgo(n.createdAt);
            if (n.type === 'AIRING') {
                sender = 'new episode'; avatar = n.media.coverImage.large;
                const t = n.media.title.english || n.media.title.romaji;
                preview = `episode ${n.episode} of ${t.toLowerCase()} aired.`;
                action = `onclick="openDetailById(${n.media.id}, '${n.media.type}')"`;
            } else if (n.type === 'FOLLOWING') {
                sender = n.user?.name.toLowerCase() || 'someone'; avatar = n.user?.avatar?.large || avatar;
                preview = 'started following you.'; action = `onclick="openUserDetail('${n.user.name}')"`;
            } else if (n.type === 'ACTIVITY_LIKE') {
                sender = n.user?.name.toLowerCase() || 'someone'; avatar = n.user?.avatar?.large || avatar;
                preview = 'liked your activity.'; action = `onclick="openUserDetail('${n.user.name}')"`;
            } else if (n.type === 'ACTIVITY_MENTION' || n.type === 'ACTIVITY_REPLY') {
                sender = n.user?.name.toLowerCase() || 'someone'; avatar = n.user?.avatar?.large || avatar;
                preview = n.type === 'ACTIVITY_MENTION' ? 'mentioned you.' : 'replied to your activity.';
                action = `onclick="openUserDetail('${n.user.name}')"`;
            } else if (n.type === 'RELATED_MEDIA_ADDITION') {
                sender = 'new media added'; avatar = n.media?.coverImage?.large || avatar;
                const t = n.media?.title.english||n.media?.title.romaji||'media';
                preview = `related media: ${t.toLowerCase()}`; action = `onclick="openDetailById(${n.media.id}, '${n.media.type}')"`;
            } else { preview = n.type.replace(/_/g,' ').toLowerCase(); }
            el.innerHTML += `
            <div class="inbox-item" ${action}>
                <div class="inbox-avatar"><img src="${avatar}" onerror="this.onerror=null; this.src='https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png';"></div>
                <div class="inbox-content">
                    <div class="inbox-sender">${sender}</div>
                    <div class="inbox-preview">${preview}</div>
                </div>
                <div class="inbox-time">${time}</div>
            </div>`;
        });
        let btn = document.getElementById('load-more-notif-btn'); if (btn) btn.remove();
        if (data.Page.pageInfo.hasNextPage) el.innerHTML += `<button class="load-more-btn" id="load-more-notif-btn" onclick="loadMoreNotifications()">load more...</button>`;
    } catch(e) { console.error(e); }
}
function loadMoreNotifications() { notifPage++; loadNotifications(inboxMode, true); }

// ==========================================
// DETAIL PANEL: USER & ANIME
// ==========================================
function closeDetail() {
    document.getElementById('detail-panel').style.display = 'none';
    document.getElementById('main-nav').classList.remove('ui-hidden');
    document.getElementById('top-right-nav').classList.remove('ui-hidden');
}

async function openUserDetail(name) {
    document.getElementById('main-nav').classList.add('ui-hidden');
    document.getElementById('top-right-nav').classList.add('ui-hidden');
    const panel = document.getElementById('detail-panel'), content = document.getElementById('detail-content');
    content.innerHTML = '<div style="color:var(--text-dim); margin-top:20px;">loading user...</div>'; panel.style.display = 'block';
    const q = `query ($name: String) {
        User(name: $name) {
            id name about(asHtml: false) avatar { large } bannerImage
            statistics { anime { count episodesWatched minutesWatched meanScore } manga { count chaptersRead } }
            favourites {
                anime(page: 1, perPage: 12) { nodes { id type coverImage { large } } }
                manga(page: 1, perPage: 12) { nodes { id type title { english romaji } coverImage { large } } }
            }
        }
    }`;
    try {
        const data = await fetchAPI(q, { name }); const u = data.User;
        const score = u.statistics.anime.meanScore ? u.statistics.anime.meanScore.toFixed(1) : '0';
        let heatmapDots = '';
        for(let i=0; i<80; i++) heatmapDots += `<div class="heat-dot ${Math.random() > 0.7 ? 'active' : ''}"></div>`;
        let animeFavs = u.favourites.anime.nodes.map(a => `<img src="${a.coverImage.large}" class="anime-poster" onclick="openDetailById(${a.id},'${a.type}')">`).join('');
        if (!animeFavs) animeFavs = '<div style="color:var(--text-dim); font-size:14px; grid-column: 1/-1;">no favorite anime found.</div>';
        let mangaFavs = u.favourites.manga.nodes.map(m => `<img src="${m.coverImage.large}" class="anime-poster" onclick="openDetailById(${m.id},'${m.type}')">`).join('');
        if (!mangaFavs) mangaFavs = '<div style="color:var(--text-dim); font-size:14px; grid-column: 1/-1;">no favorite manga found.</div>';
        const actQ = `query($userId: Int) { Page(page:1, perPage:10) { activities(userId:$userId, type:MEDIA_LIST, sort:ID_DESC) { ... on ListActivity { id status progress createdAt media { id type title { english romaji } coverImage { large } } } } } }`;
        const actData = await fetchAPI(actQ, { userId: u.id });
        const acts = actData?.Page?.activities || [];
        let activitiesHtml = acts.map(a => `
            <div class="prog-item" style="margin-bottom:5px;">
                <img src="${a.media.coverImage.large}" style="width:40px; height:55px; object-fit:cover; cursor:pointer;" onclick="openDetailById(${a.media.id},'${a.media.type}')">
                <div>
                    <div style="font-size:14px; color:var(--text-dim);">${a.status} ${a.progress || ''}</div>
                    <div style="font-size:16px; color:var(--text); cursor:pointer;" onclick="openDetailById(${a.media.id},'${a.media.type}')">${(a.media.title.english || a.media.title.romaji).toLowerCase()}</div>
                </div>
            </div>`).join('');
        if(!activitiesHtml) activitiesHtml = '<div style="color:var(--text-dim);">no recent activity.</div>';

        content.innerHTML = `
            <div style="position:relative; height:250px; background: url('${u.bannerImage || ''}') center/cover; display:flex; align-items:flex-end; padding:20px; gap:20px; border-bottom: 4px solid var(--accent); margin-bottom:40px; margin-top:50px;">
                <div style="position:absolute; inset:0; background:linear-gradient(to top, var(--bg), transparent);"></div>
                <img src="${u.avatar.large}" onerror="this.onerror=null; this.src='https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png';" style="width:120px; height:120px; border:4px solid var(--bg); position:relative; z-index:1;" />
                <div style="position:relative; z-index:1; padding-bottom:5px;">
                    <div style="font-size: 4rem; font-weight:100; color:var(--accent); margin-bottom:10px; line-height:0.8; letter-spacing:-2px;">${u.name.toLowerCase()}</div>
                    <div style="display:flex; gap:15px; margin-top:20px;">
                        <div><div style="font-size:32px; font-weight:300;">${u.statistics.anime.count}</div><div style="font-size:14px; color:var(--text-dim);">total anime</div></div>
                        <div><div style="font-size:32px; font-weight:300;">${(u.statistics.anime.minutesWatched / 1440).toFixed(1)}</div><div style="font-size:14px; color:var(--text-dim);">days watched</div></div>
                        <div><div style="font-size:32px; font-weight:300;">${score}</div><div style="font-size:14px; color:var(--text-dim);">mean score</div></div>
                    </div>
                </div>
            </div>
            <div class="grid-layout">
                <div class="panel">
                    <h3 style="margin-bottom:15px; color:var(--accent); font-weight:200;">activity history</h3>
                    <div class="heatmap" style="margin-bottom:20px;">${heatmapDots}</div>
                    ${activitiesHtml}
                </div>
                <div class="panel">
                    <h3 style="font-weight:200; color:var(--accent); margin-bottom:15px;">favorite anime</h3>
                    <div class="anime-grid-mini">${animeFavs}</div>
                </div>
                <div class="panel" style="grid-column: 1 / -1;">
                    <h3 style="font-weight:200; color:var(--accent); margin-bottom:15px;">favorite manga</h3>
                    <div class="anime-grid-mini">${mangaFavs}</div>
                </div>
            </div>`;
    } catch(e) { content.innerHTML = '<div style="color:var(--text-dim);">error loading user.</div>'; console.error(e); }
}

async function openDetailById(id, type) {
    document.getElementById('main-nav').classList.add('ui-hidden');
    document.getElementById('top-right-nav').classList.add('ui-hidden');
    const panel = document.getElementById('detail-panel'), content = document.getElementById('detail-content');
    content.innerHTML = '<div style="color:var(--text-dim); margin-top:20px;">loading...</div>'; panel.style.display = 'block';
    const q = `query ($id:Int) {
        Media(id:$id) {
            id title { english romaji } coverImage { extraLarge large } bannerImage description(asHtml:false) format status episodes chapters averageScore isAdult genres startDate { year }
            trailer { id site thumbnail }
            mediaListEntry { status }
            relations { edges { relationType(version:2) node { id title { english romaji } type coverImage { large } } } }
            characters(sort: [ROLE, RELEVANCE, ID], perPage: 16) {
                pageInfo { total }
                edges { role node { id name { full } image { large } } voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) { id name { full } image { large } } }
            }
            staff(sort: [RELEVANCE, ID], perPage: 16) {
                pageInfo { total }
                edges { role node { id name { full } image { large } } }
            }
            reviews(page: 1, perPage: 10, sort: [RATING_DESC, ID]) {
                pageInfo { total }
                nodes { id summary rating score user { name avatar { large } } }
            }
        }
    }`;
    try {
        const data = await fetchAPI(q, { id }); const m = data.Media;
        currentMediaCache = m;
        const title = m.title.english || m.title.romaji;
        const year = m.startDate?.year || '';
        const genresHtml = (m.genres || []).map(g => `<span class="zune-tag">${g.toLowerCase()}</span>`).join('');

        let trailerTileHtml = '';
        if (m.trailer && m.trailer.site === 'youtube') {
            const thumb = m.trailer.thumbnail || `https://img.youtube.com/vi/${m.trailer.id}/maxresdefault.jpg`;
            trailerTileHtml = `
                <div class="metro-tile large" id="trailer-tile" onclick="playVideo('${m.trailer.id}')">
                    <div class="tile-bg" style="background-image: url('${thumb}'); position:absolute; top:0; left:0; width:100%; height:100%; background-size:cover; opacity:0.4;"></div>
                    <div class="tile-gradient"></div>
                    <div class="metro-tile-title" style="color:#fff; position:relative; z-index:2;"><i class="fa-solid fa-play"></i> play trailer</div>
                    <div class="metro-tile-subtitle" style="color:rgba(255,255,255,0.8); position:relative; z-index:2;">click to play inline</div>
                </div>`;
        }

        let relationsHtml = '';
        if (m.relations?.edges?.length) {
            relationsHtml = m.relations.edges.slice(0, 4).map(r => {
                const rt = r.node.title.english || r.node.title.romaji;
                return `<div class="metro-tile" style="background: var(--surface);" onclick="openDetailById(${r.node.id},'${r.node.type}')">
                    <div class="tile-bg" style="background-image: url('${r.node.coverImage.large}'); position:absolute; top:0; left:0; width:100%; height:100%; background-size:cover; opacity:0.3;"></div>
                    <div class="metro-tile-title" style="font-size:16px; position:relative; z-index:2;">${rt.toLowerCase()}</div>
                    <div class="metro-tile-subtitle" style="position:relative; z-index:2;">${r.relationType.replace(/_/g,' ').toLowerCase()}</div>
                </div>`;
            }).join('');
        }

        let entryStatus = m.mediaListEntry?.status || '';
        const listManagementHtml = !isGuest ? `
            <div class="list-management-box">
                <div class="list-management-label">list status</div>
                <div class="status-grid">
                    <div class="status-btn ${entryStatus==='CURRENT'?'active':''}" onclick="addToList(${m.id},'${type}','CURRENT')">${type==='ANIME'?'watching':'reading'}</div>
                    <div class="status-btn ${entryStatus==='PLANNING'?'active':''}" onclick="addToList(${m.id},'${type}','PLANNING')">planning</div>
                    <div class="status-btn ${entryStatus==='COMPLETED'?'active':''}" onclick="addToList(${m.id},'${type}','COMPLETED')">completed</div>
                    <div class="status-btn ${entryStatus==='PAUSED'?'active':''}" onclick="addToList(${m.id},'${type}','PAUSED')">paused</div>
                    <div class="status-btn full ${entryStatus==='DROPPED'?'active':''}" onclick="addToList(${m.id},'${type}','DROPPED')">dropped</div>
                </div>
            </div>` : '';

        content.innerHTML = `
            ${m.bannerImage ? `<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:url('${m.bannerImage}') center/cover; opacity:0.08; filter:blur(20px); z-index:-1;"></div>` : ''}
            <div style="display:flex; flex-wrap:wrap; gap:30px; margin-top:50px;">
                <div style="flex: 0 0 300px;">
                    <img src="${m.coverImage.extraLarge}" style="width:100%; border:4px solid var(--surface-hover);">
                    ${listManagementHtml}
                </div>
                <div style="flex:1; min-width:300px;">
                    <div style="font-size:4rem; font-weight:100; color:var(--accent); margin-bottom:10px; white-space:normal; line-height:0.9; letter-spacing:-2px;">${title.toLowerCase()}</div>
                    <div style="font-size:24px; color:var(--text-dim); margin-bottom:20px;">
                        ${year} // ${(m.format||'tv').toLowerCase()} // ${(m.status||'releasing').replace(/_/g,' ').toLowerCase()} // eps: ${m.episodes||'?'} // score: ${m.averageScore ? m.averageScore+'%' : 'n/a'}
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
                        ${genresHtml}
                        ${m.isAdult ? `<span class="zune-tag" style="border-color:var(--accent-red); color:var(--accent-red);">18+</span>` : ''}
                    </div>
                    <p style="font-size:20px; font-weight:300; line-height:1.6; color:var(--text-main); margin-bottom:40px; max-width:900px;">${m.description || 'no description available.'}</p>

                    <h2 style="font-weight:200; color:var(--text-main); margin-bottom:15px; font-size:36px;">explore</h2>
                    <div class="metro-hub" id="metro-hub-main">
                        ${trailerTileHtml}
                        <div class="metro-tile" style="background:var(--surface);" onclick="showSubview('characters')">
                            <div class="metro-tile-title"><i class="fa-solid fa-users"></i> characters</div>
                            <div class="metro-tile-subtitle">${m.characters?.pageInfo?.total || 0} listed</div>
                        </div>
                        <div class="metro-tile" style="background:var(--surface);" onclick="showSubview('staff')">
                            <div class="metro-tile-title"><i class="fa-solid fa-pen-nib"></i> staff & cast</div>
                            <div class="metro-tile-subtitle">${m.staff?.pageInfo?.total || 0} members</div>
                        </div>
                        <div class="metro-tile wide" style="background:var(--surface);" onclick="showSubview('reviews')">
                            <div class="metro-tile-title"><i class="fa-solid fa-star"></i> reviews</div>
                            <div class="metro-tile-subtitle">${m.reviews?.pageInfo?.total || 0} community reviews</div>
                        </div>
                        ${relationsHtml}
                    </div>
                    <div class="metro-subview" id="subview-panel"></div>
                </div>
            </div>`;
    } catch(e) { content.innerHTML = '<div style="color:var(--text-dim);">error loading detail panel.</div>'; console.error(e); }
}

// ==========================================
// SUBVIEWS (Characters, Staff, Reviews)
// ==========================================
function showSubview(type) {
    const main = document.getElementById('metro-hub-main');
    const sub = document.getElementById('subview-panel');
    const m = currentMediaCache;
    if(!main || !sub || !m) return;
    let contentHtml = '', title = '';
    const bannerImg = m.bannerImage || m.coverImage.extraLarge;
    const animeTitle = m.title.english || m.title.romaji;
    const bannerBase = `
        <div style="height:180px; background:url('${bannerImg}') center/cover; position:relative; margin:-20px -20px 20px -20px; display:flex; align-items:flex-end; padding:20px;">
            <div style="position:absolute; inset:0; background:linear-gradient(to top, var(--bg), transparent);"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:2rem; font-weight:300; line-height:1;">${animeTitle.toLowerCase()}</div>
                <div style="font-size:1.2rem; color:var(--accent); font-weight:300;">{SUBTITLE}</div>
            </div>
        </div>`;

    if (type === 'characters') {
        title = 'characters';
        let chars = m.characters.edges.map(c => {
            const va = c.voiceActors && c.voiceActors[0] ? c.voiceActors[0] : null;
            return `<div class="char-card">
                <img src="${c.node.image.large}" class="char-img">
                <div class="char-info">
                    <div class="char-name">${c.node.name.full.toLowerCase()}</div>
                    <div class="char-role">${c.role.toLowerCase()}</div>
                </div>
                ${va ? `<div class="char-info" style="text-align:right;">
                    <div class="char-name">${va.name.full.toLowerCase()}</div>
                    <div class="char-role">japanese</div>
                </div>
                <img src="${va.image.large}" class="char-img">` : ''}
            </div>`;
        }).join('');
        contentHtml = bannerBase.replace('{SUBTITLE}', 'characters') + `<div class="char-grid">${chars || '<div style="color:var(--text-dim);">no characters found.</div>'}</div>`;
    } else if (type === 'staff') {
        title = 'staff & cast';
        let staff = m.staff.edges.map(s => `<div class="char-card">
            <img src="${s.node.image.large}" class="char-img">
            <div class="char-info">
                <div class="char-name">${s.node.name.full.toLowerCase()}</div>
                <div class="char-role">${s.role.toLowerCase()}</div>
            </div>
        </div>`).join('');
        contentHtml = bannerBase.replace('{SUBTITLE}', 'staff & cast') + `<div class="char-grid">${staff || '<div style="color:var(--text-dim);">no staff found.</div>'}</div>`;
    } else if (type === 'reviews') {
        title = 'community reviews';
        let reviews = m.reviews.nodes.map(r => `
            <div class="review-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:var(--text-dim);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${r.user.avatar.large}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;" onerror="this.onerror=null; this.src='https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png';">
                        <span style="color:var(--text-main);">${r.user.name.toLowerCase()}</span>
                    </div>
                    <div style="font-size:28px; font-weight:200; color:var(--accent);">${r.score}/100</div>
                </div>
                <div style="font-size:14px; line-height:1.6; font-weight:300;">${r.summary.toLowerCase()}</div>
            </div>`).join('');
        contentHtml = bannerBase.replace('{SUBTITLE}', 'community reviews') + `<div>${reviews || '<div style="color:var(--text-dim);">no reviews found.</div>'}</div>`;
    }

    sub.innerHTML = `
        <div class="subview-header" style="padding-top:10px;">
            <button class="btn-back" onclick="hideSubview()"><i class="fa-solid fa-arrow-left"></i></button>
            <div class="subview-title">${title}</div>
        </div>
        ${contentHtml}`;
    main.classList.add('hidden');
    sub.classList.add('active');
}

function hideSubview() {
    const main = document.getElementById('metro-hub-main');
    const sub = document.getElementById('subview-panel');
    if(main && sub) { sub.classList.remove('active'); main.classList.remove('hidden'); }
}

function playVideo(youtubeId) {
    const tile = document.getElementById('trailer-tile');
    if(!tile) return;
    tile.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute; top:0; left:0; z-index:10;"></iframe>`;
    tile.style.padding = '0'; tile.style.border = 'none';
}

async function addToList(mediaId, type, status) {
    const q = `mutation ($mediaId:Int,$status:MediaListStatus) { SaveMediaListEntry(mediaId:$mediaId,status:$status) { id status } }`;
    try {
        await fetchAPI(q, { mediaId, status });
        showToast('saved: ' + status.toLowerCase());
        loadLibrary(type);
        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        const btnMap = { 'CURRENT': 0, 'PLANNING': 1, 'COMPLETED': 2, 'PAUSED': 3, 'DROPPED': 4 };
        const idx = btnMap[status];
        if(idx !== undefined) document.querySelectorAll('.status-btn')[idx].classList.add('active');
    } catch(e) { showToast('error saving list entry'); console.error(e); }
}
