console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`,
);

let select = document.querySelector(".color-scheme select");

select.addEventListener("input", function (event) {
  console.log("color scheme changed to", event.target.value);

  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value;
});

if ("colorScheme" in localStorage) {
  let saved = localStorage.colorScheme;

  document.documentElement.style.setProperty("color-scheme", saved);

  select.value = saved;
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";


let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/Colin-Tran", title: "GitHub" },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith('http') ? BASE_PATH + url : url;

  // next step: create link and add it to nav

  // Create link and add it to nav
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }


  nav.append(a);
}

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}                                                                                                     

export function renderProjects(projects, containerElement, headingLevel = "h2") {

  // check container
  if (!containerElement) {
    console.error("Invalid container element");
    return;
  }

  containerElement.innerHTML = "";
  
  // check if headings are valid
  const validHeadings = ["h1", "h2", "h3", "h4", "h5", "h6"];

  if (!validHeadings.includes(headingLevel)) {
    headingLevel = "h2";
  }

  if (!projects || projects.length === 0) {
    containerElement.innerHTML = "<p>No projects available.</p>";
    return;
  }

  for (let project of projects) {
    const article = document.createElement("article");

    // use defaults if properties are missing
    const title = project.title || "Untitled Project";
    const description = project.description || "No description available.";
    const image = project.image || "https://vis-society.github.io/labs/2/images/empty.svg";

    article.innerHTML = `
      <${headingLevel}>${title}</${headingLevel}>
      <img src="${image}" alt="${title}">
      <p>${description}</p>
    `;

    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  // return statement here
  return fetchJSON(`https://api.github.com/users/${username}`);
}