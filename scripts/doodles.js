const dir = "images/doodles/";
const doodles = [
    dir+"back.png",
    dir+"coffee.png",
    dir+"cool.png",
    dir+"crazy.png",
    dir+"double-thumbs-up.png",
    dir+"ghost.png",
    dir+"handstand.png",
    dir+"happy.png",
    dir+"howdy.png",
    dir+"more-crazy.png",
    dir+"question-sign.png",
    dir+"sad.png",
    dir+"sleeping.png",
    dir+"smile-D.png",
    dir+"surprised.png",
    dir+"tadaa.png",
    dir+"thumbs-up.png",
    dir+"tower.png",
    dir+"well.png",
    dir+"wiggle.png"
];

//----------------------------------------
// The Popup Characters have an initial random delay
//----------------------------------------
document.querySelectorAll('.pop-character').forEach(el => {
  const delay = Math.random() * 10;
  el.style.animationDelay = `${delay}s`;
});

//----------------------------------------
// Handle the footer lane doodle march
//----------------------------------------
const lane = document.querySelector(".footer-doodle-lane");

function spawnDoodle() {
    // Add a Wrapper div (for horizontal walking)
    const wrapper = document.createElement("div");
    wrapper.classList.add("footer-doodle");

    // Create doodle image (for jumping)
    const img = document.createElement("img");
    img.src = doodles[Math.floor(Math.random() * doodles.length)];
    wrapper.appendChild(img);

    // Random duration
    const duration = 14 + Math.random() * 8;
    wrapper.style.animationDuration = duration + "s";

    // Click -> Jump
    img.addEventListener("click", () => {
        img.classList.remove("jump");
        void img.offsetWidth;
        img.classList.add("jump");
    });

    lane.appendChild(wrapper);

    // Remove after animation
    setTimeout(() => wrapper.remove(), duration * 1000);

    // Spawn next
    const nextDelay = (5 + Math.random() * 5) * 1000;
    setTimeout(spawnDoodle, nextDelay);
}

// Start the loop
spawnDoodle();