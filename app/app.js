// Leonida Platinum Desk — GTA 6 trophy guide + tracker.
// Data is fetched from data/trophies.json; progress lives in localStorage.
const KEY = 'leonida-earned';
const params = new URLSearchParams(location.search);
const shot = params.get('shot') || 'checklist';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let filter = 'all';
let gradeFilter = 'all';
let searchText = '';
let spoiler = false;
let selectedId = null;

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const guideEl = $('guide');
const earnedCountEl = $('earned-count');
const percentEl = $('percent');
const progressFillEl = $('progress-fill');
const shownCountEl = $('shown-count');

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function updateTotals() {
  const n = earned.size;
  const total = trophies.length;
  earnedCountEl.textContent = `${n} / ${total} earned`;
  percentEl.textContent = `${Math.round((n / total) * 100)}%`;
  progressFillEl.style.width = `${(n / total) * 100}%`;
}

function isPlatinumPath(t) {
  return t.category === 'story' || t.missable || t.id === 1;
}

function visibleTrophies() {
  const q = searchText.trim().toLowerCase();
  return trophies.filter((t) => {
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (filter === 'missable' && !t.missable) return false;
    if (filter === 'platinum-path' && !isPlatinumPath(t)) return false;
    if (filter !== 'all' && filter !== 'missable' && filter !== 'platinum-path' && t.category !== filter) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function displayName(t) {
  return spoiler && t.hidden && !earned.has(t.id) ? '???' : t.name;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    li.dataset.id = t.id;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'earned-box';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      updateTotals();
      renderList();
    });
    box.addEventListener('click', (e) => e.stopPropagation());

    const info = document.createElement('div');
    info.className = 'trophy-info';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = displayName(t);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc' + (spoiler && t.hidden && !earned.has(t.id) ? ' blurred' : '');
    desc.textContent = t.description;
    info.append(name, desc);

    const gradeChip = document.createElement('span');
    gradeChip.className = `chip grade-${t.grade}`;
    gradeChip.textContent = t.grade;
    const catChip = document.createElement('span');
    catChip.className = `chip cat-${t.category}`;
    catChip.textContent = t.category;
    li.append(box, info, gradeChip, catChip);
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'chip missable-flag';
      flag.textContent = 'MISSABLE';
      li.append(flag);
    }
    li.addEventListener('click', () => {
      selectedId = t.id;
      renderGuide();
      renderList();
    });
    listEl.append(li);
  }
  shownCountEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
}

function renderGuide() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    guideEl.innerHTML = '<p class="guide-empty">Click a trophy to see its guide here.</p>';
    return;
  }
  guideEl.replaceChildren();
  if (shot === 'checklist') {
    const nextMissable = trophies.find((t) => t.missable && !earned.has(t.id));
    if (nextMissable) {
      const next = document.createElement('p');
      next.className = 'guide-nextup';
      next.style.cssText = 'margin: 0 0 10px; font-size: .88rem; font-weight: 700;';
      next.textContent = `Next up: ${nextMissable.name} — ${nextMissable.source}`;
      guideEl.append(next);
    }
  }
  const hiddenSpoiler = spoiler && t.hidden && !earned.has(t.id);
  const h = document.createElement('h2');
  h.textContent = displayName(t);
  const d = document.createElement('p');
  d.className = 'guide-desc' + (hiddenSpoiler ? ' blurred' : '');
  if (hiddenSpoiler) d.style.cssText = 'filter: blur(4px); user-select: none;';
  d.textContent = t.description;
  guideEl.append(h, d);
  if (t.missable) {
    const warn = document.createElement('span');
    warn.className = 'guide-missable';
    warn.textContent = '⚠ MISSABLE — do this before finishing the chapter, or it is lost for this playthrough.';
    guideEl.append(warn);
  }
  const g = document.createElement('p');
  g.className = 'guide-text' + (hiddenSpoiler ? ' blurred' : '');
  if (hiddenSpoiler) g.style.cssText = 'filter: blur(4px); user-select: none;';
  g.textContent = t.guide;
  const s = document.createElement('p');
  s.className = 'guide-source';
  s.textContent = `Source: ${t.source}`;
  guideEl.append(g, s);
}

function renderRoadmap() {
  const phases = [
    {
      title: 'Phase 1 — Story',
      note: 'Play the story in order; missable side strands must be finished before the final chapters.',
      items: trophies.filter((t) => t.category === 'story'),
      flagMissable: true,
    },
    {
      title: 'Phase 2 — Activities',
      note: 'Races, ranges, fishing, arcades and the rest of the open-world activities.',
      items: trophies.filter((t) => t.category === 'activities'),
    },
    {
      title: 'Phase 3 — Collectibles',
      note: 'Meditation spots, card sets, WAiNK locations, vehicles and full map exploration.',
      items: trophies.filter((t) => t.category === 'collectibles'),
    },
    {
      title: 'Phase 4 — Combat & misc cleanup',
      note: 'Heists, robberies, wanted-level escapes and the remaining one-off feats.',
      items: trophies.filter((t) => (t.category === 'combat' || t.category === 'misc') && t.id !== 1),
    },
    {
      title: 'Phase 5 — Platinum',
      note: 'Unlocks automatically once every other trophy is earned.',
      items: trophies.filter((t) => t.id === 1),
    },
  ];
  const ol = $('roadmap-list');
  ol.replaceChildren();
  for (const p of phases) {
    const li = document.createElement('li');
    li.className = 'roadmap-phase';
    const h = document.createElement('h3');
    h.textContent = `${p.title} (${p.items.length} trophies)`;
    const note = document.createElement('p');
    note.textContent = p.note;
    const names = document.createElement('p');
    names.textContent = p.items
      .map((t) => (p.flagMissable && t.missable ? `${t.name} — do these before finishing the chapter` : t.name))
      .join(' · ');
    li.append(h, note, names);
    if (p.flagMissable) {
      const warn = document.createElement('p');
      warn.className = 'missable-note';
      warn.textContent = 'Missable in this phase: Road to Rehabilitation, This Was No Boat Accident, The Lone Rider, Supply & Demand, Spin On This! — finish them before the story ends.';
      li.append(warn);
    }
    ol.append(li);
  }
}

function render() {
  updateTotals();
  renderList();
  renderGuide();
  renderRoadmap();
}

// Filters
document.querySelectorAll('#filters button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#filters button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    renderList();
  });
});
$('grade').addEventListener('change', (e) => {
  gradeFilter = e.target.value;
  renderList();
});
$('search').addEventListener('input', (e) => {
  searchText = e.target.value;
  renderList();
});
$('spoiler').addEventListener('change', (e) => {
  spoiler = e.target.checked;
  renderList();
  renderGuide();
});

// Export / import
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned].sort((x, y) => x - y))], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import-btn').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const ids = JSON.parse(await file.text());
    earned = new Set(ids.filter((id) => trophies.some((t) => t.id === id)));
    save();
    render();
  } catch {
    // Ignore malformed import files.
  }
  e.target.value = '';
});

// Shot modes
if (shot === 'checklist') {
  earned = new Set([2, 3, 4, 5, 6, 7]);
  save();
  selectedId = 22; // missable story trophy, guide panel open
} else if (shot === 'missables') {
  filter = 'missable';
  document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b.dataset.filter === 'missable'));
  selectedId = 22;
} else if (shot === 'spoiler') {
  spoiler = true;
  $('spoiler').checked = true;
  earned = new Set([2, 3]);
  save();
  selectedId = 22;
} else if (shot === 'roadmap') {
  selectedId = 1;
}

render();

if (shot === 'roadmap') {
  document.querySelector('.layout').style.display = 'none';
  document.querySelector('.toolbar').style.display = 'none';
  window.scrollTo(0, Math.max(0, $('roadmap').offsetTop - 140));
}

window.rendered = true;
