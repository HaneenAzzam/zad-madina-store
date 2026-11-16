// Tabs: filter the featured products by category
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('[data-panel]');
const catLinks = document.querySelectorAll('.nav__a');
function showTab(id) {
  tabs.forEach(t => t.classList.toggle('is-on', t.dataset.tab === id));
  catLinks.forEach(t => t.classList.toggle('is-on', t.dataset.tab === id));
  panels.forEach(p => { p.hidden = p.dataset.panel !== id; });
}
tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
catLinks.forEach(c => c.addEventListener('click', () => showTab(c.dataset.tab)));
// Category circles open the matching tab (the page then scrolls to #featured)
document.querySelectorAll('.circle, .catcard, .cats2__all, .dbanner__btn').forEach(c => c.addEventListener('click', () => showTab(c.dataset.tab)));

// Cart counter demo
const counter = document.querySelector('.cart__n');
document.querySelectorAll('.cart-btn').forEach(b => b.addEventListener('click', () => {
  counter.textContent = Number(counter.textContent) + 1;
}));
