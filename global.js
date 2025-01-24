console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const pages = [
  { url: "index.html", title: "Home" },
  { url: "projects/index.html", title: "Projects" },
  { url: "contact/index.html", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/kagastyaraju", title: "GitHub" },
];

const currentPathDepth = location.pathname.split("/").length - 2;
const ARE_WE_HOME = location.pathname.endsWith("index.html") && currentPathDepth === 0;

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;

  if (!ARE_WE_HOME && !p.url.startsWith("http")) {
    const prefix = "../".repeat(currentPathDepth);
    url = prefix + p.url;
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
