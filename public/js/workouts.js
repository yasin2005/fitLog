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

const workoutsData = JSON.parse(document.getElementById('workoutsData').dataset.workouts);

// ── Exercise detail popup ─────────────────────────────────────────────
function openExercisePopup(exercise) {
  const img = document.getElementById('exercisePopupImg');
  img.style.display = 'block';
  img.src = exercise.gifUrl || '';
  img.alt = exercise.name;
  // Hide the image slot if no GIF is available
  img.onerror = () => { img.style.display = 'none'; };

  document.getElementById('exercisePopupName').textContent = toTitleCase(exercise.name);

  buildTags(document.getElementById('exercisePopupTags'),
    [...(exercise.bodyParts || []), ...(exercise.equipments || [])]);

  const targetSection = document.getElementById('exercisePopupTargetSection');
  if (exercise.targetMuscles && exercise.targetMuscles.length > 0) {
    document.getElementById('exercisePopupTarget').textContent = exercise.targetMuscles.join(', ');
    targetSection.style.display = '';
  } else {
    targetSection.style.display = 'none';
  }

  const secondarySection = document.getElementById('exercisePopupSecondarySection');
  if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
    document.getElementById('exercisePopupSecondary').textContent = exercise.secondaryMuscles.join(', ');
    secondarySection.style.display = '';
  } else {
    secondarySection.style.display = 'none';
  }

  const instrEl = document.getElementById('exercisePopupInstructions');
  instrEl.innerHTML = '';
  (exercise.instructions || []).forEach(step => {
    const li = document.createElement('li');
    // some instructions come prefixed with "Step: 1", "Step: 2", etc. — strip that
    li.textContent = step.replace(/^Step:\s*\d+\s*/i, '');
    instrEl.appendChild(li);
  });

  document.getElementById('exercisePopupOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeExercisePopup() {
  document.getElementById('exercisePopupOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('exercisePopupClose').addEventListener('click', closeExercisePopup);
document.getElementById('exercisePopupOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeExercisePopup();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeExercisePopup(); });

// Wire up click handlers on every exercise row after the DOM is ready
document.querySelectorAll('.workout-exercise-item').forEach(item => {
  item.addEventListener('click', () => {
    const w  = workoutsData.find(w => w._id === item.dataset.workoutId);
    const exercise = w && w.exercises.find(e => e.exerciseId === item.dataset.exerciseId);
    if (exercise) openExercisePopup(exercise);
  });
});