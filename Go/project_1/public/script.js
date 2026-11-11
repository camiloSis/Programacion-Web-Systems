const API = '/api';

const TIPOS = {
  aula: 'Aula',
  laboratorio: 'Laboratorio',
  sala_estudio: 'Sala de estudio'
};

const ESTADOS = {
  disponible: 'Disponible',
  mantenimiento: 'Mantenimiento',
  activa: 'Activa',
  cancelada: 'Cancelada'
};

let editandoAmbiente = false;
let editandoReserva = false;
let ambientesCache = [];
let reservasCache = [];
let usuarioActual = null;

function esAdmin() {
  return usuarioActual?.rol === 'admin';
}

/* ================= Helpers ================= */

async function api(ruta, opciones = {}) {
  const res = await fetch(API + ruta, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }
  if (res.status === 401) {
    const appVisible = !document.getElementById('appView').hidden;
    if (appVisible) mostrarLogin();
    throw new Error(json.message || 'Debe iniciar sesión');
  }
  if (!res.ok || json.status === 'fail') {
    throw new Error(json.message || 'Error en la solicitud');
  }
  return json;
}

function toast(mensaje, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = mensaje;
  el.className = 'toast ' + tipo;
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.hidden = true; }, 3500);
}

function escapeHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function hoyISO() {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

function chip(valor) {
  return `<span class="chip ${escapeHtml(valor)}">${escapeHtml(ESTADOS[valor] || TIPOS[valor] || valor)}</span>`;
}

/* ================= Tabs ================= */

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

    if (btn.dataset.tab === 'estadisticas' && esAdmin()) cargarEstadisticas();
    if (btn.dataset.tab === 'reservas') cargarSelectAmbientes();
  });
});

function irA(tab) {
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).click();
}

/* ================= Ambientes ================= */

async function cargarAmbientes() {
  const params = new URLSearchParams();
  const q = document.getElementById('fBuscar').value.trim();
  const tipo = document.getElementById('fTipo').value;
  const estado = document.getElementById('fEstado').value;
  const cap = document.getElementById('fCapacidad').value;
  const edificio = document.getElementById('fEdificio').value.trim();

  if (q) params.set('q', q);
  if (tipo) params.set('tipo', tipo);
  if (estado) params.set('estado', estado);
  if (cap) params.set('capacidad_min', cap);
  if (edificio) params.set('edificio', edificio);

  try {
    const json = await api('/ambientes?' + params.toString());
    renderAmbientes(json.data);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderAmbientes(ambientes) {
  const body = document.getElementById('ambientesBody');
  const empty = document.getElementById('ambientesEmpty');
  ambientesCache = ambientes;

  body.innerHTML = ambientes.map((a, i) => `
    <tr>
      <td>${a.id}</td>
      <td><strong>${escapeHtml(a.nombre)}</strong></td>
      <td>${chip(a.tipo)}</td>
      <td>${a.capacidad}</td>
      <td>${escapeHtml(a.edificio)} - Piso ${a.piso}</td>
      <td>${escapeHtml(a.recursos || '—')}</td>
      <td>${chip(a.estado)}</td>
      ${esAdmin() ? `
      <td class="actions">
        <button class="btn small ghost" onclick="editarAmbiente(${i})">Editar</button>
        <button class="btn small danger" onclick="eliminarAmbiente(${a.id})">Eliminar</button>
      </td>` : ''}
    </tr>`).join('');

  empty.hidden = ambientes.length > 0;
}

function limpiarFiltrosAmbientes() {
  ['fBuscar', 'fTipo', 'fEstado', 'fCapacidad', 'fEdificio'].forEach(id => {
    document.getElementById(id).value = '';
  });
  cargarAmbientes();
}

async function guardarAmbiente(ev) {
  ev.preventDefault();
  const id = document.getElementById('ambienteId').value;
  const cuerpo = {
    nombre: document.getElementById('aNombre').value,
    tipo: document.getElementById('aTipo').value,
    capacidad: Number(document.getElementById('aCapacidad').value),
    edificio: document.getElementById('aEdificio').value,
    piso: Number(document.getElementById('aPiso').value || 0),
    recursos: document.getElementById('aRecursos').value,
    estado: document.getElementById('aEstado').value,
    descripcion: document.getElementById('aDescripcion').value
  };

  try {
    if (editandoAmbiente) {
      await api('/ambientes/' + id, { method: 'PUT', body: JSON.stringify(cuerpo) });
      toast('Ambiente actualizado correctamente', 'success');
    } else {
      await api('/ambientes', { method: 'POST', body: JSON.stringify(cuerpo) });
      toast('Ambiente registrado correctamente', 'success');
    }
    resetFormAmbiente();
    cargarAmbientes();
    cargarSelectAmbientes();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function editarAmbiente(indice) {
  const a = ambientesCache[indice];
  editandoAmbiente = true;
  document.getElementById('ambienteId').value = a.id;
  document.getElementById('aNombre').value = a.nombre;
  document.getElementById('aTipo').value = a.tipo;
  document.getElementById('aCapacidad').value = a.capacidad;
  document.getElementById('aEdificio').value = a.edificio;
  document.getElementById('aPiso').value = a.piso;
  document.getElementById('aRecursos').value = a.recursos;
  document.getElementById('aEstado').value = a.estado;
  document.getElementById('aDescripcion').value = a.descripcion;
  document.getElementById('formAmbienteTitle').textContent = `Editar ambiente #${a.id}`;
  document.getElementById('btnCancelarAmbiente').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormAmbiente() {
  editandoAmbiente = false;
  document.getElementById('ambienteForm').reset();
  document.getElementById('ambienteId').value = '';
  document.getElementById('aPiso').value = 1;
  document.getElementById('formAmbienteTitle').textContent = 'Registrar ambiente';
  document.getElementById('btnCancelarAmbiente').hidden = true;
}

async function eliminarAmbiente(id) {
  if (!confirm('¿Eliminar este ambiente? Esta acción no se puede deshacer.')) return;
  try {
    await api('/ambientes/' + id, { method: 'DELETE' });
    toast('Ambiente eliminado correctamente', 'success');
    cargarAmbientes();
    cargarSelectAmbientes();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ================= Disponibilidad ================= */

async function consultarDisponibilidad(ev) {
  ev.preventDefault();
  const params = new URLSearchParams({
    fecha: document.getElementById('dFecha').value,
    hora_inicio: document.getElementById('dInicio').value,
    hora_fin: document.getElementById('dFin').value
  });
  const tipo = document.getElementById('dTipo').value;
  const cap = document.getElementById('dCapacidad').value;
  if (tipo) params.set('tipo', tipo);
  if (cap) params.set('capacidad_min', cap);

  try {
    const json = await api('/disponibilidad?' + params.toString());
    renderDisponibles(json.data);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderDisponibles(ambientes) {
  const grid = document.getElementById('disponiblesGrid');
  const empty = document.getElementById('disponiblesEmpty');

  grid.innerHTML = ambientes.map(a => `
    <div class="room-card">
      ${chip(a.tipo)}
      <h3>${escapeHtml(a.nombre)}</h3>
      <div class="meta">Capacidad: ${a.capacidad} &bull; ${escapeHtml(a.edificio)} - Piso ${a.piso}</div>
      <div class="recursos">${escapeHtml(a.recursos || 'Sin recursos registrados')}</div>
      <button class="btn primary small" onclick="reservarDesdeDisponibilidad(${a.id})">Reservar</button>
    </div>`).join('');

  empty.hidden = ambientes.length > 0;
}

function reservarDesdeDisponibilidad(id) {
  document.getElementById('rAmbiente').value = String(id);
  document.getElementById('rFecha').value = document.getElementById('dFecha').value;
  document.getElementById('rInicio').value = document.getElementById('dInicio').value;
  document.getElementById('rFin').value = document.getElementById('dFin').value;
  irA('reservas');
  document.getElementById('rEstudiante').focus();
  toast('Complete los datos del estudiante para confirmar la reserva');
}

/* ================= Reservas ================= */

async function cargarSelectAmbientes() {
  try {
    const json = await api('/ambientes');
    const select = document.getElementById('rAmbiente');
    const actual = select.value;
    select.innerHTML = json.data.map(a =>
      `<option value="${a.id}" ${a.estado !== 'disponible' ? 'disabled' : ''}>
         ${escapeHtml(a.nombre)} (${TIPOS[a.tipo]}, ${a.capacidad} cupos)${a.estado !== 'disponible' ? ' - mantenimiento' : ''}
       </option>`).join('');
    if (actual) select.value = actual;
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function cargarReservas() {
  const params = new URLSearchParams();
  const fecha = document.getElementById('gFecha').value;
  const estado = document.getElementById('gEstado').value;
  const codigo = document.getElementById('gCodigo').value.trim();

  if (fecha) params.set('fecha', fecha);
  if (estado) params.set('estado', estado);
  if (codigo) params.set('codigo', codigo);

  try {
    const json = await api('/reservas?' + params.toString());
    renderReservas(json.data);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderReservas(reservas) {
  const body = document.getElementById('reservasBody');
  const empty = document.getElementById('reservasEmpty');
  reservasCache = reservas;

  body.innerHTML = reservas.map((r, i) => `
    <tr>
      <td>${r.id}</td>
      <td>${escapeHtml(r.ambiente_nombre)}</td>
      <td>${escapeHtml(r.estudiante)}</td>
      <td>${escapeHtml(r.codigo)}</td>
      <td>${escapeHtml(r.fecha)}</td>
      <td>${escapeHtml(r.hora_inicio)} - ${escapeHtml(r.hora_fin)}</td>
      <td>${escapeHtml(r.motivo || '—')}</td>
      <td>${chip(r.estado)}</td>
      <td class="actions">
        <button class="btn small ghost" onclick="editarReserva(${i})" ${r.estado === 'cancelada' ? 'disabled' : ''}>Modificar</button>
        <button class="btn small warn" onclick="cancelarReserva(${r.id})" ${r.estado === 'cancelada' ? 'disabled' : ''}>Cancelar</button>
      </td>
    </tr>`).join('');

  empty.hidden = reservas.length > 0;
}

function limpiarFiltrosReservas() {
  ['gFecha', 'gEstado', 'gCodigo'].forEach(id => {
    document.getElementById(id).value = '';
  });
  cargarReservas();
}

async function guardarReserva(ev) {
  ev.preventDefault();
  const id = document.getElementById('reservaId').value;
  const cuerpo = {
    ambiente_id: Number(document.getElementById('rAmbiente').value),
    estudiante: document.getElementById('rEstudiante').value,
    codigo: document.getElementById('rCodigo').value,
    fecha: document.getElementById('rFecha').value,
    hora_inicio: document.getElementById('rInicio').value,
    hora_fin: document.getElementById('rFin').value,
    motivo: document.getElementById('rMotivo').value
  };

  try {
    if (editandoReserva) {
      await api('/reservas/' + id, { method: 'PUT', body: JSON.stringify(cuerpo) });
      toast('Reserva modificada correctamente', 'success');
    } else {
      await api('/reservas', { method: 'POST', body: JSON.stringify(cuerpo) });
      toast('Reserva registrada correctamente', 'success');
    }
    resetFormReserva();
    cargarReservas();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function editarReserva(indice) {
  const r = reservasCache[indice];
  editandoReserva = true;
  document.getElementById('reservaId').value = r.id;
  document.getElementById('rAmbiente').value = String(r.ambiente_id);
  document.getElementById('rEstudiante').value = r.estudiante;
  document.getElementById('rCodigo').value = r.codigo;
  document.getElementById('rFecha').value = r.fecha;
  document.getElementById('rInicio').value = r.hora_inicio;
  document.getElementById('rFin').value = r.hora_fin;
  document.getElementById('rMotivo').value = r.motivo;
  document.getElementById('formReservaTitle').textContent = `Modificar reserva #${r.id}`;
  document.getElementById('btnCancelarReserva').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormReserva() {
  editandoReserva = false;
  document.getElementById('reservaForm').reset();
  document.getElementById('reservaId').value = '';
  document.getElementById('rInicio').value = '08:00';
  document.getElementById('rFin').value = '10:00';
  document.getElementById('rFecha').value = hoyISO();
  document.getElementById('formReservaTitle').textContent = 'Registrar reserva';
  document.getElementById('btnCancelarReserva').hidden = true;
}

async function cancelarReserva(id) {
  if (!confirm('¿Cancelar esta reserva?')) return;
  try {
    await api(`/reservas/${id}/cancelar`, { method: 'PATCH' });
    toast('Reserva cancelada', 'success');
    cargarReservas();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ================= Estadísticas ================= */

async function cargarEstadisticas() {
  if (!esAdmin()) return;
  try {
    const json = await api('/estadisticas');
    renderEstadisticas(json.data);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderEstadisticas(data) {
  const t = data.totales;
  document.getElementById('statCards').innerHTML = `
    <div class="stat-card"><div class="value">${t.ambientes_total}</div><div class="label">Ambientes totales</div></div>
    <div class="stat-card green"><div class="value">${t.ambientes_disponibles}</div><div class="label">Disponibles</div></div>
    <div class="stat-card orange"><div class="value">${t.ambientes_mantenimiento}</div><div class="label">En mantenimiento</div></div>
    <div class="stat-card"><div class="value">${t.reservas_activas}</div><div class="label">Reservas activas</div></div>
    <div class="stat-card red"><div class="value">${t.reservas_canceladas}</div><div class="label">Reservas canceladas</div></div>`;

  const tipoMax = Math.max(1, ...data.por_tipo.map(x => x.cantidad));
  document.getElementById('tipoBars').innerHTML = data.por_tipo.map(x => `
    <div class="bar-row">
      <div class="name">${TIPOS[x.tipo] || escapeHtml(x.tipo)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(x.cantidad / tipoMax) * 100}%"></div></div>
      <div class="bar-value">${x.cantidad}</div>
    </div>`).join('');
  document.getElementById('tipoEmpty').hidden = data.por_tipo.length > 0;

  const usoMax = Math.max(1, ...data.uso_ambientes.map(x => x.horas_reservadas));
  document.getElementById('usoBars').innerHTML = data.uso_ambientes.map(x => `
    <div class="bar-row">
      <div class="name" title="${escapeHtml(x.nombre)}">${escapeHtml(x.nombre)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(x.horas_reservadas / usoMax) * 100}%"></div></div>
      <div class="bar-value">${Number(x.horas_reservadas).toFixed(1)} h</div>
    </div>`).join('');
  document.getElementById('usoEmpty').hidden = data.uso_ambientes.length > 0;

  document.getElementById('fechasBody').innerHTML = data.reservas_por_fecha.map(x => `
    <tr><td>${escapeHtml(x.fecha)}</td><td>${x.cantidad}</td></tr>`).join('');
  document.getElementById('fechasEmpty').hidden = data.reservas_por_fecha.length > 0;
}

/* ================= Sesión y roles ================= */

function mostrarLogin() {
  document.getElementById('appView').hidden = true;
  document.getElementById('loginView').hidden = false;
  document.getElementById('loginPassword').value = '';
  usuarioActual = null;
}

function aplicarRolUI() {
  const admin = esAdmin();

  document.querySelectorAll('.admin-only').forEach(el => { el.hidden = !admin; });

  document.getElementById('userNombre').textContent = usuarioActual.nombre;
  const rolChip = document.getElementById('userRol');
  rolChip.textContent = admin ? 'Administrador' : 'Estudiante';
  rolChip.className = 'chip ' + usuarioActual.rol;

  document.getElementById('reservasScope').textContent = admin ? '' : '(solo tus reservas)';

  irA(admin ? 'ambientes' : 'disponibilidad');
}

function iniciarApp(user) {
  usuarioActual = user;
  document.getElementById('loginView').hidden = true;
  document.getElementById('appView').hidden = false;
  aplicarRolUI();
  cargarAmbientes();
  cargarSelectAmbientes();
  cargarReservas();
}

async function iniciarSesion(ev) {
  ev.preventDefault();
  const errorEl = document.getElementById('loginError');
  errorEl.hidden = true;

  try {
    const json = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        usuario: document.getElementById('loginUsuario').value.trim(),
        password: document.getElementById('loginPassword').value
      })
    });
    iniciarApp(json.data);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
}

async function cerrarSesion() {
  try { await api('/auth/logout', { method: 'POST' }); } catch { /* cookie ya caducada */ }
  mostrarLogin();
}

async function restaurarSesion() {
  try {
    const res = await fetch(API + '/auth/me');
    if (!res.ok) throw new Error('sin sesión');
    const json = await res.json();
    if (json.status !== 'success') throw new Error('sin sesión');
    iniciarApp(json.data);
  } catch {
    mostrarLogin();
  }
}

/* ================= Init ================= */

document.addEventListener('DOMContentLoaded', () => {
  const hoy = hoyISO();
  document.getElementById('dFecha').value = hoy;
  document.getElementById('dFecha').min = hoy;
  document.getElementById('rFecha').value = hoy;
  document.getElementById('rFecha').min = hoy;

  restaurarSesion();
});
