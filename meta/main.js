// Global variables for storing data and commits
let data = [];
let commits = [];

// Asynchronously load the CSV data
async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,         // Convert string to number
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));

  // Process commits and display stats once data is loaded
  processCommits();
  displayStats();
}

// Call loadData when the document is ready
document.addEventListener('DOMContentLoaded', loadData);
