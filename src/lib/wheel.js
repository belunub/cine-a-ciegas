// Calcula cuántos grados tiene que girar la ruleta para que la porción
// "index" quede debajo del puntero (arriba), sumando varias vueltas.
export function rotationFor(index, count, currentRotation) {
  const slice = 360 / count;
  const center = index * slice + slice / 2;
  const jitter = (Math.random() - 0.5) * slice * 0.6; // que no caiga siempre en el centro
  const target = (360 - ((center + jitter) % 360)) % 360;

  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = target - currentMod;
  if (delta < 0) delta += 360;

  return currentRotation + 360 * 5 + delta;
}

// Colores de las porciones (fondo y texto). Alternan terciopelo, papel y tinta
// para que dos porciones vecinas nunca se confundan.
export const SLICE_COLORS = [
  { fill: '#7A1A17', text: '#F1E6CC' },
  { fill: '#F1E6CC', text: '#3A231B' },
  { fill: '#B4302A', text: '#F1E6CC' },
  { fill: '#2B2420', text: '#E9B54F' },
  { fill: '#E9B54F', text: '#3A231B' },
];

// La última porción toca a la primera: si les tocara el mismo color, cambiamos.
export function sliceColor(index, count) {
  const n = SLICE_COLORS.length;
  let i = index % n;
  if (count > 1 && index === count - 1 && i === 0) i = 2;
  return SLICE_COLORS[i];
}
