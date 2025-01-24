console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 2.1: Get all nav links
let navLinks = $$("nav a");

// Step 2.2: Find the link to the current page
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

// Step 2.3: Add the `current` class to the current page link
currentLink?.classList.add("current");
