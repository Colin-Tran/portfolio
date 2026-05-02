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
    let query = '';
    let selectedIndex = -1;
    let currentData = []; // used to map index → year

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
    return { label: year, value: count }; // TODO
    });
    currentData = newData;

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));


  // TODO: clear up paths and legends
  // update paths and legends, refer to steps 1.4 and 2.2
    let newSVG = d3.select('#projects-pie-plot');
    newSVG.selectAll('path').remove();

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();


  newArcs.forEach((arc, i) => {
    newSVG
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .attr('class', selectedIndex === i ? 'selected' : '')

        .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        newSVG
            .selectAll('path')
            .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

        legend
            .selectAll('li')
            .attr('class', (_, idx) =>
            selectedIndex === idx ? 'legend-item selected' : 'legend-item'
            );

            // if (selectedIndex === -1) {
            //         renderProjects(projects, projectsContainer, 'h2');
            //     } else {
            //     // TODO: filter projects and project them onto webpage
            //     // Hint: `.label` might be useful
            //         let selectedYear = newData[selectedIndex].label;

            //         let filteredProjects = projects.filter((project) =>
            //         project.year === selectedYear
            //         );

            //         renderProjects(filteredProjects, projectsContainer, 'h2');
            
            //     }
 
            applyFilters();
        });
});

    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color: ${colors(idx)}`)
            .attr('class', selectedIndex === idx ? 'legend-item selected' : 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
};

function setQuery(newQuery) {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(newQuery.toLowerCase());
  });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

// searchInput.addEventListener('input', (event) => {
//   let filteredProjects = setQuery(event.target.value);

//   renderProjects(filteredProjects, projectsContainer, 'h2');
//   renderPieChart(filteredProjects);
// });

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  applyFilters();
});

function applyFilters() {
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    let matchesSearch = values.includes(query.toLowerCase());

    let matchesYear =
      selectedIndex === -1 ||
      project.year == currentData[selectedIndex].label;

    return matchesSearch && matchesYear;
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
}