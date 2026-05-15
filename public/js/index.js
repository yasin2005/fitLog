const toTitleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());

function buildTags(el, items) {
  el.innerHTML = '';
  items.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    el.appendChild(span);
  });
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const form        = document.getElementById('searchForm');
const queryInput  = document.getElementById('searchQuery');
const resultsCount = document.getElementById('resultsCount');
const resultsGrid  = document.getElementById('resultsGrid');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// tracks which filter values are currently active
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

  // show the count badge only when some (not all) filters are active
  function updateBadge() {
    const total = getOptions().length;
    if (selectedSet.size > 0 && selectedSet.size < total) {
      badge.textContent = selectedSet.size;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // start with every option selected (also used as reset)
  function initSelectAll() {
    selectedSet.clear();
    getOptions().forEach(o => {
      selectedSet.add(o.dataset.value);
      o.classList.add('active');
    });
    selectAllBtn.classList.add('active');
    updateBadge();
  }
  initSelectAll();

  // select or deselect all options together
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

  // prevent clicks inside the panel from closing the dropdown
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

  return { reset: initSelectAll };
}

const { reset: resetBodyParts  } = setupFilterDropdown('bodyPartTrigger',  'bodyPartPanel',  'bodyPartPills',  selectedBodyParts,  'bodyPartBadge',  'clearBodyParts',  'selectAllBodyParts');
const { reset: resetEquipments } = setupFilterDropdown('equipmentTrigger', 'equipmentPanel', 'equipmentPills', selectedEquipments, 'equipmentBadge', 'clearEquipments', 'selectAllEquipments');

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.filter-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.filter-trigger').forEach(t => t.classList.remove('open'));
});

queryInput.addEventListener('input', () => {
  clearSearchBtn.classList.toggle('hidden', !queryInput.value);
});

clearSearchBtn.addEventListener('click', () => {
  queryInput.value = '';
  resetBodyParts();
  resetEquipments();
  clearSearchBtn.classList.add('hidden');
  resultsGrid.innerHTML = '';
  resultsCount.textContent = 'Search to get started';
});

// Sidebar elements
const sidebarIdle     = document.getElementById('sidebarIdle');
const sidebarCreating = document.getElementById('sidebarCreating');
const startCreateBtn  = document.getElementById('startCreateBtn');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const saveWorkoutBtn  = document.getElementById('saveWorkoutBtn');
const workoutNameInput = document.getElementById('workoutName');
const workoutDescInput = document.getElementById('workoutDesc');
const sidebarExerciseList = document.getElementById('sidebarExerciseList');
const exerciseCountLabel  = document.getElementById('exerciseCount');
const saveErrorEl         = document.getElementById('saveError');

// ─── Workout creator state ─────────────────────────────────────────────────────
let isCreating = false;
let stagedExercises = []; // exercises added to the current workout, cleared on save or cancel

function enterCreatingMode() {
  isCreating = true;
  stagedExercises = [];
  workoutNameInput.value = '';
  workoutDescInput.value = '';
  renderSidebarList();
  sidebarIdle.classList.add('hidden');
  sidebarCreating.classList.remove('hidden');
  // show the Add button inside the popup
  document.getElementById('popupAddSection').classList.remove('hidden');
  // Re-render cards if there are results so Add buttons appear
  refreshCardAddButtons();
}

function exitCreatingMode() {
  isCreating = false;
  stagedExercises = [];
  sidebarCreating.classList.add('hidden');
  sidebarIdle.classList.remove('hidden');
  document.getElementById('popupAddSection').classList.add('hidden');
  refreshCardAddButtons();
}

// re-renders the exercise list in the sidebar
function renderSidebarList() {
  sidebarExerciseList.innerHTML = '';
  exerciseCountLabel.textContent = `(${stagedExercises.length})`;

  if (stagedExercises.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'sidebar-exercise-empty';
    empty.textContent = 'Search for exercises and click Add.';
    sidebarExerciseList.appendChild(empty);
    return;
  }

  stagedExercises.forEach((exercise, i) => {
    const li = document.createElement('li');
    li.className = 'sidebar-exercise-item';

    const topRow = document.createElement('div');
    topRow.className = 'sidebar-exercise-top';

    const name = document.createElement('span');
    name.textContent = toTitleCase(exercise.name);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'sidebar-exercise-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      stagedExercises.splice(i, 1);
      renderSidebarList();
      refreshCardAddButtons();
    });

    topRow.appendChild(name);
    topRow.appendChild(removeBtn);

    // sets/reps inputs — write back to state on every keystroke so the values survive re-renders
    const metaRow = document.createElement('div');
    metaRow.className = 'sidebar-exercise-meta';

    const setsLabel = document.createElement('span');
    setsLabel.className = 'sidebar-exercise-meta-label';
    setsLabel.textContent = 'Sets';

    const setsInput = document.createElement('input');
    setsInput.type = 'number';
    setsInput.min = '1';
    setsInput.max = '99';
    setsInput.value = exercise.sets;
    setsInput.className = 'sidebar-sets-reps';
    setsInput.addEventListener('input', () => {
      stagedExercises[i].sets = Math.max(1, parseInt(setsInput.value) || 1);
    });
    // reset to the clamped value if the user types something invalid
    setsInput.addEventListener('blur', () => { setsInput.value = stagedExercises[i].sets; });

    const repsLabel = document.createElement('span');
    repsLabel.className = 'sidebar-exercise-meta-label';
    repsLabel.textContent = 'Reps';

    const repsInput = document.createElement('input');
    repsInput.type = 'number';
    repsInput.min = '1';
    repsInput.max = '999';
    repsInput.value = exercise.reps;
    repsInput.className = 'sidebar-sets-reps';
    repsInput.addEventListener('input', () => {
      stagedExercises[i].reps = Math.max(1, parseInt(repsInput.value) || 1);
    });
    // same clamp behaviour for reps
    repsInput.addEventListener('blur', () => { repsInput.value = stagedExercises[i].reps; });

    metaRow.appendChild(setsLabel);
    metaRow.appendChild(setsInput);
    metaRow.appendChild(repsLabel);
    metaRow.appendChild(repsInput);

    li.appendChild(topRow);
    li.appendChild(metaRow);
    sidebarExerciseList.appendChild(li);
  });
}

// Adds one exercise to the staged list (called from card or popup Add button)
function addExerciseToWorkout(exercise) {
  if (!stagedExercises.some(e => e.exerciseId === exercise.exerciseId)) {
    stagedExercises.push({
      exerciseId:       exercise.exerciseId,
      name:             exercise.name,
      gifUrl:           exercise.gifUrl,
      targetMuscles:    exercise.targetMuscles    || [],
      bodyParts:        exercise.bodyParts        || [],
      equipments:       exercise.equipments       || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
      instructions:     exercise.instructions     || [],
      sets:             3, // default volume, editable in the sidebar
      reps:             10
    });
    renderSidebarList();
    refreshCardAddButtons();
  }
}

// sync the Add/Added state on every visible card
function refreshCardAddButtons() {
  document.querySelectorAll('.card-add-btn').forEach(btn => {
    const id = btn.dataset.exerciseId;
    const already = stagedExercises.some(e => e.exerciseId === id);
    btn.textContent = already ? '✓ Added' : '+ Add';
    btn.disabled = already || !isCreating;
    btn.style.display = isCreating ? '' : 'none';
  });
}

// Sidebar setup — only runs when the user is logged in and the sidebar exists
if (startCreateBtn) {
  const editDataEl    = document.getElementById('editData');
  const editWorkoutId = editDataEl ? editDataEl.dataset.id : null;

  if (editWorkoutId) {
    const editWorkout = JSON.parse(editDataEl.dataset.workout);
    enterCreatingMode();
    document.querySelector('.sidebar-title').textContent = 'Edit Workout';
    saveWorkoutBtn.textContent  = 'Save Changes';
    cancelCreateBtn.textContent = '← Back';
    workoutNameInput.value = editWorkout.name;
    workoutDescInput.value = editWorkout.description || '';
    (editWorkout.exercises || []).forEach(exercise => {
      stagedExercises.push({ ...exercise, sets: exercise.sets || 3, reps: exercise.reps || 10 });
    });
    renderSidebarList();
  }

  startCreateBtn.addEventListener('click', enterCreatingMode);

  cancelCreateBtn.addEventListener('click', () => {
    if (editWorkoutId) { window.location.href = '/workouts'; }
    else               { exitCreatingMode(); }
  });

  function showSaveError(msg) {
    saveErrorEl.textContent = msg;
    saveErrorEl.classList.remove('hidden');
  }
  function clearSaveError() {
    saveErrorEl.classList.add('hidden');
  }
  workoutNameInput.addEventListener('input', clearSaveError);

  saveWorkoutBtn.addEventListener('click', async () => {
    const name = workoutNameInput.value.trim();
    if (!name) { showSaveError('Please enter a workout name.'); return; }
    if (stagedExercises.length === 0) { showSaveError('Please add at least one exercise.'); return; }
    clearSaveError();

    saveWorkoutBtn.disabled = true;
    saveWorkoutBtn.textContent = 'Saving…';

    const url    = editWorkoutId ? '/workouts/' + editWorkoutId : '/workouts';
    const method = editWorkoutId ? 'PUT' : 'POST';

    try {
      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: workoutDescInput.value.trim(), exercises: stagedExercises })
      });
      const data = await res.json();
      if (data.success) {
        if (editWorkoutId) {
          window.location.href = '/workouts';
        } else {
          exitCreatingMode();
          startCreateBtn.textContent = '✓ Workout saved!';
          setTimeout(() => { startCreateBtn.textContent = '+ Create Workout'; }, 2500);
        }
      } else {
        showSaveError(data.error || 'Save failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      showSaveError('Network error. Please try again.');
    } finally {
      saveWorkoutBtn.disabled = false;
      saveWorkoutBtn.textContent = editWorkoutId ? 'Save Changes' : 'Save Workout';
    }
  });
}

// ─── Popup ────────────────────────────────────────────────────────────────────
let openExercise;

function openPopup(exercise) {
  openExercise = exercise;

  const popupImg = document.getElementById('popupImg');
  popupImg.style.display = 'block';
  popupImg.src = exercise.gifUrl;
  popupImg.alt = exercise.name;
  popupImg.onerror = () => {
    popupImg.style.display = 'none';
    let fallback = document.getElementById('popupImgFallback');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.id = 'popupImgFallback';
      fallback.className = 'popup-img-fallback';
      fallback.textContent = 'No image available';
      popupImg.parentNode.appendChild(fallback);
    }
    fallback.style.display = 'flex';
  };
  const fallback = document.getElementById('popupImgFallback');
  if (fallback) fallback.style.display = 'none';

  document.getElementById('popupName').textContent = toTitleCase(exercise.name);

  const tagsEl = document.getElementById('popupTags');
  buildTags(tagsEl, [...(exercise.bodyParts || []), ...(exercise.equipments || [])]);

  const targetSection = document.getElementById('popupTargetSection');
  if (exercise.targetMuscles && exercise.targetMuscles.length > 0) {
    document.getElementById('popupTarget').textContent = exercise.targetMuscles.join(', ');
    targetSection.style.display = '';
  } else {
    targetSection.style.display = 'none';
  }

  const secondarySection = document.getElementById('popupSecondarySection');
  if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
    document.getElementById('popupSecondary').textContent = exercise.secondaryMuscles.join(', ');
    secondarySection.style.display = '';
  } else {
    secondarySection.style.display = 'none';
  }

  const instrEl = document.getElementById('popupInstructions');
  instrEl.innerHTML = '';
  (exercise.instructions || []).forEach(step => {
    const li = document.createElement('li');
    // some instructions come prefixed with "Step: 1", "Step: 2", etc. — strip that
    li.textContent = step.replace(/^Step:\s*\d+\s*/i, '');
    instrEl.appendChild(li);
  });

  // only show the Add button when the workout builder is open
  const addSection = document.getElementById('popupAddSection');
  const addBtn = document.getElementById('popupAddBtn');
  if (isCreating) {
    addSection.classList.remove('hidden');
    const already = stagedExercises.some(e => e.exerciseId === exercise.exerciseId);
    addBtn.textContent = already ? '✓ Already added' : '+ Add to Workout';
    addBtn.disabled = already;
  } else {
    addSection.classList.add('hidden');
  }

  document.getElementById('popupOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  document.getElementById('popupOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('popupClose').addEventListener('click', closePopup);
document.getElementById('popupOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closePopup();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

// Add to Workout button inside the popup
document.getElementById('popupAddBtn').addEventListener('click', e => {
  addExerciseToWorkout(openExercise);
  e.currentTarget.textContent = '✓ Already added';
  e.currentTarget.disabled = true;
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

function renderCard(exercise) {
  const primaryPart = (exercise.bodyParts || [])[0] || '';
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
  h3.textContent = toTitleCase(exercise.name);

  const tags = document.createElement('div');
  tags.className = 'tags';
  buildTags(tags, [...(exercise.bodyParts || []), ...(exercise.equipments || [])]);

  // "Add to workout" button — only shown while creating a workout
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm card-add-btn';
  addBtn.dataset.exerciseId = exercise.exerciseId;
  addBtn.style.display = isCreating ? '' : 'none';
  const already = stagedExercises.some(e => e.exerciseId === exercise.exerciseId);
  addBtn.textContent = already ? '✓ Added' : '+ Add';
  addBtn.disabled = already;
  addBtn.addEventListener('click', e => {
    e.stopPropagation(); // don't open the popup when clicking Add
    addExerciseToWorkout(exercise);
  });

  cardBody.appendChild(h3);
  cardBody.appendChild(tags);
  cardBody.appendChild(addBtn);
  card.appendChild(cardImg);
  card.appendChild(cardBody);

  // clicking the card (not the Add button) opens the detail popup
  card.addEventListener('click', () => openPopup(exercise));

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
        for (const exercise of batch) {
          if (!seen.has(exercise.exerciseId)) {
            seen.add(exercise.exerciseId);
            exercises.push(exercise);
          }
        }
      }
    }

    if (exercises.length === 0) {
      resultsCount.textContent = 'No results found.';
      return;
    }

    resultsCount.textContent = `${exercises.length} result${exercises.length !== 1 ? 's' : ''}`;
    exercises.forEach(exercise => resultsGrid.appendChild(renderCard(exercise)));
  } catch (err) {
    resultsCount.textContent = 'Error — please try again.';
    console.error(err);
  }
});