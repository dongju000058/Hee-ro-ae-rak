(() => {
  const originalAnimate = animateTargetTo;
  animateTargetTo = function (x, y, duration) {
    const limits = targetLimits();
    const destinationX = clamp(x, 0, limits.maxX);
    const destinationY = clamp(y, Math.min(44, limits.maxY), limits.maxY);
    if (state.stage === 0 && !state.finalCatchable && !document.hidden &&
        Math.hypot(destinationX - targetPosition.x, destinationY - targetPosition.y) > 24) {
      window.ExhibitionSound?.evade();
    }
    originalAnimate(x, y, duration);
  };
  if (!coarsePointer) return;

  const originalDestination = chooseTargetDestination;
  let moveTimer = 0;
  let dodgedAt = -1;
  let skipTouchClick = false;

  function stopMoving() {
    clearTimeout(moveTimer);
    moveTimer = 0;
  }

  function moveAcrossField(duration) {
    const limits = targetLimits();
    const minX = Math.min(12, limits.maxX);
    const maxX = Math.max(minX, limits.maxX - 12);
    const minY = Math.min(52, limits.maxY);
    const maxY = Math.max(minY, limits.maxY - 20);
    const x = targetPosition.x < (minX + maxX) / 2
      ? maxX - Math.random() * (maxX - minX) * .2
      : minX + Math.random() * (maxX - minX) * .2;
    const y = minY + Math.random() * (maxY - minY);
    animateTargetTo(x, y, duration);
  }

  function scheduleMove() {
    stopMoving();
    const count = state.acknowledged;
    if (reducedMotion || count < 2 || count >= 7 || dodgedAt === count) return;
    moveTimer = setTimeout(() => {
      if (state.stage !== 0 || document.hidden || state.acknowledged !== count) return;
      if (systemMessage.classList.contains('show')) {
        scheduleMove();
        return;
      }
      moveAcrossField(Math.max(240, 620 - count * 55));
      scheduleMove();
    }, Math.max(850, 1900 - count * 160));
  }

  chooseTargetDestination = function () {
    stopMoving();
    if (reducedMotion || state.acknowledged < 2 || state.acknowledged >= 7) {
      originalDestination();
      return;
    }
    moveAcrossField(Math.max(240, 620 - state.acknowledged * 55));
    scheduleMove();
  };

  targetButton.addEventListener('pointerdown', event => {
    skipTouchClick = false;
    if (event.pointerType !== 'touch' || !event.isPrimary || reducedMotion ||
        state.stage !== 0 || transitionBusy || state.acknowledged < 4 ||
        state.acknowledged >= 7 || dodgedAt === state.acknowledged) return;
    dodgedAt = state.acknowledged;
    skipTouchClick = true;
    stopMoving();
    clearTimeout(targetRestTimer);
    targetButton.classList.remove('pressed');
    q('#targetCharacter').src = 'assets/characters/anger-03.webp';
    q('#targetSpeech').textContent = '살짝 옆으로!';
    addClickEvidence(event);
    moveAcrossField(210);
  }, { passive: true });

  targetButton.addEventListener('click', event => {
    if (skipTouchClick && event.detail !== 0) {
      skipTouchClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (!stages[0].classList.contains('active') || targetButton.classList.contains('complete')) stopMoving();
  });
  observer.observe(stages[0], { attributes: true, attributeFilter: ['class'] });
  observer.observe(targetButton, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMoving();
    else if (state.stage === 0) scheduleMove();
  });
  addEventListener('pagehide', () => { stopMoving(); observer.disconnect(); });
})();
