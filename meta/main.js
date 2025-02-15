// Declare global variables to hold our data and commits
let data = [];
let commits = [];

// Step 1.1: Load CSV Data and Convert Data Types
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

// Step 1.2: Process Commit Data
function processCommits() {
  commits = d3.groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      // All rows for a commit share the same metadata, so use the first row
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      
      // Build an object containing commit-level information
      let commitData = {
        id: commit,
        url: 'https://github.com/YOUR_REPO/commit/' + commit, // Replace YOUR_REPO with your repository name
        author,
        date,
        time,
        timezone,
        datetime,
        // Calculate the hour as a decimal value (e.g., 2:30 PM becomes 14.5)
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

  // (Optional) Uncomment to check commit objects in your console:
  // console.log(commits);
}

// Step 1.3: Displaying the Stats on the Page
function displayStats() {
  // Process commits before displaying stats
  processCommits();

  // Create a definition list (<dl>) for our statistics and add a CSS class for styling
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // --- Aggregate Stat: Total Lines of Code (LOC) ---
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // --- Aggregate Stat: Total Commits ---
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  // --- Distinct Count: Number of Files in the Codebase ---
  const files = d3.group(data, (d) => d.file);
  dl.append('dt').text('Number of Files');
  dl.append('dd').text(files.size);

  // --- Grouped Aggregate: Maximum File Length (in lines) ---
  // Group data by file and find the maximum line number in each file
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );
  const maxFileLength = d3.max(fileLengths, (d) => d[1]);
  dl.append('dt').html('Max File Length (lines)');
  dl.append('dd').text(maxFileLength);

  // --- Grouped Aggregate: Average File Length (in lines) ---
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').html('Avg File Length (lines)');
  dl.append('dd').text(avgFileLength.toFixed(1));

  // --- Aggregate Stat: Longest Line Length (in characters) ---
  const longestLineLength = d3.max(data, (d) => d.length);
  dl.append('dt').html('Longest Line Length (chars)');
  dl.append('dd').text(longestLineLength);

  // --- Aggregate Stat: Average Depth ---
  const avgDepth = d3.mean(data, (d) => d.depth);
  dl.append('dt').html('Average Depth');
  dl.append('dd').text(avgDepth.toFixed(1));

  // --- Example of Time-Based Analysis: Most Active Period ---
  // Group rows by the period of day using Date.toLocaleString() with the 'dayPeriod' option.
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  // Find the period with the most work
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').html('Most Active Period');
  dl.append('dd').text(maxPeriod);

  // You can add additional stats following the same pattern...
}

// Load the data once the document is ready
document.addEventListener('DOMContentLoaded', loadData);
