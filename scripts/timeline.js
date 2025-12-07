
// Assigns Left/Right to the Timeline Items
function updateTimelineLayout() {
    const items = Array.from(document.querySelectorAll(".timeline-item"))
        .filter(item => item.style.display !== "none"); // visible ones only
    items.forEach((item, index) => {
        item.classList.remove("left", "right");
        if (index % 2 === 0) {
            item.classList.add("left");
        } else {
            item.classList.add("right");
        }
    });
}
document.addEventListener("DOMContentLoaded", updateTimelineLayout);

// Filter
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

        updateTimelineLayout();
    });
});


const panel = document.getElementById("detailsPanel");

const titleEl = document.getElementById("detailsTitle");
const descEl = document.getElementById("detailsDescription");
const imgEl = document.getElementById("detailsImage");

items.forEach(item => {
    item.addEventListener("mouseenter", () => {
        const title = item.dataset.title;
        const html = item.dataset.descriptionHtml;
        const image = item.dataset.image;

        titleEl.textContent = title;
        descEl.innerHTML = html || "";

        if (image) {
            imgEl.src = image;
            imgEl.style.display = "block";
        } else {
            imgEl.style.display = "none";
        }

        panel.classList.add("visible");
    });

    item.addEventListener("mouseleave", () => {
        panel.classList.remove("visible");
    });
});
