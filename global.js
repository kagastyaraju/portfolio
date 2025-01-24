console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/kagastyaraju", title: "GitHub" },
];

const ARE_WE_HOME = document.documentElement.classList.contains("home");
console.log("Are we on the home page? ", ARE_WE_HOME);

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let depth = location.pathname.split("/").length - 2;
  let prefix = "../".repeat(depth);
  let url = !ARE_WE_HOME && !p.url.startsWith("http") ? prefix + p.url : p.url;

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
