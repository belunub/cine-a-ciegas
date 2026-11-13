import { useEffect, useState } from 'react';
import { getWatchProviders, logoUrl } from '../lib/tmdb';

// v3: plataformas donde se puede ver la película en Argentina.
// Datos de JustWatch (vía TMDB). Se consultan en el momento porque cambian seguido.
export default function WatchProviders({ tmdbId }) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let active = true;
    getWatchProviders(tmdbId)
      .then((data) => active && setState({ status: 'ok', data }))
      .catch(() => active && setState({ status: 'error', data: null }));
    return () => {
      active = false;
    };
  }, [tmdbId]);

  return (
    <section className="watch" aria-labelledby={`watch-${tmdbId}`}>
      <h4 id={`watch-${tmdbId}`} className="watch__title">Dónde verla en Argentina</h4>

      {state.status === 'loading' && <p className="watch__note">Buscando plataformas…</p>}
      {state.status === 'error' && (
        <p className="watch__note">No pudimos consultar las plataformas. Probá recargar más tarde.</p>
      )}
      {state.status === 'ok' && state.data.groups.length === 0 && (
        <p className="watch__note">Por ahora no está en ninguna plataforma de Argentina.</p>
      )}

      {state.status === 'ok' &&
        state.data.groups.map((group) => (
          <div key={group.key} className="watch__group">
            <span className="watch__label">{group.label}</span>
            <ul className="watch__list">
              {group.items.map((p) => (
                <li key={p.id} title={p.name}>
                  <img src={logoUrl(p.logoPath)} alt={p.name} className="watch__logo" loading="lazy" />
                </li>
              ))}
            </ul>
          </div>
        ))}

      {state.status === 'ok' && state.data.groups.length > 0 && (
        <p className="watch__credit">
          Datos de JustWatch.{' '}
          {state.data.link && (
            <a href={state.data.link} target="_blank" rel="noreferrer">
              Ver todas las opciones
            </a>
          )}
        </p>
      )}
    </section>
  );
}
