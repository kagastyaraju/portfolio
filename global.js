console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Old Code: Commented Out
// This part manually finds and highlights the current page link.
// Commenting it out since the new navigation automation handles this.
// 
// let navLinks = $$("nav a");
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );
// currentLink?.classList.add("current");

// New Code: Automated Navigation and Highlighting

// Define the pages array
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/kagastyaraju", title: "GitHub" },
];

// Check if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains("home");

// Create the navigation bar
let nav = document.createElement("nav");
document.body.prepend(nav);

// Add navigation links
for (let p of pages) {
  // Adjust URL for relative paths if not on the home page
  let url = !ARE_WE_HOME && !p.url.startsWith("http") ? "../" + p.url : p.url;

  // Create the link element
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
