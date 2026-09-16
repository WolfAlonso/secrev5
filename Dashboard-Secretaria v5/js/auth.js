// ============================================================================
// SISTEMA DE AUTENTICACIÓN, SESIONES, REALTIME, 10 TEMAS GLOBALES E INACTIVIDAD
// Secretaría Municipal - Municipalidad de Quetzaltenango
// ============================================================================

// Mapa de permisos por defecto según rol
const PERMISOS_DEFAULT_AUTH = {
  admin: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'control' },
  secretario: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'control' },
  oficial: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'lectura' },
  consulta: { agendas: 'lectura', actas: 'lectura', acuerdosalc: 'lectura', acuerdoscon: 'lectura', expedientes: 'lectura', archivos: 'lectura' }
};

/**
 * Obtiene o instancia el cliente activo de Supabase
 */
function obtenerClienteSupabase() {
  if (typeof supabaseClient !== 'undefined') return supabaseClient;
  if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  console.error('Error: Cliente Supabase no disponible en auth.js.');
  return null;
}

// ============================================================================
// 1. MOTOR DE 10 TEMAS VISUALES GLOBALES (SISTEMA DE GRADIENTES DYNAMIC)
// ============================================================================
const TEMAS_CONFIG = {
  azul: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.90))',
  esmeralda: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(15, 23, 42, 0.90))',
  purpura: 'linear-gradient(135deg, rgba(88, 28, 135, 0.95), rgba(15, 23, 42, 0.90))',
  ambar: 'linear-gradient(135deg, rgba(120, 53, 15, 0.95), rgba(15, 23, 42, 0.90))',
  rojo: 'linear-gradient(135deg, rgba(136, 19, 55, 0.95), rgba(15, 23, 42, 0.90))',
  indigo: 'linear-gradient(135deg, rgba(49, 46, 129, 0.95), rgba(15, 23, 42, 0.90))',
  teja: 'linear-gradient(135deg, rgba(19, 78, 74, 0.95), rgba(15, 23, 42, 0.90))',
  rosa: 'linear-gradient(135deg, rgba(131, 24, 67, 0.95), rgba(15, 23, 42, 0.90))',
  carbon: 'linear-gradient(135deg, rgba(24, 24, 27, 0.96), rgba(9, 9, 11, 0.95))',
  obsidiana: 'linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.95))'
};

function aplicarTemaGuardado() {
  const tema = localStorage.getItem('tema_sistema') || 'azul';
  const bgGrad = TEMAS_CONFIG[tema] || TEMAS_CONFIG.azul;
  document.body.style.setProperty('background-image', `${bgGrad}, url('img/bg-login.jpg')`, 'important');
  document.body.style.setProperty('background-attachment', 'fixed', 'important');
  document.body.style.setProperty('background-size', 'cover', 'important');
  document.body.style.setProperty('background-position', 'center', 'important');
}

function cambiarTemaGlobal(nombreTema) {
  if (TEMAS_CONFIG[nombreTema]) {
    localStorage.setItem('tema_sistema', nombreTema);
    aplicarTemaGuardado();
  }
}

// ============================================================================
// 2. DETECCIÓN DE INACTIVIDAD Y AUTO-BLOQUEO
// ============================================================================
let timerInactividad;
const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000; // 15 Minutos

function resetearTimerInactividad() {
  clearTimeout(timerInactividad);
  const sesion = obtenerSesionUsuario();
  const esPaginaLogin = window.location.pathname.includes('login.html');

  if (sesion && sesion.usuario && !esPaginaLogin) {
    timerInactividad = setTimeout(() => {
      alert('Tu sesión se ha cerrado por inactividad prolongada para proteger la información institucional.');
      cerrarSesion();
    }, TIEMPO_INACTIVIDAD_MS);
  }
}

function iniciarControlInactividad() {
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetearTimerInactividad, true);
  });
  resetearTimerInactividad();
}

// ============================================================================
// 3. SUSCRIPCIONES EN TIEMPO REAL (SUPABASE REALTIME)
// ============================================================================
function inicializarRealtimeSubscriptions() {
  const client = obtenerClienteSupabase();
  if (!client) return;

  client
    .channel('realtime-sistema-general')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bitacora_accesos' }, () => {
      if (typeof cargarNotificacionesBD === 'function') cargarNotificacionesBD();
      if (typeof cargarCentroNotificacionesPerfil === 'function') cargarCentroNotificacionesPerfil();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'roles' }, () => {
      sincronizarPermisosRol();
    })
    .subscribe();
}

// ============================================================================
// 4. FUNCIONES CORE DE AUTENTICACIÓN Y SESIÓN (ESTANDARIZADAS)
// ============================================================================

/**
 * Retorna los datos de la sesión activa buscando dinámicamente en todas las fuentes
 */
function obtenerSesionUsuario() {
  try {
    const raw = sessionStorage.getItem('usuario_sesion') 
             || localStorage.getItem('usuario_sesion') 
             || localStorage.getItem('sesion_activa');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && parsed.usuario) ? parsed : null;
  } catch (e) {
    return null;
  }
}

/**
 * Guarda el objeto de sesión de forma síncrona en todas las claves del navegador
 */
function guardarSesionUsuario(datosUsuario) {
  const sesionJSON = JSON.stringify(datosUsuario);
  sessionStorage.setItem('usuario_sesion', sesionJSON);
  localStorage.setItem('usuario_sesion', sesionJSON);
  localStorage.setItem('sesion_activa', sesionJSON);
}

/**
 * Registra eventos de entrada (INICIO_SESION) y salida (CIERRE_SESION) en la bitácora
 */
async function registrarAccesoBitacora(tipo) {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.usuario) return;

  const client = obtenerClienteSupabase();
  if (!client) return;

  try {
    const { error: errBitacora } = await client.from('bitacora_accesos').insert([{
      usuario: sesion.usuario,
      tipo_evento: tipo,
      detalle: tipo === 'INICIO_SESION' ? 'Inicio de sesión exitoso en la plataforma' : 'Cierre de sesión voluntario',
      leido: false
    }]);

    if (errBitacora) console.error('Error al insertar en bitacora_accesos:', errBitacora);

    if (tipo === 'INICIO_SESION') {
      const { error: errUsuario } = await client.from('usuarios').update({
        ultima_conexion: new Date().toISOString()
      }).eq('usuario', sesion.usuario);

      if (errUsuario) console.error('Error al actualizar ultima_conexion:', errUsuario);
    }
  } catch (err) {
    console.error('Excepción en registrarAccesoBitacora:', err);
  }
}

/**
 * Sincroniza y carga en la sesión activa los permisos dinámicos del rol
 */
async function sincronizarPermisosRol() {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.rol) return;

  const client = obtenerClienteSupabase();
  if (!client) return;

  try {
    const { data: rolData, error } = await client
      .from('roles')
      .select('permisos')
      .eq('nombre', sesion.rol.toLowerCase())
      .maybeSingle();

    if (!error && rolData && rolData.permisos) {
      sesion.permisos = rolData.permisos;
      guardarSesionUsuario(sesion);
    } else {
      const rolKey = sesion.rol.toLowerCase();
      sesion.permisos = PERMISOS_DEFAULT_AUTH[rolKey] || PERMISOS_DEFAULT_AUTH['consulta'];
      guardarSesionUsuario(sesion);
    }
  } catch (err) {
    console.error('Error al sincronizar permisos de rol:', err);
  }
}

/**
 * Verifica la existencia de sesión activa local y redirige según corresponda
 */
function verificarSesion() {
  const sesion = obtenerSesionUsuario();
  const esPaginaLogin = window.location.pathname.includes('login.html');

  if (!sesion) {
    if (!esPaginaLogin) {
      window.location.replace('login.html');
    }
    return null;
  }

  if (esPaginaLogin) {
    window.location.replace('index.html');
  }

  return sesion;
}

/**
 * Valida si el usuario tiene permisos de lectura
 */
function tienePermisoLectura(modulo) {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.rol) return false;
  
  const rol = sesion.rol.toLowerCase();
  if (rol === 'admin' || rol === 'secretario') return true;

  const permisos = sesion.permisos || PERMISOS_DEFAULT_AUTH[rol] || PERMISOS_DEFAULT_AUTH['consulta'];
  const nivel = permisos[modulo];

  return nivel === 'lectura' || nivel === 'control';
}

/**
 * Valida si el usuario tiene nivel de Control / Edición
 */
function tienePermisoControl(modulo) {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.rol) return false;
  
  const rol = sesion.rol.toLowerCase();
  if (rol === 'admin' || rol === 'secretario') return true;

  const permisos = sesion.permisos || PERMISOS_DEFAULT_AUTH[rol] || PERMISOS_DEFAULT_AUTH['consulta'];
  const nivel = permisos[modulo];

  return nivel === 'control';
}

/**
 * Cierra la sesión activa limpiando todas las fuentes de almacenamiento
 */
async function cerrarSesion() {
  try {
    await registrarAccesoBitacora('CIERRE_SESION');
  } catch (e) {
    console.error('Error durante el cierre de sesión:', e);
  } finally {
    sessionStorage.removeItem('usuario_sesion');
    localStorage.removeItem('usuario_sesion');
    localStorage.removeItem('sesion_activa');
    window.location.replace('login.html');
  }
}

// INICIALIZACIÓN AUTOMÁTICA AL CARGAR EL DOM
document.addEventListener('DOMContentLoaded', () => {
  aplicarTemaGuardado();
  iniciarControlInactividad();
  
  const sesion = obtenerSesionUsuario();
  if (sesion && sesion.usuario) {
    if (!sesion.permisos) sincronizarPermisosRol();
    inicializarRealtimeSubscriptions();
  }
});