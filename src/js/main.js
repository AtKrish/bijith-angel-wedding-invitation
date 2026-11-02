import '../css/style.css';
import { weddingConfig as config } from './config.js';
import { initScratchCard } from './scratch-card.js';
import { initCountdown } from './countdown.js';
import { initRings } from './rings-3d.js';
import { initGallery } from './gallery.js';

const audio = document.querySelector('#background-music');
const audioControls = document.querySelector('#audio-controls');
const playButton = document.querySelector('#audio-toggle');

audio.volume = config.audio.initialVolume;
audio.loop = config.audio.loop;

let ringsStarted = false;
window.startInvitationRings = () => {
  if (ringsStarted) return;
  ringsStarted = true;
  try { initRings(config); } catch (error) { console.warn('3D rings are unavailable.', error); }
};

function syncAudio() {
  const playing = !audio.paused;
  playButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  playButton.setAttribute('aria-pressed', String(playing));
  playButton.classList.toggle('playing', playing);
}
playButton.addEventListener('click', () => audio.paused ? audio.play().then(syncAudio).catch(syncAudio) : (audio.pause(), syncAudio()));

audio.addEventListener('play', syncAudio); audio.addEventListener('pause', syncAudio);

for (const initialize of [
  () => initScratchCard(config),
  () => initCountdown(config),
  () => initGallery()
]) {
  try { initialize(); } catch (error) { console.warn('An invitation interaction could not initialize.', error); }
}
const [weddingYear, weddingMonth, weddingDay] = config.event.weddingDate.split('-').map(Number);
const weddingDate = new Date(Date.UTC(weddingYear, weddingMonth - 1, weddingDay, 12));
const dateParts = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: config.event.timezone }).formatToParts(weddingDate);
const part = type => dateParts.find(value => value.type === type)?.value ?? '';
document.querySelector('#header-date').textContent = `${weddingDay} · ${weddingMonth} · ${weddingYear}`;
document.querySelector('#detail-weekday').textContent = part('weekday');
document.querySelector('#detail-date').textContent = `${part('day')} ${part('month')} ${part('year')}`;
document.querySelector('#footer-date').textContent = `${weddingDay} · ${weddingMonth} · ${weddingYear}`;

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  revealElements.forEach(el => observer.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('visible'));
}
document.body.classList.add('js-ready');

