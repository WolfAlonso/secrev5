// ============================================================================
// SISTEMA DE NOTIFICACIONES - LIQUID GLASS & GESTIÓN DE LECTURA
// ============================================================================

function renderizarBotonNotificaciones() {
  const sesion = typeof obtenerSesionUsuario === 'function' ? obtenerSesionUsuario() : null;
  if (!sesion) return;

  let contenedor = document.getElementById('notif-container');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'notif-container';
    contenedor.className = 'fixed top-4 right-4 z-50 flex items-center space-x-2';
    document.body.appendChild(contenedor);
  }

  contenedor.innerHTML = `
    <!-- BOTÓN NOTIFICACIONES LIQUID GLASS -->
    <div class="relative">
      <button id="btn-notificaciones" onclick="togglePanelNotificaciones()" class="relative bg-slate-900/80 border border-cyan-500/40 text-cyan-300 p-3 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-xl hover:bg-cyan-500/20 hover:text-white transition-all duration-300 group">
        <i class="fa-solid fa-bell text-sm group-hover:scale-110 transition-transform"></i>
        <span id="badge-notif-count" class="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.8)] hidden">0</span>
      </button>

      <!-- PANEL DESPLEGABLE LIQUID GLASS -->
      <div id="panel-notificaciones" class="absolute right-0 mt-3 w-80 bg-slate-950/90 border border-slate-700/80 backdrop-blur-2xl rounded-3xl shadow-[0_0_25px_rgba(6,182,212,0.2)] p-4 text-xs hidden z-50 space-y-3">
        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
          <span class="font-extrabold text-cyan-300 flex items-center"><i class="fa-solid fa-bell-concierge mr-2"></i> Alertas</span>
          <button onclick="marcarTodasLeidas()" class="text-[10px] text-cyan-400 hover:underline font-semibold">Marcar todo leído</button>
        </div>
        <div id="lista-notificaciones" class="space-y-2 max-h-60 overflow-y-auto">
          <p class="text-slate-500 text-center py-4">No hay notificaciones no leídas.</p>
        </div>
      </div>
    </div>
  `;

  cargarNotificacionesBD();
}

function togglePanelNotificaciones() {
  const panel = document.getElementById('panel-notificaciones');
  if (panel) panel.classList.toggle('hidden');
}

async function cargarNotificacionesBD() {
  const sesion = typeof obtenerSesionUsuario === 'function' ? obtenerSesionUsuario() : null;
  const lista = document.getElementById('lista-notificaciones');
  const badge = document.getElementById('badge-notif-count');
  if (!sesion || !lista) return;

  try {
    let htmlNotifs = '';
    
    // Consulta eventos no leídos si es Administrador
    if (sesion.rol === 'admin') {
      const { data: accesos } = await supabaseClient
        .from('bitacora_accesos')
        .select('*')
        .eq('leido', false)
        .order('id', { ascending: false })
        .limit(6);

      if (accesos && accesos.length > 0) {
        badge.textContent = accesos.length;
        badge.classList.remove('hidden');

        htmlNotifs = accesos.map(a => {
          const dt = new Date(a.fecha_hora);
          const horaFmt = dt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
          const esIngreso = a.tipo_evento === 'INICIO_SESION';

          return `
            <div class="p-2.5 rounded-xl bg-slate-900/80 border ${esIngreso ? 'border-emerald-500/30' : 'border-rose-500/30'} flex justify-between items-start space-x-2">
              <div class="flex items-start space-x-2 overflow-hidden">
                <i class="fa-solid ${esIngreso ? 'fa-right-to-bracket text-emerald-400' : 'fa-right-from-bracket text-rose-400'} mt-0.5"></i>
                <div>
                  <p class="font-bold text-white text-[11px]">${a.usuario} ${esIngreso ? 'ingresó' : 'salió'}</p>
                  <p class="text-[9px] text-slate-400">${horaFmt} hrs &bull; Bitácora</p>
                </div>
              </div>
              <button onclick="marcarIndividualLeida(${a.id})" title="Marcar como leído" class="text-slate-500 hover:text-cyan-300 p-1">
                <i class="fa-solid fa-check text-xs"></i>
              </button>
            </div>
          `;
        }).join('');
        lista.innerHTML = htmlNotifs;
      } else {
        badge.classList.add('hidden');
        lista.innerHTML = '<p class="text-slate-500 text-center py-4">Sin novedades pendientes.</p>';
      }
    } else {
      badge.classList.add('hidden');
      lista.innerHTML = '<p class="text-slate-500 text-center py-4">Sin notificaciones de sistema.</p>';
    }
  } catch (err) {
    console.error('Error al cargar notificaciones:', err);
  }
}

async function marcarIndividualLeida(id) {
  try {
    await supabaseClient.from('bitacora_accesos').update({ leido: true }).eq('id', id);
    cargarNotificacionesBD();
    if (typeof cargarCentroNotificacionesPerfil === 'function') cargarCentroNotificacionesPerfil();
  } catch (e) {
    console.error(e);
  }
}

async function marcarTodasLeidas() {
  try {
    await supabaseClient.from('bitacora_accesos').update({ leido: true }).eq('leido', false);
    cargarNotificacionesBD();
    if (typeof cargarCentroNotificacionesPerfil === 'function') cargarCentroNotificacionesPerfil();
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', renderizarBotonNotificaciones);