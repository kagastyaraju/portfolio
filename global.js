console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "meta/", title: "Meta" },
  { url: "https://github.com/kagastyaraju", title: "GitHub" },
];

const ARE_WE_HOME = document.documentElement.classList.contains("home");

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = !ARE_WE_HOME && !p.url.startsWith("http") ? "../" + p.url : p.url;

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
    <label class="color-scheme" style="position: absolute; top: 1rem; right: 1rem; font-size: 0.8em;">
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
  root.style.setProperty("color-scheme", colorScheme); // Set CSS color-scheme
  localStorage.colorScheme = colorScheme; // Save preference in localStorage
  select.value = colorScheme; // Update dropdown
}

select.addEventListener("input", (event) => {
  setColorScheme(event.target.value);
});

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("light dark"); // Default to automatic
}


// Fetch JSON data
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Render projects
// global.js
export function renderProjects(projects, container, headingLevel = 'h2') {
  if (!container) return; // Ensure container exists
  container.innerHTML = ''; // Clear previous content

  projects.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div class="project-details">
        <p class="project-description">${project.description}</p>
        <p class="project-year">${project.year}</p>
      </div>
    `;
    container.appendChild(article);
  });
}


export async function fetchGitHubData(username) { // Parameter name fixed
  return fetchJSON(`https://api.github.com/users/${username}`); // Use correct variable
}
