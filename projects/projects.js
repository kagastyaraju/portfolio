// In projects.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

let allProjects = [];
let selectedYear = null;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Get DOM elements with explicit error checking
    const searchInput = document.getElementById('search-input');
    const projectsContainer = document.querySelector('.projects');
    
    if (!searchInput) throw new Error('Search input not found - check HTML ID');
    if (!projectsContainer) throw new Error('Projects container not found');

    // 2. Load data
    allProjects = await fetchJSON('../lib/projects.json');
    
    // 3. Initial render
    updateVisualization(allProjects);
    renderProjects(allProjects, projectsContainer, 'h2');

    // 4. Search functionality with debouncing
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      console.log('Search query:', searchQuery); // Debug log
      
      const filtered = allProjects.filter(project => {
        const projectValues = Object.values(project)
          .join(' ')
          .toLowerCase();
        return projectValues.includes(searchQuery);
      });
      
      updateVisualization(filtered);
      renderProjects(filtered, projectsContainer, 'h2');
    });

  } catch (error) {
    console.error('Initialization Error:', error);
    document.body.innerHTML = `<p class="error">${error.message}</p>`;
  }
});

function updateVisualization(projects) {
  // 1. Clear previous elements
  const svg = d3.select('#pie-chart');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // 2. Process data
  const yearData = d3.rollups(
    projects,
    v => v.length,
    d => d.year
  ).map(([year, count]) => ({
    value: count,
    label: String(year)
  }));

  // 3. Create smaller pie chart (radius 35)
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(35); // Reduced size

  const color = d3.scaleOrdinal(d3.schemeTableau10);
  const arcs = pie(yearData);

  // 4. Draw paths
  svg.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', (_, i) => color(i))
    .on('click', (_, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      const filtered = allProjects.filter(p => 
        !selectedYear || p.year === selectedYear
      );
      renderProjects(filtered, document.querySelector('.projects'), 'h2');
      updateVisualization(filtered);
    });

  // 5. Create legend
  legend.selectAll('li')
    .data(yearData)
    .join('li')
    .html(d => `
      <span class="swatch" style="background:${color(d.label)}"></span>
      ${d.label} (${d.value})
    `)
    .on('click', (_, d) => {
      selectedYear = selectedYear === d.label ? null : d.label;
      const filtered = allProjects.filter(p => 
        !selectedYear || p.year === selectedYear
      );
      renderProjects(filtered, document.querySelector('.projects'), 'h2');
      updateVisualization(filtered);
    });
}