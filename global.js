console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Pages array for navigation
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/kagastyaraju", title: "GitHub" },
];

// Check if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains("home");

// Create and insert the navigation bar
let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = !ARE_WE_HOME && !p.url.startsWith("http") ? "../" + p.url : p.url;

  // Create a link element
  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // Highlight the current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  // Add the link to the navigation bar
  nav.append(a);
}

// Add the dark mode switcher at the top of the page
document.body.insertAdjacentHTML(
  "afterbegin",
  `
    <label class="color-scheme" style="position: absolute; top: 1rem; right: 1rem; font-size: 0.8em;">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
);

// Get references to the root element and the select dropdown
const root = document.documentElement;
const select = document.querySelector("#theme-select");

// Function to set the color scheme
function setColorScheme(colorScheme) {
  root.style.setProperty("color-scheme", colorScheme); // Set CSS color-scheme
  localStorage.colorScheme = colorScheme; // Save preference in localStorage
  select.value = colorScheme; // Update dropdown
}

// Event listener for when the user changes the theme
select.addEventListener("input", (event) => {
  setColorScheme(event.target.value);
});

// Load the user's preference from localStorage on page load
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("light dark"); // Default to automatic
}
