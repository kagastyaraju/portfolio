import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

let allProjects = [];
let selectedYear = null;
let searchQuery = '';

async function init() {
  try {
    allProjects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');
    const searchInput = document.querySelector('.search');
    
    // Initial render
    updateVisualization(allProjects);
    renderProjects(allProjects, container, 'h2');

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      const filtered = filterProjects();
      updateVisualization(filtered);
      renderProjects(filtered, container, 'h2');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

function filterProjects() {
  return allProjects.filter(project => {
    const matchesSearch = Object.values(project).join(' ').toLowerCase().includes(searchQuery);
    const matchesYear = !selectedYear || project.year === selectedYear;
    return matchesSearch && matchesYear;
  });
}

function updateVisualization(projects) {
  // Process data
  const yearCounts = d3.rollups(
    projects,
    v => v.length,
    d => d.year
  );

  const data = yearCounts.map(([year, count]) => ({
    value: count,
    label: String(year)
  }));

  // Clear existing elements
  d3.select('#pie-chart').selectAll('*').remove();
  d3.select('.legend').selectAll('*').remove();

  // Create pie generator
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(45);

  // Color scale
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // Create arcs
  const arcs = pie(data);

  // Draw pie chart
  d3.select('#pie-chart')
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', (_, i) => color(i))
    .on('click', (_, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      const filtered = filterProjects();
      updateVisualization(filtered);
      renderProjects(filtered, document.querySelector('.projects'), 'h2');
    });

  // Create legend
  const legend = d3.select('.legend')
    .selectAll('li')
    .data(data)
    .join('li')
    .attr('class', d => selectedYear === d.label ? 'selected' : null)
    .style('color', (_, i) => color(i))
    .on('click', (_, d) => {
      selectedYear = selectedYear === d.label ? null : d.label;
      const filtered = filterProjects();
      updateVisualization(filtered);
      renderProjects(filtered, document.querySelector('.projects'), 'h2');
    });

  legend.append('span').attr('class', 'swatch');
  legend.append('span').text(d => `${d.label} (${d.value})`);
}

// Initialize the app
init();