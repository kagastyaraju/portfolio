// Declare global variables to hold our data and commits
let data = [];
let commits = [];

// Step 1.1: Load CSV Data and Convert Data Types
async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  // Once data is loaded, display the stats and create the scatterplot
  displayStats();
  processCommits();
  createScatterplot();
}

// Step 1.2: Process Commit Data
function processCommits() {
  commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    let first = lines[0];
    let { author, date, time, timezone, datetime } = first;

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

    Object.defineProperty(commitData, 'lines', {
      value: lines,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    return commitData;
  });
}

// Step 1.3: Displaying the Stats on the Page
function displayStats() {
  processCommits();

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

// Step 2: Visualizing Commits in a Scatterplot
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

  let xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  let yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  const dots = svg.append('g').attr('class', 'dots');
  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);
  svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);

  const gridlines = svg.insert('g', ':first-child').attr('class', 'gridlines').attr('transform', `translate(${usableArea.left}, 0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Add title to the scatterplot
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .text('Commits by Time of Day');
}

// Load data when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});
