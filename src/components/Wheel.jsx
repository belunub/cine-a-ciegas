import { SLICE_COLORS } from '../lib/wheel';

const SIZE = 300;
const C = SIZE / 2; // centro
const R = 140; // radio

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

function shorten(text, max = 14) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Ruleta dibujada en SVG. Gira con CSS según la prop "rotation".
export default function Wheel({ genres, rotation, spinning, onSpinEnd }) {
  const count = genres.length;
  const slice = count > 0 ? 360 / count : 360;
  const fontSize = count <= 6 ? 15 : count <= 9 ? 13 : 11;

  return (
    <div className="wheel">
      <div className="wheel__pointer" aria-hidden="true" />
      <svg
        className={spinning ? 'wheel__svg is-spinning' : 'wheel__svg'}
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
        <circle cx={C} cy={C} r={R + 6} fill="#141517" />

        {count === 0 && <circle cx={C} cy={C} r={R} fill="#2C3036" />}

        {count === 1 && (
          <g>
            <circle cx={C} cy={C} r={R} fill={SLICE_COLORS[0].fill} />
            <text x={C} y={C - 60} textAnchor="middle" fill={SLICE_COLORS[0].text} fontSize={fontSize}>
              {shorten(genres[0].name)}
            </text>
          </g>
        )}

        {count > 1 &&
          genres.map((genre, i) => {
            const colors = SLICE_COLORS[i % SLICE_COLORS.length];
            const mid = i * slice + slice / 2;
            const [lx, ly] = point(mid, R * 0.6);
            return (
              <g key={genre.id}>
                <path d={slicePath(i * slice, (i + 1) * slice)} fill={colors.fill} stroke="#141517" strokeWidth="1.5" />
                <text
                  x={lx}
                  y={ly}
                  fill={colors.text}
                  fontSize={fontSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid - 90} ${lx} ${ly})`}
                >
                  {shorten(genre.name)}
                </text>
              </g>
            );
          })}

        <circle cx={C} cy={C} r="22" fill="#EFE6D2" stroke="#141517" strokeWidth="3" />
        <circle cx={C} cy={C} r="8" fill="#8E1B1B" />
      </svg>

      {count === 0 && <p className="wheel__empty">Sumen géneros para armar la ruleta</p>}
    </div>
  );
}
