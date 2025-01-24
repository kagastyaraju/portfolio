console.log("IT’S ALIVE!");

const pages = [
  { url: "index.html", title: "Home" },
  { url: "projects/index.html", title: "Projects" },
  { url: "contact/index.html", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/kagastyaraju", title: "GitHub" },
];

// Detect if we are on the home page
const ARE_WE_HOME = location.pathname.endsWith("index.html") || location.pathname === "/";

// Create and insert the navigation bar
let nav = document.createElement("nav");
document.body.prepend(nav);

// Generate navigation links dynamically
for (let p of pages) {
  let url = p.url;

  // Adjust relative paths if not on the home page
  if (!ARE_WE_HOME && !url.startsWith("http")) {
    const depth = location.pathname.split("/").length - 2; // Calculate the directory depth
    const prefix = "../".repeat(depth);
    url = prefix + url;
  }

  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
    <label class="color-scheme">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
);

const root = document.documentElement;
const select = document.querySelector("#theme-select");

function setColorScheme(colorScheme) {
  root.style.setProperty("color-scheme", colorScheme);
  localStorage.colorScheme = colorScheme;
  select.value = colorScheme;
}

select.addEventListener("input", (event) => {
  setColorScheme(event.target.value);
});

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("light dark");
}
