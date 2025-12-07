
// Get theme toggle icon/button
const icon = document.getElementById("theme-icon");
const btn = document.getElementById("theme-toggle")

// Define SVGs for light/dark theme
const svg_path_sun = "M12 4.5V2m0 20v-2.5M4.5 12H2m20 0h-2.5M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4m16.8-16.8l-1.4 1.4M12 7a5 5 0 110 10 5 5 0 010-10z";
const svg_path_moon = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";

function set_theme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    icon.firstElementChild.setAttribute("d", theme === "dark" ? svg_path_sun : svg_path_moon);
}

// Set from cache
if (theme = localStorage.getItem("theme")) {
    set_theme(theme)
}

// Toggle theme
btn.addEventListener("click", () => {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    set_theme(theme === "light" ? "dark" : "light")
});