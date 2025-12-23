/************************************************************
 * DeadPool 2026 – Mobile / Vercel Preview
 * Fully working Wikidata + Three.js build
 ************************************************************/

/* ---------- ROLE (Preview Only) ---------- */
const params = new URLSearchParams(window.location.search);
const role = params.get("role") ?? "spectator";

const statusEl = document.getElementById("status");
statusEl.innerText = `You are: ${role.toUpperCase()}`;

/* ---------- WIKIDATA SEARCH (GET – CORS SAFE) ---------- */
async function searchCelebrity(query) {
  statusEl.innerText = "Searching Wikidata…";

  const sparql = `
    SELECT ?item ?itemLabel ?description WHERE {
      SERVICE wikibase:mwapi {
        bd:serviceParam wikibase:endpoint "www.wikidata.org";
        bd:serviceParam wikibase:api "EntitySearch";
        bd:serviceParam mwapi:search "${query}";
        bd:serviceParam mwapi:language "en";
        ?item wikibase:apiOutputItem mwapi:item.
      }
      OPTIONAL {
        ?item schema:description ?description
        FILTER (lang(?description) = "en")
      }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
      }
    }
    LIMIT 1
  `;

  const url =
    "https://query.wikidata.org/sparql?query=" +
    encodeURIComponent(sparql) +
    "&format=json";

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/sparql+json" }
    });

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const json = await res.json();
    const result = json.results.bindings[0];

    if (!result) {
      statusEl.innerText = "No match found.";
      return null;
    }

    const celeb = {
      qid: result.item.value.split("/").pop(),
      name: result.itemLabel.value,
      description: result.description?.value ?? ""
    };

    statusEl.innerText = `Matched: ${celeb.name}`;
    return celeb;

  } catch (err) {
    console.error(err);
    statusEl.innerText = "Search failed.";
    return null;
  }
}

/* ---------- SEARCH & LOCK ---------- */
async function searchAndLock() {
  const name = document.getElementById("name").value.trim();
  const cause = document.getElementById("cause").value.trim();

  if (!name || !cause) {
    alert("Please enter both a celebrity name and cause of death.");
    return;
  }

  const celeb = await searchCelebrity(name);

  if (!celeb) {
    alert("No celebrity found.");
    return;
  }

  alert(
    `LOCKED PICK\n\n` +
    `Role: ${role.toUpperCase()}\n` +
    `Celebrity: ${celeb.name}\n` +
    `Q-ID: ${celeb.qid}\n` +
    `Predicted Cause: ${cause}`
  );

  pulseScore();
}

/* ---------- THREE.JS SCOREBOARD ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / (window.innerHeight * 0.6),
  0.1,
  100
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
document.getElementById("scene").appendChild(renderer.domElement);

/* Lights */
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

/* Pillar */
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: role === "player1" ? 0xff0000 :
         role === "player2" ? 0x00ff00 : 0x666666,
  emissive: 0x000000
});

const pillar = new THREE.Mesh(geometry, material);
pillar.position.y = 0.5;
scene.add(pillar);

/* ---------- SCORE PULSE ---------- */
function pulseScore() {
  pillar.material.emissive.set(0xffd700);
  pillar.scale.y += 0.3;
  pillar.position.y = pillar.scale.y / 2;

  setTimeout(() => {
    pillar.material.emissive.set(0x000000);
  }, 600);
}

/* ---------- RENDER LOOP ---------- */
function animate() {
  requestAnimationFrame(animate);
  pillar.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

/* ---------- HANDLE ROTATION / RESIZE ---------- */
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
  camera.aspect = window.innerWidth / (window.innerHeight * 0.6);
  camera.updateProjectionMatrix();
});
