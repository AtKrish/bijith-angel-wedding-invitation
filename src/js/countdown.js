export function initCountdown(config) {
  const target = Date.parse(config.event.countdownDateTime);
  const ids = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));
  const dateLabel = document.getElementById('wedding-date-label');
  const [year, month, day] = config.event.weddingDate.split('-').map(Number);
  const validDate = year && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  if (validDate) dateLabel.textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: config.event.timezone }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  if (!Number.isFinite(target)) { ids.forEach(el => el.textContent = '—'); return; }
  const update = () => {
    const remain = Math.max(0, target - Date.now());
    const seconds = Math.floor(remain / 1000);
    const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
    ids.forEach((el, i) => el.textContent = String(values[i]).padStart(i ? 2 : 1, '0'));
    if (!remain) { clearInterval(timer); document.getElementById('countdown-passed').textContent = config.event.countdownPassedMessage; document.getElementById('countdown-passed').hidden = false; }
  };
  update(); const timer = setInterval(update, 1000);
}
