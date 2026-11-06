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

// Colores de las porciones: fondo y color de texto.
export const SLICE_COLORS = [
  { fill: '#8E1B1B', text: '#EFE6D2' },
  { fill: '#EFE6D2', text: '#1F2226' },
  { fill: '#C2302A', text: '#EFE6D2' },
  { fill: '#2C3036', text: '#EFE6D2' },
  { fill: '#D6A23A', text: '#1F2226' },
];
