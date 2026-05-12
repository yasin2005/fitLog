// ─── DOM refs ─────────────────────────────────────────────────────────────────
const form        = document.getElementById('searchForm');
const queryInput  = document.getElementById('searchQuery');
const resultsCount = document.getElementById('resultsCount');
const resultsGrid  = document.getElementById('resultsGrid');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// Multi-select pill state
const selectedBodyParts  = new Set();
const selectedEquipments = new Set();

// Dropdown open/close
function setupFilterDropdown(triggerId, panelId, optionsId, selectedSet, badgeId, clearId, selectAllId) {
  const trigger   = document.getElementById(triggerId);
  const panel     = document.getElementById(panelId);
  const badge     = document.getElementById(badgeId);
  const container = document.getElementById(optionsId);
  const selectAllBtn = document.getElementById(selectAllId);

  function getOptions() {
    return [...container.querySelectorAll('.filter-option:not(.filter-option-all)')];
  }

  function updateSelectAll() {
    const opts = getOptions();
    const allActive = opts.length > 0 && opts.every(o => o.classList.contains('active'));
    selectAllBtn.classList.toggle('active', allActive);
  }

  // Badge only shows when a subset (not all, not none) is selected
  function updateBadge() {
    const total = getOptions().length;
    if (selectedSet.size > 0 && selectedSet.size < total) {
      badge.textContent = selectedSet.size;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // Select all options (default state on load)
  function initSelectAll() {
    getOptions().forEach(o => {
      selectedSet.add(o.dataset.value);
      o.classList.add('active');
    });
    selectAllBtn.classList.add('active');
    updateBadge();
  }
  initSelectAll();

  // Toggle all on "Select all" click
  selectAllBtn.addEventListener('click', e => {
    e.stopPropagation();
    const opts = getOptions();
    const allActive = opts.every(o => o.classList.contains('active'));
    opts.forEach(o => {
      if (allActive) {
        selectedSet.delete(o.dataset.value);
        o.classList.remove('active');
      } else {
        selectedSet.add(o.dataset.value);
        o.classList.add('active');
      }
    });
    selectAllBtn.classList.toggle('active', !allActive);
    updateBadge();
  });

  // Stop panel clicks from bubbling so the dropdown stays open
  panel.addEventListener('click', e => e.stopPropagation());

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !panel.classList.contains('hidden');
    document.querySelectorAll('.filter-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.filter-trigger').forEach(t => t.classList.remove('open'));
    if (!isOpen) {
      panel.classList.remove('hidden');
      trigger.classList.add('open');
    }
  });

  container.addEventListener('click', e => {
    const opt = e.target.closest('.filter-option:not(.filter-option-all)');
    if (!opt) return;
    const val = opt.dataset.value;
    if (selectedSet.has(val)) {
      selectedSet.delete(val);
      opt.classList.remove('active');
    } else {
      selectedSet.add(val);
      opt.classList.add('active');
    }
    updateSelectAll();
    updateBadge();
  });

  document.getElementById(clearId).addEventListener('click', () => {
    selectedSet.clear();
    getOptions().forEach(o => o.classList.remove('active'));
    selectAllBtn.classList.remove('active');
    updateBadge();
  });
}

setupFilterDropdown('bodyPartTrigger',  'bodyPartPanel',  'bodyPartPills',  selectedBodyParts,  'bodyPartBadge',  'clearBodyParts',  'selectAllBodyParts');
setupFilterDropdown('equipmentTrigger', 'equipmentPanel', 'equipmentPills', selectedEquipments, 'equipmentBadge', 'clearEquipments', 'selectAllEquipments');

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.filter-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.filter-trigger').forEach(t => t.classList.remove('open'));
});

queryInput.addEventListener('input', () => {
  clearSearchBtn.style.display = queryInput.value ? '' : 'none';
});

clearSearchBtn.addEventListener('click', () => {
  queryInput.value = '';
  // Re-select all options in both dropdowns (back to default state)
  ['bodyPartPills', 'equipmentPills'].forEach(id => {
    const container = document.getElementById(id);
    container.querySelectorAll('.filter-option:not(.filter-option-all)').forEach(o => o.classList.add('active'));
    const selectAll = container.querySelector('.filter-option-all');
    if (selectAll) selectAll.classList.add('active');
  });
  selectedBodyParts.clear();
  selectedEquipments.clear();
  document.getElementById('bodyPartPills').querySelectorAll('.filter-option:not(.filter-option-all)')
    .forEach(o => selectedBodyParts.add(o.dataset.value));
  document.getElementById('equipmentPills').querySelectorAll('.filter-option:not(.filter-option-all)')
    .forEach(o => selectedEquipments.add(o.dataset.value));
  document.getElementById('bodyPartBadge').classList.add('hidden');
  document.getElementById('equipmentBadge').classList.add('hidden');
  clearSearchBtn.style.display = 'none';
  resultsGrid.innerHTML = '';
  resultsCount.textContent = 'Search to get started';
  refreshCardAddButtons();
});

// Sidebar elements
const sidebarIdle     = document.getElementById('sidebarIdle');
const sidebarCreating = document.getElementById('sidebarCreating');
const startCreateBtn  = document.getElementById('startCreateBtn');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const saveWorkoutBtn  = document.getElementById('saveWorkoutBtn');
const workoutNameInput = document.getElementById('workoutName');
const workoutDescInput = document.getElementById('workoutDesc');
const sidebarExList    = document.getElementById('sidebarExList');
const exCountLabel     = document.getElementById('exCount');

// ─── Workout creator state ─────────────────────────────────────────────────────
// Exercises staged for the workout being built (in memory until saved)
let isCreating = false;
let stagedExercises = []; // array of full exercise objects from the API

function enterCreatingMode() {
  isCreating = true;
  stagedExercises = [];
  workoutNameInput.value = '';
  workoutDescInput.value = '';
  renderSidebarList();
  sidebarIdle.classList.add('hidden');
  sidebarCreating.classList.remove('hidden');
  // Show the "Add to Workout" button inside the modal
  document.getElementById('modalAddSection').style.display = '';
  // Re-render cards if there are results so Add buttons appear
  refreshCardAddButtons();
}

function exitCreatingMode() {
  isCreating = false;
  stagedExercises = [];
  sidebarCreating.classList.add('hidden');
  sidebarIdle.classList.remove('hidden');
  document.getElementById('modalAddSection').style.display = 'none';
  refreshCardAddButtons();
}

// Updates the exercise list in the sidebar panel
function renderSidebarList() {
  sidebarExList.innerHTML = '';
  exCountLabel.textContent = `(${stagedExercises.length})`;

  if (stagedExercises.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'sidebar-ex-empty';
    empty.textContent = 'Search for exercises and click Add.';
    sidebarExList.appendChild(empty);
    return;
  }

  stagedExercises.forEach((ex, i) => {
    const li = document.createElement('li');
    li.className = 'sidebar-ex-item';

    const name = document.createElement('span');
    name.textContent = ex.name.replace(/\b\w/g, c => c.toUpperCase());

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'sidebar-ex-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      stagedExercises.splice(i, 1);
      renderSidebarList();
      refreshCardAddButtons();
    });

    li.appendChild(name);
    li.appendChild(removeBtn);
    sidebarExList.appendChild(li);
  });
}

// Adds one exercise to the staged list (called from card or modal Add button)
function addExerciseToWorkout(ex) {
  if (!stagedExercises.some(e => e.exerciseId === ex.exerciseId)) {
    stagedExercises.push({
      exerciseId:       ex.exerciseId,
      name:             ex.name,
      gifUrl:           ex.gifUrl,
      targetMuscles:    ex.targetMuscles    || [],
      bodyParts:        ex.bodyParts        || [],
      equipments:       ex.equipments       || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions:     ex.instructions     || []
    });
    renderSidebarList();
    refreshCardAddButtons();
  }
}

// Updates Add buttons on all rendered cards to reflect current staged state
function refreshCardAddButtons() {
  document.querySelectorAll('.card-add-btn').forEach(btn => {
    const id = btn.dataset.exerciseId;
    const already = stagedExercises.some(e => e.exerciseId === id);
    btn.textContent = already ? '✓ Added' : '+ Add';
    btn.disabled = already || !isCreating;
    btn.style.display = isCreating ? '' : 'none';
  });
}

startCreateBtn.addEventListener('click', enterCreatingMode);
cancelCreateBtn.addEventListener('click', exitCreatingMode);

saveWorkoutBtn.addEventListener('click', async () => {
  const name = workoutNameInput.value.trim();
  if (!name) { alert('Please enter a workout name.'); return; }
  if (stagedExercises.length === 0) { alert('Please add at least one exercise.'); return; }

  saveWorkoutBtn.disabled = true;
  saveWorkoutBtn.textContent = 'Saving…';

  try {
    const res = await fetch('/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: workoutDescInput.value.trim(),
        exercises: stagedExercises
      })
    });
    const data = await res.json();
    if (data.success) {
      exitCreatingMode();
      // Brief confirmation
      startCreateBtn.textContent = '✓ Workout saved!';
      setTimeout(() => { startCreateBtn.textContent = '+ Create Workout'; }, 2500);
    }
  } catch (err) {
    console.error(err);
  } finally {
    saveWorkoutBtn.disabled = false;
    saveWorkoutBtn.textContent = 'Save Workout';
  }
});

// ─── Modal ────────────────────────────────────────────────────────────────────
let currentModalExercise = null;

function openModal(ex) {
  currentModalExercise = ex;

  const modalImg = document.getElementById('modalImg');
  modalImg.style.display = 'block';
  modalImg.src = ex.gifUrl;
  modalImg.alt = ex.name;
  modalImg.onerror = () => {
    modalImg.style.display = 'none';
    let fallback = document.getElementById('modalImgFallback');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.id = 'modalImgFallback';
      fallback.className = 'modal-img-fallback';
      fallback.textContent = 'No image available';
      modalImg.parentNode.appendChild(fallback);
    }
    fallback.style.display = 'flex';
  };
  const fallback = document.getElementById('modalImgFallback');
  if (fallback) fallback.style.display = 'none';

  document.getElementById('modalName').textContent = ex.name.replace(/\b\w/g, c => c.toUpperCase());

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = '';
  [...(ex.bodyParts || []), ...(ex.equipments || [])].forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tagsEl.appendChild(span);
  });

  const targetSection = document.getElementById('modalTargetSection');
  if (ex.targetMuscles && ex.targetMuscles.length > 0) {
    document.getElementById('modalTarget').textContent = ex.targetMuscles.join(', ');
    targetSection.style.display = '';
  } else {
    targetSection.style.display = 'none';
  }

  const secondarySection = document.getElementById('modalSecondarySection');
  if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
    document.getElementById('modalSecondary').textContent = ex.secondaryMuscles.join(', ');
    secondarySection.style.display = '';
  } else {
    secondarySection.style.display = 'none';
  }

  const instrEl = document.getElementById('modalInstructions');
  instrEl.innerHTML = '';
  (ex.instructions || []).forEach(step => {
    const li = document.createElement('li');
    // Strip "Step: 1" prefixes that ExerciseDB includes in some instruction strings
    li.textContent = step.replace(/^Step:\s*\d+\s*/i, '');
    instrEl.appendChild(li);
  });

  // Show or hide the "Add to Workout" button in the modal based on state
  const addSection = document.getElementById('modalAddSection');
  const addBtn = document.getElementById('modalAddBtn');
  if (isCreating) {
    addSection.style.display = '';
    const already = stagedExercises.some(e => e.exerciseId === ex.exerciseId);
    addBtn.textContent = already ? '✓ Already added' : '+ Add to Workout';
    addBtn.disabled = already;
  } else {
    addSection.style.display = 'none';
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalExercise = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// "Add to Workout" inside the modal popup
document.getElementById('modalAddBtn').addEventListener('click', () => {
  if (!currentModalExercise) return;
  addExerciseToWorkout(currentModalExercise);
  const addBtn = document.getElementById('modalAddBtn');
  addBtn.textContent = '✓ Already added';
  addBtn.disabled = true;
});

// ─── Cards ────────────────────────────────────────────────────────────────────
const bodyPartColor = {
  'chest':       '#e74c3c',
  'back':        '#3498db',
  'shoulders':   '#9b59b6',
  'upper arms':  '#e67e22',
  'lower arms':  '#f39c12',
  'upper legs':  '#1abc9c',
  'lower legs':  '#2ecc71',
  'waist':       '#e91e63',
  'cardio':      '#ff5722',
  'neck':        '#795548',
};

function renderCard(ex) {
  const primaryPart = (ex.bodyParts || [])[0] || '';
  const color = bodyPartColor[primaryPart] || '#8aff5e';

  const card = document.createElement('div');
  card.className = 'card';

  // Static placeholder — no GIF in the grid
  const cardImg = document.createElement('div');
  cardImg.className = 'card-img card-placeholder';
  cardImg.style.setProperty('--part-color', color);

  const initial = document.createElement('div');
  initial.className = 'placeholder-initial';
  initial.textContent = primaryPart ? primaryPart[0].toUpperCase() : '?';

  const bpLabel = document.createElement('div');
  bpLabel.className = 'placeholder-label';
  bpLabel.textContent = primaryPart || 'exercise';

  cardImg.appendChild(initial);
  cardImg.appendChild(bpLabel);

  // Card body
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const h3 = document.createElement('h3');
  h3.textContent = ex.name.replace(/\b\w/g, c => c.toUpperCase());

  const tags = document.createElement('div');
  tags.className = 'tags';
  [...(ex.bodyParts || []), ...(ex.equipments || [])].forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tags.appendChild(span);
  });

  // "Add to workout" button — only shown while creating a workout
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm card-add-btn';
  addBtn.dataset.exerciseId = ex.exerciseId;
  addBtn.style.display = isCreating ? '' : 'none';
  const already = stagedExercises.some(e => e.exerciseId === ex.exerciseId);
  addBtn.textContent = already ? '✓ Added' : '+ Add';
  addBtn.disabled = already;
  addBtn.addEventListener('click', e => {
    e.stopPropagation(); // don't open the modal when clicking Add
    addExerciseToWorkout(ex);
  });

  cardBody.appendChild(h3);
  cardBody.appendChild(tags);
  cardBody.appendChild(addBtn);
  card.appendChild(cardImg);
  card.appendChild(cardBody);

  // Clicking the card (not the Add button) opens the detail modal
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => openModal(ex));

  return card;
}

// ─── Search ───────────────────────────────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();

  const query = queryInput.value.trim();

  // Treat "all selected" the same as "no filter" to avoid redundant API calls
  const totalBp = document.getElementById('bodyPartPills').querySelectorAll('.filter-option:not(.filter-option-all)').length;
  const totalEq = document.getElementById('equipmentPills').querySelectorAll('.filter-option:not(.filter-option-all)').length;
  const bps = (selectedBodyParts.size === 0 || selectedBodyParts.size === totalBp) ? [] : [...selectedBodyParts];
  const eqs = (selectedEquipments.size === 0 || selectedEquipments.size === totalEq) ? [] : [...selectedEquipments];

  if (!query && bps.length === 0 && eqs.length === 0) {
    resultsCount.textContent = 'Enter a name, muscle group, or equipment to search.';
    return;
  }

  resultsCount.textContent = 'Searching…';
  resultsGrid.innerHTML = '';

  try {
    // [null] sentinel lets the loop always run at least once when no filter is active,
    // so we don't have to special-case "no filter selected" before the fetch loop
    const bpTargets = bps.length > 0 ? bps : [null];
    const eqTargets = eqs.length > 0 ? eqs : [null];

    // ExerciseDB accepts only one bodyPart and one equipment per request,
    // so multi-select requires one fetch per (bodyPart × equipment) combination
    const fetches = [];
    for (const bp of bpTargets) {
      for (const eq of eqTargets) {
        const params = new URLSearchParams({ limit: 30 });
        if (query) params.set('name', query);
        if (bp)    params.set('bodyParts', bp);
        if (eq)    params.set('equipments', eq);
        fetches.push(fetch(`/api/exercises?${params}`).then(r => r.json()));
      }
    }

    const results = await Promise.all(fetches);
    // Deduplicate across batches — the same exercise can appear in multiple
    // responses when it matches more than one selected filter combination
    const seen = new Set();
    const exercises = [];
    for (const batch of results) {
      if (Array.isArray(batch)) {
        for (const ex of batch) {
          if (!seen.has(ex.exerciseId)) {
            seen.add(ex.exerciseId);
            exercises.push(ex);
          }
        }
      }
    }

    if (exercises.length === 0) {
      resultsCount.textContent = 'No results found.';
      return;
    }

    resultsCount.textContent = `${exercises.length} result${exercises.length !== 1 ? 's' : ''}`;
    exercises.forEach(ex => resultsGrid.appendChild(renderCard(ex)));
  } catch (err) {
    resultsCount.textContent = 'Error — please try again.';
    console.error(err);
  }
});
