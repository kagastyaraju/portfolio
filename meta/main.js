// Global variables for data, commits, scales, and brush selection
let data = [];
let commits = [];
let xScale, yScale;
let brushSelection = null;

// Step 1.1: Load CSV Data and Convert Data Types
async function loadData() {
  try {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: +row.line,
      depth: +row.depth,
      length: +row.length,
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    
    console.log("Data loaded:", data);
    
    // Once data is loaded, display stats and create the scatterplot
    displayStats();
    processCommits();
    createScatterplot();
  } catch (error) {
    console.error("Error loading CSV:", error);
  }
}

// Step 1.2: Process Commit Data
function processCommits() {
  commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;
    
    let commitData = {
      id: commit,
      url: 'https://github.com/YOUR_REPO/commit/' + commit, // Replace YOUR_REPO with your repository name
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    
    // Hide the detailed lines array from normal enumeration
    Object.defineProperty(commitData, 'lines', {
      value: lines,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    
    return commitData;
  });
  
  console.log("Commits processed:", commits);
}

// Step 1.3: Displaying the Stats on the Page
function displayStats() {
  // (Re)process commits to ensure they’re up to date
  processCommits();
  
  // Clear any existing stats content
  d3.select('#stats').html('');
  
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);
  
  const files = d3.group(data, (d) => d.file);
  dl.append('dt').text('Number of Files');
  dl.append('dd').text(files.size);
  
  const fileLengths = d3.rollups(data, (v) => d3.max(v, (d) => d.line), (d) => d.file);
  dl.append('dt').html('Max File Length (lines)');
  dl.append('dd').text(d3.max(fileLengths, (d) => d[1]));
  
  dl.append('dt').html('Avg File Length (lines)');
  dl.append('dd').text(d3.mean(fileLengths, (d) => d[1]).toFixed(1));
  
  dl.append('dt').html('Longest Line Length (chars)');
  dl.append('dd').text(d3.max(data, (d) => d.length));
  
  dl.append('dt').html('Average Depth');
  dl.append('dd').text(d3.mean(data, (d) => d.depth).toFixed(1));
  
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  dl.append('dt').html('Most Active Period');
  dl.append('dd').text(d3.greatest(workByPeriod, (d) => d[1])?.[0]);
}

// ==============================
// Step 3: Tooltip Functionality
// ==============================

// 3.1: Update tooltip content based on the commit
function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const dateElem = document.getElementById('commit-date');

  if (!commit || Object.keys(commit).length === 0) {
    link.href = '';
    link.textContent = '';
    dateElem.textContent = '';
    return;
  }
  
  link.href = commit.url;
  link.textContent = commit.id;
  dateElem.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

// 3.3: Control tooltip visibility
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

// 3.4: Position the tooltip near the mouse cursor
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  // Offset slightly so the tooltip does not sit directly under the cursor
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

// ==============================
// Step 5: Brushing Functionality
// ==============================

function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  if (!brushSelection) return false;
  const [[x0, y0], [x1, y1]] = brushSelection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

function updateSelection() {
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  return selectedCommits;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
  const container = document.getElementById('language-breakdown');
  
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  // Flatten all lines from selected commits
  const lines = selectedCommits.flatMap((d) => d.lines);
  
  // Rollup to count lines per language (assumes each line has a 'type' property)
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );
  
  container.innerHTML = '';
  
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
  return breakdown;
}

// ==============================
// Steps 2 & 4: Scatterplot with Dot Size
// ==============================

function createScatterplot() {
  const width = 1000;
  const height = 600;
  
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  const margin = { top: 50, right: 10, bottom: 30, left: 50 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Make the scales global so that they can be used in the brush functions
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  
  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);
  
  // Sort commits by totalLines in descending order so larger dots render first
  const sortedCommits = d3.sort(commits, (a, b) => b.totalLines - a.totalLines);
  
  // Step 4.1 & 4.2: Create a sqrt radius scale for correct area perception
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  
  const dots = svg.append('g').attr('class', 'dots');
  
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    // Step 3: Tooltip and hover behavior
    .on('mouseenter', function (event, d) {
      d3.select(this).style('fill-opacity', 1);
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', function (event) {
      updateTooltipPosition(event);
    })
    .on('mouseleave', function () {
      d3.select(this).style('fill-opacity', 0.7);
      updateTooltipContent({});
      updateTooltipVisibility(false);
    });
  
  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) =>
    String(d % 24).padStart(2, '0') + ':00'
  );
  
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
  
  // Gridlines (inserted behind the dots)
  const gridlines = svg
    .insert('g', ':first-child')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
  // Title
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .text('Commits by Time of Day');
  
  // ==============================
  // Step 5: Brush Setup
  // ==============================
  
  // Create a brush and listen for brush events
  const brush = d3.brush().on('start brush end', brushed);
  svg.call(brush);
  // Raise the dots (and any elements after the overlay) so that tooltips still work
  svg.selectAll('.dots, .overlay ~ *').raise();
  
  console.log("Scatterplot created");
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});
