import { useState } from 'react';
import { ERA_OPTIONS, RUNTIME_OPTIONS } from '../lib/tmdb';
import { updateGroupFilters } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';

// v3: el grupo elige cuánto tiempo tiene y de qué época quiere la película.
// Se guarda en el documento del grupo (UPDATE), así lo ven todos.
export default function FunctionFilters({ group, disabled }) {
  const notify = useToast();
  const [saving, setSaving] = useState(false);
  const filters = { maxRuntime: 0, era: 'all', ...(group.filters || {}) };

  async function change(key, value) {
    if (filters[key] === value) return;
    setSaving(true);
    try {
      await updateGroupFilters(group.id, { ...filters, [key]: value });
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const isDisabled = disabled || saving;

  return (
    <div className="filters">
      <fieldset className="filter" disabled={isDisabled}>
        <legend>¿Cuánto tiempo tienen?</legend>
        <div className="segmented">
          {RUNTIME_OPTIONS.map((option) => (
            <label key={option.value} className={filters.maxRuntime === option.value ? 'is-on' : ''}>
              <input
                type="radio"
                name={`runtime-${group.id}`}
                checked={filters.maxRuntime === option.value}
                onChange={() => change('maxRuntime', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="filter" disabled={isDisabled}>
        <legend>Época</legend>
        <div className="segmented segmented--two">
          {ERA_OPTIONS.map((option) => (
            <label key={option.value} className={filters.era === option.value ? 'is-on' : ''}>
              <input
                type="radio"
                name={`era-${group.id}`}
                checked={filters.era === option.value}
                onChange={() => change('era', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
