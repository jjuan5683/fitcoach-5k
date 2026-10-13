/* FitCoach 5K — FASE 2: ejercicios en tabla
 * Cargar DESPUÉS de fitcoach-fase1.js y del script principal de index.html.
 * Reemplaza:
 *   1. renderStrengthRecCard  → tarjeta "Fuerza de hoy" (Inicio y detalle de sesión)
 *   2. renderStrengthView     → pestaña FUERZA (biblioteca completa)
 * Cada ejercicio es una fila de tabla: nombre (se expande para técnica),
 * series×reps y carga. Usa STRENGTH_LIBRARY y STRENGTH_SCHEDULE del index.
 */
(function () {
  const L = (es, en) => (getLang() === 'es' ? es : en);

  // Una categoría = título + porqué + tabla de ejercicios.
  function strengthTable(catKey) {
    const cat = STRENGTH_LIBRARY[catKey];
    if (!cat) return '';
    return `
      <div style="margin-top:12px;">
        <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--coyote);text-transform:uppercase;margin-bottom:4px;">${tr(cat.name)}</div>
        <p style="font-size:11px;color:var(--paper-dim);margin-bottom:6px;line-height:1.5;">${tr(cat.why)}</p>
        <table class="splits-table">
          <thead>
            <tr>
              <th>${L('Ejercicio', 'Exercise')}</th>
              <th>${L('Series×Reps', 'Sets×Reps')}</th>
              <th>${L('Carga', 'Load')}</th>
            </tr>
          </thead>
          <tbody>
            ${cat.exercises.map(ex => `
              <tr>
                <td style="font-size:12px;">
                  <details>
                    <summary style="cursor:pointer;color:var(--paper);">${ex.name}</summary>
                    <p style="font-size:11px;color:var(--paper-dim);margin-top:6px;line-height:1.5;">→ ${tr(ex.tip)}</p>
                  </details>
                </td>
                <td class="num-cell" style="font-size:11px;white-space:nowrap;">${ex.sets}</td>
                <td style="font-size:10px;color:var(--coyote-dim);">${tr(ex.load)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Tarjeta "Fuerza de hoy" según el tipo de sesión del plan.
  window.renderStrengthRecCard = function (sessionType) {
    const cats = STRENGTH_SCHEDULE[sessionType] || STRENGTH_SCHEDULE.easy;
    const blurb = STRENGTH_DAY_BLURB[sessionType] || STRENGTH_DAY_BLURB.easy;
    if (!cats.length) return '';
    return `
      <div class="card" style="border-left:3px solid var(--olive-bright);">
        <div class="card-title">💪 ${L('FUERZA DE HOY', "TODAY'S STRENGTH")}</div>
        <p style="font-size:11px;color:var(--paper-dim);margin-bottom:4px;line-height:1.4;">${tr(blurb)}</p>
        ${cats.map(strengthTable).join('')}
      </div>`;
  };

  // Pestaña FUERZA: sesión de hoy + biblioteca completa con filtro.
  window.renderStrengthView = function () {
    const catKeys = Object.keys(STRENGTH_LIBRARY);
    const active = (typeof strengthFilter !== 'undefined' && strengthFilter) || 'all';
    const shown = active === 'all' ? catKeys : catKeys.filter(k => k === active);
    const todaySess = state.plan.find(s => s.dateISO === todayISO());

    const chip = (key, label) => `
      <button class="btn-small" style="white-space:nowrap;${active === key ? 'border-color:var(--coyote);color:var(--coyote);' : ''}"
        onclick="setStrengthFilter('${key}')">${label}</button>`;

    return `
      <div class="view-container">
        <div class="sitrep-label">${L('BIBLIOTECA DE FUERZA PARA CORREDORES', 'STRENGTH LIBRARY FOR RUNNERS')}</div>

        ${todaySess ? window.renderStrengthRecCard(todaySess.type) : ''}

        <div style="display:flex;gap:6px;overflow-x:auto;margin:14px 0 4px;padding-bottom:4px;">
          ${chip('all', L('Todos', 'All'))}
          ${catKeys.map(k => chip(k, tr(STRENGTH_LIBRARY[k].name))).join('')}
        </div>

        ${shown.map(k => `<div class="card">${strengthTable(k)}</div>`).join('')}

        <div class="card" style="background:rgba(61,90,31,0.1);border-color:var(--olive);">
          <div class="card-title">${L('PROTOCOLO SEMANAL DE FUERZA', 'WEEKLY STRENGTH PROTOCOL')}</div>
          <p style="font-size:12px;color:var(--paper);line-height:1.6;">
            ${L(
              '2 sesiones de fuerza por semana. Regla de progresión: cuando completes todas las series con buena forma, sube la carga un paso. Si la forma se rompe, baja la carga.',
              '2 strength sessions per week. Progression rule: when you complete all sets with good form, increase the load one step. If form breaks down, drop the load.'
            )}
          </p>
        </div>
      </div>`;
  };

  // Vuelve a pintar la pantalla con las nuevas funciones.
  if (typeof render === 'function') render();
})();
