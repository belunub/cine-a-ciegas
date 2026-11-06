import { SLICE_COLORS, sliceColor } from '../lib/wheel';

const SIZE = 300;
const C = SIZE / 2; // centro
const R = 128; // radio de las porciones
const RIM = 141; // radio del aro de bombitas
const BULBS = 24;

// Punto en la circunferencia. El ángulo 0 está arriba y crece en sentido horario.
function point(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)];
}

function slicePath(start, end) {
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function shorten(text, max = 12) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// v2: la ruleta tiene dos capas.
//  - Abajo, las porciones, que giran.
//  - Arriba, un aro fijo con bombitas de marquesina y el puntero.
//    Las bombitas titilan en cadena mientras la ruleta gira.
export default function Wheel({ genres, rotation, spinning, winnerIndex, onSpinEnd }) {
  const count = genres.length;
  const slice = count > 0 ? 360 / count : 360;
  const fontSize = count <= 6 ? 15 : count <= 9 ? 13 : 11;

  return (
    <div className={spinning ? 'wheel is-spinning' : 'wheel'}>
      <svg
        className="wheel__disc"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onTransitionEnd={onSpinEnd}
        role="img"
        aria-label={
          count > 0
            ? `Ruleta con ${count} géneros: ${genres.map((g) => g.name).join(', ')}`
            : 'Ruleta vacía'
        }
      >
        {count === 0 && <circle cx={C} cy={C} r={R} className="wheel__blank" />}

        {count === 1 && (
          <g>
            <circle cx={C} cy={C} r={R} fill={SLICE_COLORS[0].fill} />
            <text x={C} y={C - 62} textAnchor="middle" fill={SLICE_COLORS[0].text} fontSize={fontSize}>
              {shorten(genres[0].name)}
            </text>
          </g>
        )}

        {count > 1 &&
          genres.map((genre, i) => {
            const colors = sliceColor(i, count);
            const mid = i * slice + slice / 2;
            const [lx, ly] = point(mid, R * 0.62);
            // En la mitad izquierda giramos el texto 180° para que no quede de cabeza.
            const angle = mid > 180 ? mid + 90 : mid - 90;
            return (
              <g key={genre.id} className={winnerIndex === i ? 'slice is-winner' : 'slice'}>
                <path d={slicePath(i * slice, (i + 1) * slice)} fill={colors.fill} />
                <text
                  x={lx}
                  y={ly}
                  fill={colors.text}
                  fontSize={fontSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${angle} ${lx} ${ly})`}
                >
                  {shorten(genre.name)}
                </text>
              </g>
            );
          })}

        <circle cx={C} cy={C} r="24" className="wheel__hub" />
        <circle cx={C} cy={C} r="9" className="wheel__hub-dot" />
      </svg>

      {/* Aro fijo con bombitas + puntero */}
      <svg className="wheel__rim" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle cx={C} cy={C} r={RIM} className="wheel__rim-ring" />
        {Array.from({ length: BULBS }, (_, i) => {
          const [x, y] = point((360 / BULBS) * i, RIM);
          return <circle key={i} cx={x} cy={y} r="4.2" className={i % 2 ? 'bulb bulb--b' : 'bulb bulb--a'} />;
        })}
        <path d={`M ${C - 13} 2 L ${C + 13} 2 L ${C} 30 Z`} className="wheel__pointer" />
      </svg>

      {count === 0 && <p className="wheel__empty">Sumen géneros para armar la ruleta</p>}
    </div>
  );
}
