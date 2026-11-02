export function initScratchCard(config) {
  const canvas = document.querySelector('#scratch-canvas');
  const card = canvas?.parentElement;
  const reveal = document.querySelector('#reveal-date');
  const date = document.querySelector('.date-revealed');
  const ctx = canvas?.getContext?.('2d', { willReadFrequently: true });
  if (!canvas || !card || !reveal || !date) return;

  const [year, month, day] = config.event.weddingDate.split('-').map(Number);
  date.textContent = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: config.event.timezone
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));

  if (!ctx) {
    reveal.hidden = false;
    return;
  }

  let drawing = false;
  let shown = false;
  let moves = 0;
  let lastPoint = null;

  function paint() {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#b48c42');
    gradient.addColorStop(.35, '#f4e3ad');
    gradient.addColorStop(.68, '#c5a059');
    gradient.addColorStop(1, '#ead59a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < rect.width + rect.height; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - rect.height, rect.height);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(76,54,19,.78)';
    ctx.font = '500 11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.invitation.scratchPrompt.toUpperCase(), rect.width / 2, rect.height / 2 + 4);
    ctx.font = '17px Georgia';
    ctx.fillText('✦', rect.width / 2, rect.height / 2 - 25);
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function scratch(event) {
    if (!drawing || shown) return;
    const point = pointFromEvent(event);
    if (!point) return;

    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const radius = 21 * Math.min(sx, sy);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = radius * 2;
    ctx.beginPath();
    if (lastPoint) ctx.moveTo(lastPoint.x, lastPoint.y);
    else ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    lastPoint = point;
    moves += 1;
    if (moves % 6 === 0 && scratchCoverage() >= config.interactions.scratchRevealThreshold) revealDate();
  }

  function scratchCoverage() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const stepX = Math.max(1, Math.floor(canvas.width / 64));
    const stepY = Math.max(1, Math.floor(canvas.height / 48));
    let total = 0;
    let cleared = 0;
    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        total += 1;
        if (pixels[(y * canvas.width + x) * 4 + 3] < 100) cleared += 1;
      }
    }
    return total ? cleared / total : 0;
  }

  function begin(event) {
    if (shown || (event.button !== undefined && event.button > 0)) return;
    drawing = true;
    lastPoint = null;
    if (event.cancelable) event.preventDefault?.();
    if (event.pointerId !== undefined) canvas.setPointerCapture?.(event.pointerId);
    scratch(event);
  }

  function end() {
    if (!drawing) return;
    drawing = false;
    lastPoint = null;
    if (!shown && moves && scratchCoverage() >= config.interactions.scratchRevealThreshold) revealDate();
  }

  function revealDate() {
    if (shown) return;
    shown = true;
    drawing = false;
    date.classList.add('date-shown');
    canvas.classList.add('scratched');
    reveal.hidden = true;
    if (!sessionStorage.getItem('wedding-date-celebrated')) {
      sessionStorage.setItem('wedding-date-celebrated', '1');
      flowers(card);
    }
  }

  if ('PointerEvent' in window) {
    canvas.addEventListener('pointerdown', begin);
    canvas.addEventListener('pointermove', scratch);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
  } else {
    canvas.addEventListener('mousedown', begin);
    window.addEventListener('mousemove', scratch);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', event => {
      if (event.cancelable) event.preventDefault();
      if (event.touches.length) begin(event.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchmove', event => {
      if (!drawing) return;
      if (event.cancelable) event.preventDefault();
      scratch(event.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchend', end, { passive: true });
    canvas.addEventListener('touchcancel', end, { passive: true });
  }

  if ('ResizeObserver' in window) new ResizeObserver(paint).observe(card);
  else window.addEventListener('resize', paint, { passive: true });
  reveal.addEventListener('click', revealDate);
  paint();
}

function flowers(parent) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'petal-canvas';
  parent.append(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = parent.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(dpr, dpr);
  const colors = ['#c5a059', '#f4e3ad', '#e4a7a4', '#fffaf0'];
  const petals = Array.from({ length: 38 }, () => ({
    x: rect.width / 2, y: rect.height / 2,
    vx: (Math.random() - .5) * 8, vy: (Math.random() - .7) * 8,
    rotation: Math.random() * 6, size: 3 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)], life: 50 + Math.random() * 30
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, rect.width, rect.height);
    petals.forEach(petal => {
      petal.x += petal.vx;
      petal.y += petal.vy;
      petal.vy += .08;
      petal.rotation += .08;
      petal.life -= 1;
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size, petal.size * .55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    if (++frame < 85) requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
}