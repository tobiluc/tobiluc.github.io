const buttons = document.querySelectorAll('.timeline-filters button');
const items = document.querySelectorAll('.timeline-item');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        items.forEach(item => {
            item.style.display =
                filter === 'all' || item.dataset.category === filter
                ? 'block'
                : 'none';
        });
    });
});
