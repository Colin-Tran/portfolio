import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');

titleElement.textContent = `${projects.length} Projects`;

// let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// let arc = arcGenerator({
//   startAngle: 0,
//   endAngle: 2 * Math.PI,
// });

// d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');


// Pie Chart Generation for Projects by Year

let colors = d3.scaleOrdinal(d3.schemeTableau10);
// let data = [
//   { value: 1, label: 'apples' },
//   { value: 2, label: 'oranges' },
//   { value: 3, label: 'mangos' },
//   { value: 4, label: 'pears' },
//   { value: 5, label: 'limes' },
//   { value: 5, label: 'cherries' },
// ];
 
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});


let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let sliceGenerator = d3.pie().value((d) => d.value);  

let arcData = sliceGenerator(data);

let arcs = arcData.map(d => arcGenerator(d));


arcs.forEach((arc, idx) => {
  d3.select('#projects-pie-plot')   
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(idx));
});

let legend = d3.select(".legend");

data.forEach((d, idx) => {
  legend
    .append("li")
    .attr("style", `--color: ${colors(idx)}`)
    .attr("class", "legend-item")
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});

// add search field
let query = '';

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value.toLowerCase();

  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
});

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { ... }; // TODO
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = ...;
  let newArcData = newSliceGenerator(...);
  let newArcs = newArcData.map(...);
  // TODO: clear up paths and legends
  ...
  // update paths and legends, refer to steps 1.4 and 2.2
  ...
}

// Call this function on page load
renderPieChart(projects);

searchInput.addEventListener('change', (event) => {
  let filteredProjects = setQuery(event.target.value);
  // re-render legends and pie chart when event triggers
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});