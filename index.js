import { fetchJSON, renderProjects } from './global.js';

(async () => {
  try {
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3);
    const container = document.querySelector('.projects');
    renderProjects(latestProjects, container, 'h2');
  } catch (error) {
    console.error('Error:', error);
  }
})();


// Add after project rendering code...
const githubData = await fetchGitHubData('kagastyaraju');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
    <dl>
      <dt>Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
    </dl>
  `;
}