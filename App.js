const params = new URLSearchParams(window.location.search);
const role = params.get("role") ?? "spectator";

document.getElementById("status").innerText =
  `You are: ${role.toUpperCase()}`;

async function searchCelebrity(query) {
  const sparql = `
    SELECT ?item ?itemLabel ?description WHERE {
      SERVICE wikibase:mwapi {
        bd:serviceParam wikibase:endpoint "www.wikidata.org";
        bd:serviceParam wikibase:api "EntitySearch";
        bd:serviceParam mwapi:search "${query}";
        bd:serviceParam mwapi:language "en";
        ?item wikibase:apiOutputItem mwapi:item.
      }
      OPTIONAL { ?item schema:description ?description FILTER (lang(?description)="en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
  `;

  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      "Accept": "application/sparql+json"
    },
    body: sparql
  });

  const json = await res.json();
  const r = json.results.bindings[0];
  if (!r) return null;

  return {
    qid: r.item.value.split("/").pop(),
    name: r.itemLabel.value
  };
}

async function searchAndLock() {
  const name = document.getElementById("name").value;
  const cause = document.getElementById("cause").value;
  if (!name || !cause) return;

  const celeb = await searchCelebrity(name);
  if (!celeb) {
    alert("No match found");
    return;
  }

  alert(`Locked ${celeb.name} (${celeb.qid}) as ${role}`);
}

/* THREE.JS SCOREBOARD */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
document.getElementById("scene").appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const pillar = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ color: role === "player1" ? 0xff0000 : 0x00ff00 })
);

scene.add(pillar);

function animate() {
  requestAnimationFrame(animate);
  pillar.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
