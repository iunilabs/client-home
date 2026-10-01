// A shared 0–1000 position makes animation notes independent of viewport pixels.
export function createScrollMeter(element) {
  const number = element.querySelector('[data-scroll-number]');
  const percent = element.querySelector('[data-scroll-percent]');
  const pixels = element.querySelector('[data-scroll-pixels]');
  const percentFormat = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pixelFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
  let previous = '';

  return (position, limit) => {
    const current = Math.min(Math.max(position, 0), Math.max(limit, 0));
    const ratio = limit > 0 ? current / limit : 0;
    const marker = Math.round(ratio * 1000);
    const roundedPixels = Math.round(current);
    const key = `${marker}:${roundedPixels}`;
    if (key === previous) return;
    previous = key;
    number.textContent = String(marker).padStart(4, '0');
    percent.textContent = `${percentFormat.format(marker / 10)} %`;
    pixels.textContent = `${pixelFormat.format(roundedPixels)} px`;
  };
}
