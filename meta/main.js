import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale;
let yScale;

async function loadData() {
  const data = await d3.csv('loc.csv');
  console.log(data);
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];

      let { author, date, time, timezone } = first;
      let datetime = new Date(first.datetime);

      let ret = {
        id: commit,
        url: 'https://github.com/Colin-Tran/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Add more stats as needed...
  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Files');
  dl.append('dd').text(numFiles);

  const maxDepth = d3.max(data, d => d.depth);
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(maxDepth);
  
  const avgLineLength = d3.mean(data, (d) => d.length);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(avgLineLength.toFixed(1));

  const daysWorked = d3.group(data, (d) => d.date).size;
  dl.append('dt').text('Days worked');
  dl.append('dd').text(daysWorked);
}
// console.log(commits);

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
    };

    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);
    
    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));


    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');;

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);


    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    const dots = svg.append('g').attr('class', 'dots');



    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    const rScale = d3
      .scaleSqrt()
      .domain([minLines, maxLines])
      .range([5, 18]);

      
    dots
      .selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);

        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mousemove', (event) => {
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });

    createBrushSelector(svg);
  }

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([5, 18]);

  const xAxis = d3.axisBottom(xScale);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  // remove the old x-axis code, then replace with:
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });

  author.textContent = commit.author;

  lines.textContent = commit.totalLines;

}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));

  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');

  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);
  
  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}


let data = await loadData();
let commits = processCommits(data);

let commitProgress = 100;
let filteredCommits = commits;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

const commitSlider = document.getElementById('commit-progress');
const commitTime = document.getElementById('commit-time');

function onTimeSliderChange() {
  commitProgress = Number(commitSlider.value);
  commitMaxTime = timeScale.invert(commitProgress);

  commitTime.textContent = commitMaxTime.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
}

commitSlider.addEventListener('input', onTimeSliderChange);
onTimeSliderChange();

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);