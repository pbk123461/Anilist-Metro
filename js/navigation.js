/* Panorama navigation fixes shared by the split shell. */
(() => {
    const container = document.getElementById('app-container');
    if (!container) return;
    const sections = () => Array.from(container.querySelectorAll(':scope > .header-section'));
    const navItems = () => Array.from(document.querySelectorAll('.nav-item'));
    const mobileItems = () => Array.from(document.querySelectorAll('.mobile-nav-item'));
    const sync = () => {
        const list = sections();
        if (!list.length) return;
        const center = container.scrollLeft + container.clientWidth * 0.35;
        let index = 0;
        list.forEach((section, i) => { if (section.offsetLeft <= center) index = i; });
        navItems().forEach((item, i) => item.classList.toggle('active', i === index));
        mobileItems().forEach(item => item.classList.toggle('active', Number(item.dataset.section) === index));
        const active = navItems()[index];
        const topNav = document.getElementById('main-nav');
        if (active && topNav) topNav.style.transform = `translateX(-${active.offsetLeft}px)`;
    };
    window.forceStartNavigation = () => {
        container.scrollLeft = 0;
        sync();
    };
    container.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    container.addEventListener('scrollend', sync, { passive: true });

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    container.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button,a,input,select,.metro-tile-start,.pivot-item,.nav-item,.mobile-nav-item')) return;
        dragging = true; moved = false; startX = event.clientX; startScroll = container.scrollLeft;
        container.setPointerCapture?.(event.pointerId);
        container.style.scrollSnapType = 'none';
        container.style.cursor = 'grabbing';
    });
    container.addEventListener('pointermove', event => {
        if (!dragging) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 4) moved = true;
        container.scrollLeft = startScroll - delta;
    });
    const finish = event => {
        if (!dragging) return;
        dragging = false;
        container.releasePointerCapture?.(event.pointerId);
        container.style.cursor = '';
        container.style.scrollSnapType = 'x mandatory';
        if (moved && typeof window.getCurrentSectionIndex === 'function') {
            const index = Math.max(0, Math.min(sections().length - 1, Math.round(container.scrollLeft / Math.max(1, container.clientWidth))));
            window.scrollToSection(index);
        }
        sync();
    };
    container.addEventListener('pointerup', finish);
    container.addEventListener('pointercancel', finish);
    window.addEventListener('DOMContentLoaded', sync, { once: true });
    sync();
})();
