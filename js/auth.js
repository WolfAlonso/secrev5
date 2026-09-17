// ============================================================================
// SISTEMA DE AUTENTICACIÓN, SESIONES, REALTIME, 10 TEMAS GLOBALES E INACTIVIDAD
// Secretaría Municipal - Municipalidad de Quetzaltenango
// v3: IP en bitácora + notificaciones toast
// ============================================================================

const PERMISOS_DEFAULT_AUTH = {
  admin: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'control' },
  secretario: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'control' },
  oficial: { agendas: 'control', actas: 'control', acuerdosalc: 'control', acuerdoscon: 'control', expedientes: 'control', archivos: 'lectura' },
  consulta: { agendas: 'lectura', actas: 'lectura', acuerdosalc: 'lectura', acuerdoscon: 'lectura', expedientes: 'lectura', archivos: 'lectura' }
};

const BUCKET_DOCUMENTOS = 'documentos-pdf';
const BUCKET_FOTOS = 'fotos-usuarios';

function obtenerClienteSupabase() {
  if (typeof supabaseClient !== 'undefined') return supabaseClient;
  if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  console.error('Error: Cliente Supabase no disponible en auth.js.');
  return null;
}

// ============================================================================
// 1. TEMAS VISUALES
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
// 2. INACTIVIDAD
// ============================================================================
let timerInactividad;
const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000;

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
// 3. REALTIME
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
// 4. SESIÓN Y AUTENTICACIÓN
// ============================================================================
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

function guardarSesionUsuario(datosUsuario) {
  const sesionJSON = JSON.stringify(datosUsuario);
  sessionStorage.setItem('usuario_sesion', sesionJSON);
  localStorage.setItem('usuario_sesion', sesionJSON);
  localStorage.setItem('sesion_activa', sesionJSON);
}

/**
 * Obtiene la IP pública del cliente (con fallback silencioso si falla).
 */
async function obtenerIPPublica() {
  try {
    const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const j = await r.json();
    return j.ip || null;
  } catch (_) {
    return null;
  }
}

/**
 * Registra un evento en la bitácora. Ahora acepta IP opcional.
 */
async function registrarAccesoBitacora(tipo, ip = null) {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.usuario) return;

  const client = obtenerClienteSupabase();
  if (!client) return;

  try {
    const payload = {
      usuario: sesion.usuario,
      tipo_evento: tipo,
      detalle: tipo === 'INICIO_SESION' ? 'Inicio de sesión exitoso en la plataforma' : 'Cierre de sesión voluntario',
      leido: false
    };
    if (ip) payload.ip_address = ip;

    const { error: errBitacora } = await client.from('bitacora_accesos').insert([payload]);
    if (errBitacora) console.error('Error al insertar en bitacora_accesos:', errBitacora);
  } catch (err) {
    console.error('Excepción en registrarAccesoBitacora:', err);
  }
}

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

function verificarSesion() {
  const sesion = obtenerSesionUsuario();
  const esPaginaLogin = window.location.pathname.includes('login.html');
  if (!sesion) {
    if (!esPaginaLogin) window.location.replace('login.html');
    return null;
  }
  if (esPaginaLogin) window.location.replace('index.html');
  return sesion;
}

function tienePermisoLectura(modulo) {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.rol) return false;
  const rol = sesion.rol.toLowerCase();
  if (rol === 'admin' || rol === 'secretario') return true;
  const permisos = sesion.permisos || PERMISOS_DEFAULT_AUTH[rol] || PERMISOS_DEFAULT_AUTH['consulta'];
  const nivel = permisos[modulo];
  return nivel === 'lectura' || nivel === 'control';
}

function tienePermisoControl(modulo) {
  const sesion = obtenerSesionUsuario();
  if (!sesion || !sesion.rol) return false;
  const rol = sesion.rol.toLowerCase();
  if (rol === 'admin' || rol === 'secretario') return true;
  const permisos = sesion.permisos || PERMISOS_DEFAULT_AUTH[rol] || PERMISOS_DEFAULT_AUTH['consulta'];
  return permisos[modulo] === 'control';
}

async function cerrarSesion() {
  try {
    const ipUsuario = await obtenerIPPublica();
    await registrarAccesoBitacora('CIERRE_SESION', ipUsuario);
  } catch (e) {
    console.error('Error durante el cierre de sesión:', e);
  } finally {
    sessionStorage.removeItem('usuario_sesion');
    localStorage.removeItem('usuario_sesion');
    localStorage.removeItem('sesion_activa');
    window.location.replace('login.html');
  }
}

// ============================================================================
// 5. HELPERS DE PDFs (BUCKET documentos-pdf CON CARPETAS)
// ============================================================================

function extraerRutaPDF(rutaOUrl, bucket = BUCKET_DOCUMENTOS) {
  if (!rutaOUrl) return null;
  const s = String(rutaOUrl);
  const marcadores = [
    `/object/public/${bucket}/`,
    `/object/sign/${bucket}/`,
    `/object/authenticated/${bucket}/`
  ];
  for (const m of marcadores) {
    const idx = s.indexOf(m);
    if (idx !== -1) {
      return s.slice(idx + m.length).split('?')[0];
    }
  }
  return s.split('?')[0];
}

async function obtenerUrlFirmadaPDF(rutaOUrl, segundos = 3600) {
  const ruta = extraerRutaPDF(rutaOUrl);
  if (!ruta) return null;
  const client = obtenerClienteSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.storage
      .from(BUCKET_DOCUMENTOS)
      .createSignedUrl(ruta, segundos);
    if (error) { console.error('[PDF] Error firmando URL:', error); return null; }
    return data.signedUrl;
  } catch (e) {
    console.error('[PDF] Excepción firmando URL:', e);
    return null;
  }
}

async function obtenerUrlsFirmadasPDF(listaRutasOUrls, segundos = 3600) {
  if (!listaRutasOUrls || listaRutasOUrls.length === 0) return {};
  const client = obtenerClienteSupabase();
  if (!client) return {};

  const rutas = listaRutasOUrls.map(x => extraerRutaPDF(x)).filter(Boolean);
  if (rutas.length === 0) return {};

  try {
    const { data, error } = await client.storage
      .from(BUCKET_DOCUMENTOS)
      .createSignedUrls(rutas, segundos);
    if (error) { console.error('[PDF] Error firmando URLs en lote:', error); return {}; }

    const mapa = {};
    (data || []).forEach((item, i) => {
      if (item.signedUrl) mapa[rutas[i]] = item.signedUrl;
    });
    return mapa;
  } catch (e) {
    console.error('[PDF] Excepción firmando URLs en lote:', e);
    return {};
  }
}

async function subirPDFDocumento(file, carpeta) {
  if (!file) return null;
  const client = obtenerClienteSupabase();
  if (!client) throw new Error('Cliente Supabase no disponible');

  const nombreLimpio = String(file.name).replace(/\s+/g, '_').replace(/[^\w\.\-]/g, '');
  const ruta = `${carpeta}/${Date.now()}_${nombreLimpio}`;

  const { error } = await client.storage.from(BUCKET_DOCUMENTOS).upload(ruta, file);
  if (error) throw new Error('Error al subir PDF: ' + error.message);
  return ruta;
}

async function subirFotoUsuario(file, usuario) {
  if (!file) return null;
  const client = obtenerClienteSupabase();
  if (!client) throw new Error('Cliente Supabase no disponible');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const nombreArchivo = `foto_${usuario}_${Date.now()}.${ext}`;

  const { error } = await client.storage.from(BUCKET_FOTOS).upload(nombreArchivo, file);
  if (error) throw new Error('Error al subir foto: ' + error.message);

  const { data } = client.storage.from(BUCKET_FOTOS).getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

// ============================================================================
// 6. NOTIFICACIONES TOAST
// ============================================================================
function mostrarNotificacion(mensaje, tipo = 'exito') {
  let contenedor = document.getElementById('toast-container');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toast-container';
    contenedor.className = 'fixed bottom-5 right-5 z-[100] flex flex-col space-y-2 pointer-events-none';
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement('div');
  const esExito = tipo === 'exito';
  const esError = tipo === 'error';

  const borderClass = esExito ? 'border-emerald-500/50 text-emerald-300' : (esError ? 'border-rose-500/50 text-rose-300' : 'border-amber-500/50 text-amber-300');
  const iconClass = esExito ? 'fa-circle-check text-emerald-400' : (esError ? 'fa-circle-xmark text-rose-400' : 'fa-triangle-exclamation text-amber-400');

  toast.className = `pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-950/90 border ${borderClass} backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 transform translate-y-5 opacity-0 text-xs font-bold`;
  toast.innerHTML = `<i class="fa-solid ${iconClass} text-base"></i><span>${mensaje}</span>`;

  contenedor.appendChild(toast);

  setTimeout(() => { toast.classList.remove('translate-y-5', 'opacity-0'); }, 50);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
  aplicarTemaGuardado();
  iniciarControlInactividad();
  const sesion = obtenerSesionUsuario();
  if (sesion && sesion.usuario) {
    if (!sesion.permisos) sincronizarPermisosRol();
    inicializarRealtimeSubscriptions();
  }
});