// Declare global variables to hold our data and commits
let data = [];
let commits = [];

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,            // Convert line number from string to number
    depth: +row.depth,          // Convert depth to a number
    length: +row.length,        // Convert line length from string to number
    date: new Date(row.date + 'T00:00' + row.timezone), // Build a proper Date object
    datetime: new Date(row.datetime) // Convert datetime string to Date
  }));

  // Once data is loaded, display the stats on the page
  displayStats();
}

/* Step 1.2: Process Commit Data */
function processCommits() {
  commits = d3.groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      // All rows for a commit share the same metadata; use the first row
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      // Build an object containing commit-level information
      let commitData = {
        id: commit,
        url: 'https://github.com/portfolio/commit/' + commit, // Replace YOUR_REPO accordingly
        author,
        date,
        time,
        timezone,
        datetime,
        // Calculate the hour as a decimal (e.g., 2:30 PM becomes 14.5)
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        // Total number of lines modified in this commit
        totalLines: lines.length
      };

      // Add the original line data as a hidden property (won’t show up in console logs)
      Object.defineProperty(commitData, 'lines', {
        value: lines,
        enumerable: false,    // Hide from enumeration
        configurable: false,
        writable: false
      });

      return commitData;
    });
}

/* Step 1.3: Displaying the Stats on the Page */
function displayStats() {
  // Process commits before displaying stats
  processCommits();

  // Create a definition list (<dl>) for our statistics and add a CSS class for styling
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Total Lines of Code (LOC)
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Total Commits
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  // Distinct Count: Number of Files in the Codebase
  const files = d3.group(data, (d) => d.file);
  dl.append('dt').text('Number of Files');
  dl.append('dd').text(files.size);

  // Maximum File Length (in lines)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );
  const maxFileLength = d3.max(fileLengths, (d) => d[1]);
  dl.append('dt').html('Max File Length (lines)');
  dl.append('dd').text(maxFileLength);

  // Average File Length (in lines)
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').html('Avg File Length (lines)');
  dl.append('dd').text(avgFileLength.toFixed(1));

  // Longest Line Length (in characters)
  const longestLineLength = d3.max(data, (d) => d.length);
  dl.append('dt').html('Longest Line Length (chars)');
  dl.append('dd').text(longestLineLength);

  // Average Depth
  const avgDepth = d3.mean(data, (d) => d.depth);
  dl.append('dt').html('Average Depth');
  dl.append('dd').text(avgDepth.toFixed(1));

  // Most Active Period (time of day when most commits occur)
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').html('Most Active Period');
  dl.append('dd').text(maxPeriod);
}

/* Step 2: Visualizing Commits in a Scatterplot */
function createScatterplot() {
  // STEP 2.1: Define dimensions and create the SVG container
  const width = 1000;
  const height = 600;
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Create initial scales:
  let xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  let yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([height, 0]);

  // Draw dots (each dot represents a commit)
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');

  // STEP 2.2: Adding Axes
  // Define margins for our chart
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  // Define the usable area after accounting for margins
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update the scales' ranges to account for margins
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Update the dot positions with the new scales
  dots.selectAll('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac));

  // Create the axes:
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Append the X axis at the bottom of the usable area
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Append the Y axis at the left of the usable area
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // STEP 2.3: Adding Horizontal Grid Lines
  // Insert a group element for gridlines before the axes (so gridlines appear in the background)
  const gridlines = svg.insert('g', ':first-child')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines using an axis with no labels and ticks extending across the chart width
  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );
}

/* Integrate Data Loading with Visualization */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  // At this point, displayStats() has been called (which processes commits) so 'commits' is ready
  createScatterplot();
});
