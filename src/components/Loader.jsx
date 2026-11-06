// Indicador de carga con forma de rollo de película.
export default function Loader({ text = 'Cargando…', fullScreen = false }) {
  return (
    <div className={fullScreen ? 'loader loader--full' : 'loader'} role="status">
      <span className="loader__reel" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
