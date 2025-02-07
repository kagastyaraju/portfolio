import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

let allProjects = [];
let selectedYear = null;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const elements = {
      searchInput: document.getElementById('search-input'),
      projectsContainer: document.querySelector('.projects'),
      pieChart: document.getElementById('pie-chart'),
      legendContainer: document.querySelector('.legend')
    };

    Object.entries(elements).forEach(([name, element]) => {
      if (!element) throw new Error(`${name} element not found`);
    });

    allProjects = await fetchJSON('../lib/projects.json');
    initializeVisualization(elements);

  } catch (error) {
    handleInitializationError(error);
  }
});

function initializeVisualization({ searchInput, projectsContainer, pieChart, legendContainer }) {
  updateVisualization(allProjects, pieChart, legendContainer);
  renderProjects(allProjects, projectsContainer, 'h2');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    const filtered = filterProjects();
    updateVisualization(filtered, pieChart, legendContainer);
    renderProjects(filtered, projectsContainer, 'h2');
  });
}

function filterProjects() {
  return allProjects.filter(project => {
    const searchMatch = Object.values(project)
      .join(' ')
      .toLowerCase()
      .includes(searchQuery);
      
    const yearMatch = !selectedYear || project.year === selectedYear;
    
    return searchMatch && yearMatch;
  });
}

function updateVisualization(projects, pieChart, legendContainer) {
  const svg = d3.select(pieChart);
  const legend = d3.select(legendContainer);
  
  // Clear existing elements with transitions
  svg.selectAll('*').transition().duration(300).remove();
  legend.selectAll('*').transition().duration(300).remove();

  // Process year data
  const yearData = d3.rollups(
    projects,
    v => v.length,
    d => d.year.toString() // Maintain year as string for consistency
  ).map(([year, count]) => ({
    value: count,
    label: year
  }));

  // Handle empty state
  if (yearData.length === 0) {
    svg.append('text')
      .text('No projects found')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');
    return;
  }

  // Create stable color scale
  const colorScale = d3.scaleOrdinal()
    .domain(yearData.map(d => d.label))
    .range(d3.schemeTableau10);

  // Pie chart configuration
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(35)
    .cornerRadius(2) // Smoother edges
    .padAngle(0.015); // Add spacing between slices

  // Animated transitions for pie chart
  const arcs = pie(yearData);
  
  svg.selectAll('path')
    .data(arcs)
    .join(
      enter => enter.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.label))
        .attr('opacity', 0)
        .call(enter => enter.transition().duration(500).attr('opacity', 1)),
      update => update
        .call(update => update.transition().duration(500)
          .attr('d', arc)
          .attr('fill', d => colorScale(d.data.label))
        ),
      exit => exit
        .call(exit => exit.transition().duration(300).attr('opacity', 0).remove())
    )
    .on('click', (event, d) => handleYearFilter(d.data.label));

  // Interactive legend
  legend.selectAll('li')
    .data(yearData)
    .join(
      enter => enter.append('li')
        .style('opacity', 0)
        .call(enter => enter.transition().duration(500).style('opacity', 1)),
      update => update,
      exit => exit.transition().duration(300).style('opacity', 0).remove()
    )
    .html(d => `
      <span class="swatch" style="background:${colorScale(d.label)}"></span>
      ${d.label} (${d.value})
    `)
    .on('click', (event, d) => handleYearFilter(d.label));
}

function handleYearFilter(year) {
  // Convert year string to number for comparison
  const yearNumber = parseInt(year, 10);
  selectedYear = selectedYear === yearNumber ? null : yearNumber;
  
  const filtered = filterProjects();
  updateVisualization(
    filtered,
    document.getElementById('pie-chart'),
    document.querySelector('.legend')
  );
  renderProjects(filtered, document.querySelector('.projects'), 'h2');
}

function handleInitializationError(error) {
  console.error('Initialization Error:', error);
  document.body.innerHTML = `
    <div class="error">
      <h2>Error Loading Content</h2>
      <p>${error.message}</p>
      <p>Please check your network connection and try again</p>
    </div>
  `;
}