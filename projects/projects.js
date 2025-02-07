import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

let allProjects = [];
let selectedYear = null;
let searchQuery = '';

// Wait for DOM to load first
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get elements with null checks
    const searchInput = document.getElementById('search-input');
    const projectsContainer = document.querySelector('.projects');
    const pieChartSvg = document.getElementById('pie-chart');
    
    if (!searchInput) throw new Error('Search input element not found');
    if (!projectsContainer) throw new Error('Projects container not found');
    if (!pieChartSvg) throw new Error('Pie chart SVG not found');

    // Load data
    allProjects = await fetchJSON('../lib/projects.json');
    
    // Initial render
    updateVisualization(allProjects);
    renderProjects(allProjects, projectsContainer, 'h2');

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      const filtered = filterProjects();
      updateVisualization(filtered);
      renderProjects(filtered, projectsContainer, 'h2');
    });

  } catch (error) {
    console.error('Initialization Error:', error);
    document.body.innerHTML = `<p class="error">${error.message}. Check console for details.</p>`;
  }
});

function filterProjects() {
  return allProjects.filter(project => {
    const searchString = Object.values(project)
      .join(' ')
      .toLowerCase();
    return searchString.includes(searchQuery) && 
      (!selectedYear || project.year === selectedYear);
  });
}

function updateVisualization(projects) {
  // Clear existing elements
  const svg = d3.select('#pie-chart');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // Process data
  const yearCounts = d3.rollups(
    projects,
    v => v.length,
    d => d.year
  );

  // Handle empty state
  if (yearCounts.length === 0) {
    svg.append('text')
      .text('No projects found')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');
    return;
  }

  // Create visualization elements
  const data = yearCounts.map(([year, count]) => ({
    value: count,
    label: String(year)
  }));

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(40); // Reduced size

  const color = d3.scaleOrdinal(d3.schemeTableau10);
  const arcs = pie(data);

  // Draw pie chart
  svg.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', (_, i) => color(i))
    .on('click', (_, d) => handleYearSelect(d.data.label));

  // Create legend
  legend.selectAll('li')
    .data(data)
    .join('li')
    .attr('class', d => selectedYear === d.label ? 'selected' : null)
    .style('color', (_, i) => color(i))
    .on('click', (_, d) => handleYearSelect(d.label))
    .html(d => `
      <span class="swatch"></span>
      ${d.label} (${d.value})
    `);
}

function handleYearSelect(year) {
  selectedYear = selectedYear === year ? null : year;
  const filtered = filterProjects();
  updateVisualization(filtered);
  renderProjects(filtered, document.querySelector('.projects'), 'h2');
}