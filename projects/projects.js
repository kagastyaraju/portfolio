import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  try {
    // Fetch project data
    const projects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');

    // Render projects
    renderProjects(projects, container, 'h2');

    // Update project count in the title
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.textContent += ` (${projects.length} projects)`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    document.querySelector('.projects').innerHTML = 
      '<p>Failed to load projects. Please try again later.</p>';
  }
})();