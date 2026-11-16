// Product rails: arrows scroll one card (RTL aware)
document.querySelectorAll('[data-rail]').forEach(rail => {
  const track = rail.querySelector('.rail__track');
  rail.querySelectorAll('.arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = track.querySelector('.card').getBoundingClientRect().width + 18;
      // In RTL, scrollLeft goes negative; "next" means further left.
      track.scrollBy({ left: -Number(btn.dataset.dir) * step, behavior: 'smooth' });
    });
  });
});

// Cart counter demo
const counter = document.querySelector('.cart__n');
document.querySelectorAll('.cart-btn').forEach(b => b.addEventListener('click', () => {
  counter.textContent = Number(counter.textContent) + 1;
}));
