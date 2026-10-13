/* FitCoach 5K — FASE 1
 * Cargar DESPUÉS del script principal de index.html (justo antes de </body>).
 * Sobrescribe solo lo necesario:
 *   1. Pestaña CALC (paces + zonas FC) y quita esas tarjetas de MÁS.
 *   2. Tarjeta GRIT 100 en el dashboard (run + ruck contra 100 mi de noviembre).
 *   3. Tipo "Ruck" con millas en el registro manual de sesiones.
 */
(function () {
  // ─────────────────────────────────────────────────────────────
  // 2. GRIT 100
  // ─────────────────────────────────────────────────────────────
  const GRIT_TARGET_MI = 100;
  const GRIT_START = '2026-11-01';
  const GRIT_END = '2026-11-30';

  function gritStats() {
    const inRange = (d) => d >= GRIT_START && d <= GRIT_END;
    let run = 0, ruck = 0;
    state.tcxSessions.forEach(s => { if (inRange(s.dateISO)) run += s.totalDistMi || 0; });
    (state.manualSessions || []).forEach(m => {
      if (m.type === 'ruck' && inRange(m.dateISO)) ruck += m.distMi || 0;
    });
    const total = run + ruck;
    const today = todayISO();
    const elapsed = today < GRIT_START ? 0 : today > GRIT_END ? 30 : parseInt(today.slice(8), 10);
    const daysLeft = Math.max(0, 30 - elapsed);
    const remaining = Math.max(0, GRIT_TARGET_MI - total);
    const perDay = daysLeft > 0 ? remaining / daysLeft : 0;
    const expected = GRIT_TARGET_MI * elapsed / 30;
    return { run, ruck, total, remaining, daysLeft, perDay, expected, elapsed };
  }

  function renderGritCard() {
    const es = getLang() === 'es';
    const g = gritStats();
    const pct = Math.min(100, (g.total / GRIT_TARGET_MI) * 100);
    const onPace = g.total >= g.expected;
    const status = g.elapsed === 0
      ? (es ? 'Arranca el 1 de noviembre.' : 'Starts Nov 1.')
      : (onPace
          ? (es ? 'Al día con el ritmo del GRIT.' : 'On pace.')
          : (es ? `Atrasado: deberías ir en ${g.expected.toFixed(1)} mi.`
                : `Behind: should be at ${g.expected.toFixed(1)} mi.`));
    return `
      <div class="card" style="border-left:3px solid var(--coyote);">
        <div class="card-title">GRIT 100 · ${es ? 'NOVIEMBRE' : 'NOVEMBER'}</div>
        <div class="stat-grid">
          <div class="stat-box"><div class="value">${g.total.toFixed(1)}</div><div class="label">${es ? 'mi total' : 'total mi'}</div></div>
          <div class="stat-box"><div class="value">${g.remaining.toFixed(1)}</div><div class="label">${es ? 'faltan' : 'remaining'}</div></div>
          <div class="stat-box"><div class="value">${g.perDay.toFixed(1)}</div><div class="label">${es ? 'mi/día' : 'mi/day'}</div></div>
        </div>
        <div style="height:10px; background:var(--field-surface); border-radius:5px; overflow:hidden; margin:8px 0;">
          <div style="height:100%; width:${pct}%; background:${onPace ? 'var(--olive-bright)' : 'var(--signal-amber)'};"></div>
        </div>
        <p style="font-size:11px; color:var(--paper-dim);">${es
          ? `Correr: ${g.run.toFixed(1)} mi · Ruck: ${g.ruck.toFixed(1)} mi · ${g.daysLeft} días restantes.`
          : `Run: ${g.run.toFixed(1)} mi · Ruck: ${g.ruck.toFixed(1)} mi · ${g.daysLeft} days left.`}</p>
        <p style="font-size:11px; color:${onPace ? 'var(--olive-bright)' : 'var(--signal-amber)'}; margin-top:4px;">${status}</p>
      </div>`;
  }

  // Dashboard: inserta la tarjeta GRIT justo antes de la lista "PRÓXIMAS"
  const _dashOrig = window.renderDashboard;
  window.renderDashboard = function () {
    const html = _dashOrig();
    if (!state.profile) return html;
    const marker = '<div class="sitrep-label">' + t('upcoming_label') + '</div>';
    return html.includes(marker) ? html.replace(marker, renderGritCard() + marker) : html;
  };

  // ─────────────────────────────────────────────────────────────
  // 3. Ruck con millas en el registro manual
  // ─────────────────────────────────────────────────────────────
  window.renderManualSessionForm = function () {
    const es = getLang() === 'es';
    return `
      <div class="card" style="margin-top:10px; background:var(--field-surface);">
        <div class="manual-field-row"><label>${es ? 'Fecha' : 'Date'}</label>
          <input type="date" id="manualSessDate" value="${todayISO()}" style="text-align:right;" /></div>
        <div class="manual-field-row"><label>${es ? 'Tipo' : 'Type'}</label>
          <select id="manualSessType" style="text-align:right;"
            onchange="document.getElementById('ruckDistRow').style.display = this.value === 'ruck' ? 'grid' : 'none'">
            <option value="strength">${es ? 'Fuerza' : 'Strength'}</option>
            <option value="ruck">Ruck (${es ? 'millas' : 'miles'})</option>
            <option value="cardio">${es ? 'Cardio (sin TCX)' : 'Cardio (no TCX)'}</option>
          </select></div>
        <div class="manual-field-row" id="ruckDistRow" style="display:none;"><label>${es ? 'Distancia (mi)' : 'Distance (mi)'}</label>
          <input type="number" id="manualSessDist" step="0.1" min="0" placeholder="4" /></div>
        <div class="manual-field-row"><label>${es ? 'Duración (min)' : 'Duration (min)'}</label>
          <input type="number" id="manualSessDuration" placeholder="60" min="5" max="600" /></div>
        <div class="manual-field-row"><label>${es ? 'FC Promedio (opcional)' : 'Avg HR (optional)'}</label>
          <input type="number" id="manualSessHR" placeholder="120" /></div>
        <div class="form-group" style="margin-top:8px;">
          <label class="form-label" style="margin-bottom:4px;">${es ? 'Notas' : 'Notes'}</label>
          <input type="text" id="manualSessNotes" placeholder="${es ? 'Ej: 4 mi con mochila, plano' : 'E.g. 4 mi with rucksack'}" style="width:100%;" />
        </div>
        <button class="btn btn-primary" style="width:100%; margin-top:12px;" onclick="saveManualSession()">${es ? 'GUARDAR' : 'SAVE'}</button>
      </div>`;
  };

  window.saveManualSession = function () {
    const es = getLang() === 'es';
    const dateISO = document.getElementById('manualSessDate')?.value;
    const type = document.getElementById('manualSessType')?.value;
    const distMi = parseFloat(document.getElementById('manualSessDist')?.value) || 0;
    const durationMin = parseInt(document.getElementById('manualSessDuration')?.value) || 0;
    const avgHR = parseInt(document.getElementById('manualSessHR')?.value) || null;
    const notes = document.getElementById('manualSessNotes')?.value || '';

    if (!dateISO || !durationMin) {
      showToast(es ? '⚠ Fecha y duración requeridas' : '⚠ Date and duration required');
      return;
    }
    if (type === 'ruck' && distMi <= 0) {
      showToast(es ? '⚠ Pon la distancia en millas' : '⚠ Enter distance in miles');
      return;
    }
    if (!state.manualSessions) state.manualSessions = [];
    state.manualSessions.push({ id: 'manual_' + Date.now(), dateISO, type, durationMin, distMi, avgHR, notes });
    saveState();
    manualSessionFormOpen = false;
    render();
    showToast(es ? '✓ SESIÓN REGISTRADA' : '✓ SESSION LOGGED');
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Pestaña CALC + MÁS sin paces/zonas
  // ─────────────────────────────────────────────────────────────
  window.renderCalcView = function () {
    const es = getLang() === 'es';
    return `
      <div class="view-container">
        <div class="sitrep-label">${es ? 'CALCULADORA' : 'CALCULATOR'}</div>
        ${renderPaceReferenceCard()}
        ${renderHRZoneReferenceCard()}
      </div>`;
  };

  window.renderMore = function () {
    return `
      <div class="view-container">
        <div class="sitrep-label">${t('support_systems')}</div>
        <div class="card">
          <div class="card-title">${t('race_strategy_label')}</div>
          <p style="font-size: 12px; color: var(--paper-dim); margin-bottom: 12px;">
            ${state.profile ? `${esc(activeRace()?.name || raceLabelByKey(state.profile.raceDistanceKey || '5k'))} · ${t('race_target_text')} ${fmtRaceTime(activeGoalSec(state.profile, raceMetersByKey(state.profile.raceDistanceKey || '5k')))} ${getLang() === 'es' ? 'el' : 'on'} ${state.profile.raceDateISO}` : '—'}
          </p>
          <button class="btn btn-primary" style="width: 100%;" onclick="generateRaceStrategyPDF()">${t('view_strategy_card')}</button>
        </div>
        ${renderBodyMeasurementsCard()}
        ${renderDataManagementCard()}
        <div class="card">
          <div class="card-title">${t('settings_label')}</div>
          <div style="margin-bottom:12px;">
            <label style="display:block; font-size:12px; color:var(--paper-dim); margin-bottom:4px;">LTHR (bpm)</label>
            <input type="number" id="lthrInput" value="${state.profile?.lthr || 174}" min="120" max="200" style="width:100%; padding:8px; font-size:12px; border:1px solid var(--field-line); border-radius:4px; background:var(--field-surface); color:var(--paper);" onchange="updateLTHR(parseInt(this.value))" />
            <p style="font-size:10px; color:var(--paper-dim); margin-top:4px;">Garmin → ${state.profile?.lthr || 174} bpm · HR zones will update automatically</p>
          </div>
          <label class="checkbox-item">
            <input type="checkbox" ${getLang() === 'es' ? 'checked' : ''} onchange="toggleLang()" />
            <span style="font-size: 14px;">${t('language_label')}: ${getLang() === 'es' ? 'Español' : 'English'}</span>
          </label>
          <button class="btn btn-secondary" style="width: 100%; margin-top: 14px;" onclick="resetApp();">${t('full_reset_btn')}</button>
        </div>
        <div class="card">
          <div class="card-title">${getLang() === 'es' ? 'VERSIÓN' : 'BUILD'}</div>
          <p style="font-size:12px; color:var(--paper-dim); margin-bottom:10px;">
            ${getLang() === 'es' ? 'Versión cargada' : 'Loaded build'}: <strong style="color:var(--paper);">${APP_BUILD} · fase1</strong>
          </p>
          <button class="btn btn-secondary" style="width:100%;" onclick="forceRefreshApp()">
            ${getLang() === 'es' ? 'Forzar actualización' : 'Force refresh'}
          </button>
        </div>
      </div>`;
  };

  // Barra inferior: botón CALC antes de MÁS. Vista CALC dentro de <main>.
  const _shellOrig = window.renderAppShell;
  window.renderAppShell = function () {
    let html = _shellOrig();
    const calcBtn = `<button class="${currentView === 'calc' ? 'active' : ''}" onclick="switchView('calc')"><span class="nav-icon">∑</span><span>CALC</span></button>`;
    html = html.replace(/<button class="[^"]*" onclick="switchView\('more'\)">/, (m) => calcBtn + m);
    const calcView = `<div class="view ${currentView === 'calc' ? 'active' : ''}">${currentView === 'calc' ? renderCalcView() : ''}</div>`;
    return html.replace('</main>', () => calcView + '</main>');
  };

  // Re-render con las nuevas funciones (el script principal ya pintó la pantalla).
  render();
})();
