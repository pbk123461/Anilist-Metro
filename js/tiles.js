/* Start-screen tile size and optional-tile persistence helpers. */
(() => {
    const sizeKey = 'metro_tile_sizes';
    const optionalKey = 'metro_optional_tiles';
    const visibilityKey = 'metro_tile_visibility';
    const defaultTiles = {
        profile: { className: 'wide profile-tile', color: 'var(--surface)', icon: 'fa-user', label: 'guest', action: 'scrollToSection(1)' },
        library: { className: 'medium', color: '#60a917', icon: 'fa-book-open', label: 'library', action: 'scrollToSection(2)' },
        discover: { className: 'medium', color: '#f39c12', icon: 'fa-magnifying-glass', label: 'discover', action: 'scrollToSection(4)' },
        inbox: { className: 'medium', color: '#d80073', icon: 'fa-envelope', label: 'inbox', action: 'scrollToSection(6)' },
        community: { className: 'wide', color: '#a20025', icon: 'fa-users', label: 'community', action: 'scrollToSection(3)' }
    };
    const defaultOrder = Object.keys(defaultTiles);
    const optionalTiles = {
        airing: { className: 'medium', color: '#e3a21a', icon: 'fa-calendar-days', label: 'airing today', action: "scrollToSection(5)" },
        watching: { className: 'medium', color: '#008287', icon: 'fa-play', label: 'currently watching', action: "scrollToSection(2)" },
        'quick-search': { className: 'medium', color: '#76608a', icon: 'fa-magnifying-glass', label: 'quick search', action: "scrollToSection(4); document.querySelector('.quick-search-input')?.focus()" },
        random: { className: 'medium', color: '#fa6800', icon: 'fa-shuffle', label: 'random anime', action: 'openRandomAnime()' },
        unread: { className: 'medium', color: '#d80073', icon: 'fa-envelope', label: 'unread notifications', action: 'scrollToSection(6)' }
    };
    const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
    const grid = () => document.querySelector('.start-screen-grid');
    const isEditing = () => grid()?.classList.contains('reordering') === true;
    const setOptionState = (name, enabled) => {
        const option = document.querySelector(`.start-tile-option[data-tile-option="${CSS.escape(name)}"]`);
        if (!option) return;
        option.classList.toggle('is-added', enabled);
        option.setAttribute('aria-pressed', String(enabled));
        const definition = optionalTiles[name] || defaultTiles[name];
        if (definition) option.querySelector('span').textContent = enabled ? `remove ${definition.label}` : `add ${definition.label}`;
    };
    const renderSizeControl = name => {
        const option = document.querySelector(`.start-tile-option[data-tile-option="${CSS.escape(name)}"]`);
        if (!option || option.querySelector('.start-tile-size-select')) return;
        const select = document.createElement('select');
        select.className = 'start-tile-size-select';
        select.setAttribute('aria-label', `${name} tile size`);
        select.innerHTML = '<option value="small">small</option><option value="medium">normal</option><option value="wide">wide</option><option value="large">large</option>';
        select.addEventListener('click', event => event.stopPropagation());
        select.addEventListener('change', event => {
            event.stopPropagation();
            window.setStartTileSize(name, event.target.value);
        });
        option.appendChild(select);
    };
    const renderSizeControls = () => [...Object.keys(defaultTiles), ...Object.keys(optionalTiles)].forEach(renderSizeControl);
    const createTile = name => {
        const definition = optionalTiles[name] || defaultTiles[name];
        if (!definition || document.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`)) return;
        const tile = document.createElement('div');
        tile.className = `metro-tile-start tile ${definition.className}`;
        tile.dataset.liveTile = name;
        if (defaultTiles[name]) tile.dataset.tileDefault = 'true';
        tile.dataset.role = 'live-tile';
        tile.dataset.effect = 'slideUp';
        tile.dataset.period = '7200';
        tile.style.backgroundColor = definition.color;
        tile.setAttribute('draggable', String(isEditing()));
        tile.setAttribute('onclick', definition.action);
        tile.innerHTML = `<i class="fa-solid ${definition.icon} start-icon"></i><span class="start-title">${definition.label}</span>`;
        grid()?.appendChild(tile);
        window.initLiveTile?.(tile);
        window.initStartTileReorder?.();
    };
    const removeTile = name => document.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`)?.remove();
    window.setStartTileSize = (name, size) => {
        if (!['small','medium','wide','large'].includes(size)) return;
        const tile = document.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`);
        const values = read(sizeKey); values[name] = size; localStorage.setItem(sizeKey, JSON.stringify(values));
        if (tile) {
            tile.classList.remove('small','medium','wide','large'); tile.classList.add(size);
        }
        const select = document.querySelector(`.start-tile-option[data-tile-option="${CSS.escape(name)}"] .start-tile-size-select`);
        if (select) select.value = size;
    };
    window.setOptionalStartTile = (name, enabled) => {
        if (!optionalTiles[name]) return;
        if (enabled) createTile(name); else removeTile(name);
        const values = read(optionalKey); values[name] = !!enabled; localStorage.setItem(optionalKey, JSON.stringify(values));
        setOptionState(name, !!enabled);
        window.applyStartTilePreferences?.();
    };
    window.toggleStartTile = name => {
        if (!isEditing() || !defaultTiles[name]) return;
        const enabled = !document.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`);
        const values = read(visibilityKey);
        values[name] = enabled;
        localStorage.setItem(visibilityKey, JSON.stringify(values));
        if (enabled) createTile(name); else removeTile(name);
        setOptionState(name, enabled);
    };
    window.restoreDefaultTiles = () => {
        if (!isEditing()) return;
        localStorage.removeItem(sizeKey);
        localStorage.removeItem(optionalKey);
        localStorage.removeItem(visibilityKey);
        localStorage.removeItem('metro_start_tile_order');
        Object.keys(optionalTiles).forEach(removeTile);
        defaultOrder.forEach(name => {
            createTile(name);
            const tile = document.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`);
            const definition = defaultTiles[name];
            if (tile) {
                tile.classList.remove('small', 'medium', 'wide', 'large');
                tile.classList.add(...definition.className.split(' '));
                tile.dataset.reordered = '';
            }
        });
        const startGrid = grid();
        if (startGrid) {
            defaultOrder.forEach(name => {
                const tile = startGrid.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`);
                if (tile) startGrid.appendChild(tile);
            });
        }
        window.applyStartTilePreferences?.();
        renderSizeControls();
    };
    window.applyStartTilePreferences = () => {
        const sizes = read(sizeKey), optional = read(optionalKey), visibility = read(visibilityKey);
        renderSizeControls();
        document.querySelectorAll('.metro-tile-start[data-live-tile]').forEach(tile => {
            const name = tile.dataset.liveTile;
            if (sizes[name]) window.setStartTileSize(name, sizes[name]);
        });
        Object.keys(defaultTiles).forEach(name => {
            const enabled = visibility[name] !== false;
            if (enabled) createTile(name); else removeTile(name);
            setOptionState(name, enabled);
        });
        Object.keys(optionalTiles).forEach(name => {
            const enabled = optional[name] === true;
            if (enabled) createTile(name); else removeTile(name);
            setOptionState(name, enabled);
        });
    };
    window.toggleOptionalTile = name => {
        if (!isEditing()) return;
        const enabled = !document.querySelector(`.metro-tile-start[data-live-tile="${CSS.escape(name)}"]`);
        window.setOptionalStartTile(name, enabled);
    };
    window.toggleTileEditMode = () => {
        const tileGrid = grid();
        const button = document.getElementById('start-tile-edit-btn');
        const help = document.getElementById('start-tile-edit-help');
        const editor = document.getElementById('start-tile-editor');
        if (!tileGrid) return;
        tileGrid.classList.toggle('reordering');
        const editing = tileGrid.classList.contains('reordering');
        tileGrid.querySelectorAll('.metro-tile-start').forEach(tile => {
            tile.setAttribute('draggable', String(editing));
        });
        if (help) help.style.opacity = editing ? '1' : '0';
        if (editor) {
            editor.classList.toggle('open', editing);
            editor.setAttribute('aria-hidden', String(!editing));
        }
        if (button) {
            button.innerHTML = editing
                ? '<i class="fa-solid fa-check"></i> done editing'
                : '<i class="fa-solid fa-pen"></i> edit tiles';
        }
        renderSizeControls();
    };
    document.addEventListener('DOMContentLoaded', window.applyStartTilePreferences);
})();
