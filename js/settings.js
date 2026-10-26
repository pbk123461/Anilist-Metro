/* Theme-independent icon color preference. */
(() => {
    const key = 'metro_icon_color';
    const apply = value => {
        const color = value === 'dark' ? '#000000' : '#ffffff';
        document.documentElement.style.setProperty('--icon-color', color);
        document.documentElement.dataset.iconColor = value;
        const select = document.getElementById('icon-color-select');
        if (select) select.value = value;
    };
    window.setIconColor = value => {
        const next = value === 'dark' ? 'dark' : 'white';
        localStorage.setItem(key, next); apply(next);
    };
    apply(localStorage.getItem(key) || 'white');
})();
