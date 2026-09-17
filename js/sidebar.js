// ============================================================================
// SIDEBAR CORTINA LIQUID GLASS CON CONTROL DE ACCESO
// Secretaría Municipal - Municipalidad de Quetzaltenango
// v2: Convocatorias separadas en archivo propio
// ============================================================================

const PERMISOS_DEFAULT_SIDEBAR = {
  admin: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'control', recursos: 'control' },
  secretario: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'control', recursos: 'control' },
  juridico: { agendas: 'lectura', actas: 'lectura', acuerdosalc: 'ninguno', acuerdoscon: 'ninguno', expedientes: 'lectura', archivos: 'ninguno', recursos: 'control' },
  oficial: { agendas: 'control', actas: 'control', acuerdosalc: 'ninguno', acuerdoscon: 'ninguno', expedientes: 'control', archivos: 'lectura', recursos: 'lectura' },
  consulta: { agendas: 'lectura', actas: 'lectura', acuerdosalc: 'ninguno', acuerdoscon: 'ninguno', expedientes: 'lectura', archivos: 'ninguno', recursos: 'lectura' }
};

function obtenerSesionActualSidebar() {
  if (typeof obtenerSesionUsuario === 'function') {
    return obtenerSesionUsuario() || {};
  }
  try {
    const raw = sessionStorage.getItem('usuario_sesion') 
             || localStorage.getItem('usuario_sesion') 
             || localStorage.getItem('sesion_activa');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function verificarPermisoModuloSidebar(moduloKey) {
  const sesion = obtenerSesionActualSidebar();
  if (!sesion || !sesion.rol) return false;
  
  const rol = sesion.rol.toLowerCase();
  if (rol === 'admin' || rol === 'secretario') return true;

  const permisosRol = sesion.permisos || PERMISOS_DEFAULT_SIDEBAR[rol] || PERMISOS_DEFAULT_SIDEBAR['consulta'];
  const nivel = permisosRol[moduloKey];

  return nivel === 'lectura' || nivel === 'control';
}

function renderizarSidebar() {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const sesion = obtenerSesionActualSidebar();
  const path = window.location.pathname.toLowerCase();

  const esIndex = path.includes('index.html') || path.endsWith('/');
  const esPerfil = path.includes('perfil.html');
  const esAgendas = path.includes('agendas.html');
  const esConvocatorias = path.includes('convocatorias.html');
  const esActas = path.includes('actas.html');
  const esAcuerdosAlc = path.includes('acuerdos-alcaldia.html');
  const esAcuerdosCon = path.includes('acuerdos-concejo.html');
  const esAcuerdosGen = path.includes('acuerdos.html') || esAcuerdosAlc || esAcuerdosCon;
  const esExpedientes = path.includes('expedientes.html');
  const esRecursos = path.includes('recursos-administrativos.html');
  const esArchivos = path.includes('archivos.html');

  // Módulos de Administración
  const esUsuarios = path.includes('usuarios.html');
  const esRoles = path.includes('roles.html');
  const esAdminGroup = esUsuarios || esRoles;

  const esDespachoGroup = esAgendas || esConvocatorias;

  const puedeVerAgendas = verificarPermisoModuloSidebar('agendas');
  const puedeVerActas = verificarPermisoModuloSidebar('actas');
  const puedeVerAcuerdosAlc = verificarPermisoModuloSidebar('acuerdosalc');
  const puedeVerAcuerdosCon = verificarPermisoModuloSidebar('acuerdoscon');
  const puedeVerExpedientes = verificarPermisoModuloSidebar('expedientes');
  const puedeVerArchivos = verificarPermisoModuloSidebar('archivos');
  const puedeVerRecursos = verificarPermisoModuloSidebar('recursos') || (sesion.usuario || '').toLowerCase().includes('claudia');
  const esAdminGeneral = (sesion.rol || '').toLowerCase() === 'admin';

  container.innerHTML = `
    <!-- BOTÓN HAMBURGUESA MÓVIL -->
    <div class="md:hidden fixed top-4 left-4 z-50">
      <button onclick="toggleSidebarMovil()" class="p-3 bg-slate-950/80 border border-cyan-500/40 text-cyan-300 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-xl">
        <i class="fa-solid fa-bars text-base"></i>
      </button>
    </div>

    <div id="sidebar-overlay" onclick="toggleSidebarMovil()" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 hidden md:hidden"></div>

    <!-- ÁREA SENSIBLE EN BORDE IZQUIERDO -->
    <div id="sidebar-trigger" class="fixed left-0 top-0 bottom-0 w-5 z-50 cursor-pointer flex items-center justify-start group">
      <div class="w-2.5 h-20 bg-cyan-500/40 border border-cyan-400/80 rounded-r-full shadow-[0_0_15px_rgba(6,182,212,0.6)] group-hover:bg-amber-400/80 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.8)] transition-all"></div>
    </div>

    <!-- SIDEBAR PRINCIPAL -->
    <aside id="sidebar-main" style="transform: translateX(-120%);" class="fixed left-4 top-4 bottom-4 w-72 bg-slate-950/95 border border-slate-800/80 backdrop-blur-2xl rounded-3xl z-50 flex flex-col justify-between p-4 shadow-[0_0_40px_rgba(6,182,212,0.25)] transition-transform duration-300 ease-in-out">
      
      <div class="space-y-4 overflow-y-auto pr-1">
        <!-- HEADER MUNICIPAL -->
        <div class="flex items-center space-x-3 pb-3 border-b border-slate-800/80">
          <div class="w-10 h-10 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
            <img src="img/logo.png" alt="Logo" class="w-6 h-6 object-contain">
          </div>
          <div>
            <h1 class="font-black text-xs text-white tracking-wide">Municipalidad</h1>
            <p class="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest">Secretaría Municipal</p>
          </div>
        </div>

        <!-- TARJETA PERFIL USUARIO -->
        <div class="p-2.5 rounded-2xl bg-slate-900/85 border border-cyan-500/30 flex items-center space-x-3 shadow-inner">
          <div class="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-xs overflow-hidden shadow shrink-0">
            ${sesion.foto_url ? `<img src="${sesion.foto_url}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-user"></i>`}
          </div>
          <div class="overflow-hidden">
            <p class="text-xs font-bold text-white truncate">${sesion.nombre_completo || sesion.usuario || 'Usuario'}</p>
            <p class="text-[10px] text-cyan-400 font-semibold truncate">${sesion.puesto || 'Oficial'}</p>
          </div>
        </div>

        <!-- NAVEGACIÓN -->
        <nav class="space-y-1.5 text-xs font-semibold">
          <a href="index.html" class="flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition ${esIndex ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
            <i class="fa-solid fa-chart-line text-sm w-5 text-center"></i>
            <span>Panel Principal</span>
          </a>

          <a href="perfil.html" class="flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition ${esPerfil ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
            <i class="fa-solid fa-id-card text-sm w-5 text-center"></i>
            <span>Mi Perfil & Alertas</span>
          </a>

          ${puedeVerAgendas ? `
            <div class="space-y-1">
              <button onclick="toggleSubmenu('sub-despacho')" class="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition ${esDespachoGroup ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
                <div class="flex items-center space-x-3">
                  <i class="fa-solid fa-folder text-sm w-5 text-center"></i>
                  <span>Despacho de Concejo</span>
                </div>
                <i class="fa-solid fa-chevron-down text-[10px] transition-transform ${esDespachoGroup ? 'rotate-180' : ''}" id="arrow-sub-despacho"></i>
              </button>
              <div id="sub-despacho" class="${esDespachoGroup ? '' : 'hidden'} pl-8 space-y-1 text-[11px]">
                <a href="agendas.html" class="block py-1.5 px-3 rounded-xl ${esAgendas ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-400 hover:text-white'}">Agendas de Concejo</a>
                <a href="convocatorias.html" class="block py-1.5 px-3 rounded-xl ${esConvocatorias ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-400 hover:text-white'}">Convocatorias</a>
              </div>
            </div>
          ` : ''}

          ${puedeVerActas ? `
            <a href="actas.html" class="flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition ${esActas ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
              <i class="fa-solid fa-book-open text-sm w-5 text-center"></i>
              <span>Actas de Concejo</span>
            </a>
          ` : ''}

          ${(puedeVerAcuerdosAlc || puedeVerAcuerdosCon) ? `
            <div class="space-y-1">
              <button onclick="toggleSubmenu('sub-acuerdos')" class="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition ${esAcuerdosGen ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
                <div class="flex items-center space-x-3">
                  <i class="fa-solid fa-file-contract text-sm w-5 text-center"></i>
                  <span>Acuerdos</span>
                </div>
                <i class="fa-solid fa-chevron-down text-[10px] transition-transform ${esAcuerdosGen ? 'rotate-180' : ''}" id="arrow-sub-acuerdos"></i>
              </button>
              <div id="sub-acuerdos" class="${esAcuerdosGen ? '' : 'hidden'} pl-8 space-y-1 text-[11px]">
                ${puedeVerAcuerdosAlc ? `<a href="acuerdos-alcaldia.html" class="block py-1.5 px-3 rounded-xl ${esAcuerdosAlc ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-400 hover:text-white'}">Acuerdos de Alcaldía</a>` : ''}
                ${puedeVerAcuerdosCon ? `<a href="acuerdos-concejo.html" class="block py-1.5 px-3 rounded-xl ${esAcuerdosCon ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-400 hover:text-white'}">Acuerdos de Concejo</a>` : ''}
              </div>
            </div>
          ` : ''}

          ${puedeVerExpedientes ? `
            <a href="expedientes.html" class="flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition ${esExpedientes ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
              <i class="fa-solid fa-diagram-project text-sm w-5 text-center"></i>
              <span>Expedientes</span>
            </a>
          ` : ''}

          ${puedeVerRecursos ? `
            <a href="recursos-administrativos.html" class="flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition ${esRecursos ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
              <i class="fa-solid fa-scale-balanced text-sm w-5 text-center text-cyan-400"></i>
              <span>Recursos Administrativos</span>
            </a>
          ` : ''}

          ${puedeVerArchivos ? `
            <a href="archivos.html" class="flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition ${esArchivos ? 'bg-cyan-950/65 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}">
              <i class="fa-solid fa-boxes-stacked text-sm w-5 text-center"></i>
              <span>Archivo General</span>
            </a>
          ` : ''}

          <!-- SUBMENÚ DESPLEGABLE ADMINISTRACIÓN -->
          ${esAdminGeneral ? `
            <div class="space-y-1 pt-2 border-t border-slate-800/80">
              <button onclick="toggleSubmenu('sub-admin')" class="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition backdrop-blur-xl ${esAdminGroup ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.4)] font-extrabold ring-1 ring-amber-400/30' : 'text-amber-400/90 hover:bg-amber-500/10 hover:text-amber-300 hover:border hover:border-amber-500/30'}">
                <div class="flex items-center space-x-3">
                  <i class="fa-solid fa-user-shield text-sm w-5 text-center text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"></i>
                  <span class="tracking-wide">Administración</span>
                </div>
                <i class="fa-solid fa-chevron-down text-[10px] transition-transform ${esAdminGroup ? 'rotate-180' : ''}" id="arrow-sub-admin"></i>
              </button>
              <div id="sub-admin" class="${esAdminGroup ? '' : 'hidden'} pl-8 space-y-1 text-[11px] pt-1">
                <a href="usuarios.html" class="block py-1.5 px-3 rounded-xl transition ${esUsuarios ? 'text-amber-300 font-extrabold bg-amber-500/20 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:text-amber-200 hover:bg-amber-500/10'}">Gestión de Usuarios</a>
                <a href="roles.html" class="block py-1.5 px-3 rounded-xl transition ${esRoles ? 'text-amber-300 font-extrabold bg-amber-500/20 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:text-amber-200 hover:bg-amber-500/10'}">Roles y Permisos</a>
              </div>
            </div>
          ` : ''}
        </nav>
      </div>

      <!-- TEMAS Y SALIDA -->
      <div class="pt-3 border-t border-slate-800/80 space-y-2">
        <div class="flex items-center justify-between pt-1">
          <p class="text-[9px] text-cyan-400 font-extrabold uppercase tracking-wider">ROL: ${(sesion.rol || 'OFICIAL').toUpperCase()}</p>
          <div class="flex items-center space-x-1.5">
            <button onclick="renderizarSidebar()" title="Actualizar Sidebar" class="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-white transition">
              <i class="fa-solid fa-rotate text-xs"></i>
            </button>
            <button onclick="cerrarSesion()" title="Cerrar Sesión" class="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition">
              <i class="fa-solid fa-right-from-bracket text-xs"></i>
            </button>
          </div>
        </div>
      </div>

    </aside>
  `;

  // ACTIVADORES DE MOUSE
  const trigger = document.getElementById('sidebar-trigger');
  const sidebar = document.getElementById('sidebar-main');

  if (trigger && sidebar) {
    trigger.addEventListener('mouseenter', () => {
      sidebar.style.transform = 'translateX(0)';
    });

    sidebar.addEventListener('mouseleave', () => {
      sidebar.style.transform = 'translateX(-120%)';
    });
  }
}

function toggleSubmenu(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById(`arrow-${id}`);
  if (el) {
    el.classList.toggle('hidden');
    if (arrow) arrow.classList.toggle('rotate-180');
  }
}

function toggleSidebarMovil() {
  const sidebar = document.getElementById('sidebar-main');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    if (sidebar.style.transform === 'translateX(0px)') {
      sidebar.style.transform = 'translateX(-120%)';
      overlay.classList.add('hidden');
    } else {
      sidebar.style.transform = 'translateX(0px)';
      overlay.classList.remove('hidden');
    }
  }
}

// EJECUCIÓN INMEDIATA
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderizarSidebar);
} else {
  renderizarSidebar();
}