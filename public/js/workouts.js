const toTitleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());

const workoutsData = JSON.parse(document.getElementById('workoutsData').dataset.workouts);

// ── Exercise detail popup ─────────────────────────────────────────────
function openExPopup(ex) {
  const img = document.getElementById('exPopupImg');
  img.style.display = 'block';
  img.src = ex.gifUrl || '';
  img.alt = ex.name;
  // Hide the image slot if no GIF is available
  img.onerror = () => { img.style.display = 'none'; };

  document.getElementById('exPopupName').textContent = toTitleCase(ex.name);

  // Build body-part + equipment tag pills
  const tagsEl = document.getElementById('exPopupTags');
  tagsEl.innerHTML = '';
  [...(ex.bodyParts || []), ...(ex.equipments || [])].forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tagsEl.appendChild(span);
  });

  const targetSection = document.getElementById('exPopupTargetSection');
  if (ex.targetMuscles && ex.targetMuscles.length > 0) {
    document.getElementById('exPopupTarget').textContent = ex.targetMuscles.join(', ');
    targetSection.style.display = '';
  } else {
    targetSection.style.display = 'none';
  }

  const secondarySection = document.getElementById('exPopupSecondarySection');
  if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
    document.getElementById('exPopupSecondary').textContent = ex.secondaryMuscles.join(', ');
    secondarySection.style.display = '';
  } else {
    secondarySection.style.display = 'none';
  }

  const instrEl = document.getElementById('exPopupInstructions');
  instrEl.innerHTML = '';
  (ex.instructions || []).forEach(step => {
    const li = document.createElement('li');
    // some instructions come prefixed with "Step: 1", "Step: 2", etc. — strip that
    li.textContent = step.replace(/^Step:\s*\d+\s*/i, '');
    instrEl.appendChild(li);
  });

  document.getElementById('exPopupOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeExPopup() {
  document.getElementById('exPopupOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('exPopupClose').addEventListener('click', closeExPopup);
document.getElementById('exPopupOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeExPopup();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeExPopup(); });

// Wire up click handlers on every exercise row after the DOM is ready
document.querySelectorAll('.workout-ex-item').forEach(item => {
  item.addEventListener('click', () => {
    const w  = workoutsData.find(w => w._id === item.dataset.workoutId);
    const ex = w && w.exercises.find(e => e.exerciseId === item.dataset.exerciseId);
    if (ex) openExPopup(ex);
  });
});
