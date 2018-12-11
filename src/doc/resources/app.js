const header = document.querySelector('header');
const toggle = document.getElementById('menu-toggle');
const menu = document.getElementById('header-wrapper');
const body = document.querySelector('body');
let open = true;
toggle.addEventListener('click', ev => {
    open = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open === true ? 'close navigation' : 'open navigation';
    header.classList.toggle('hidden', !open);
    body.classList.toggle('full-screen', !open);
});
// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('service-worker.js');
// }

