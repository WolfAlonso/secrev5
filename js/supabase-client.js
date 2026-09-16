// ============================================================================
// CONEXIÓN CENTRALIZADA A SUPABASE Y NOTIFICACIONES TOAST
// Secretaría Municipal - Municipalidad de Quetzaltenango
// ============================================================================

const SUPABASE_URL = 'https://ynojotdgegfmwueksjma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlub2pvdGRnZWdmbXd1ZWtzam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDEwMjIsImV4cCI6MjEwNTA3NzAyMn0.cPd5_f3529iFvLWJDhkQ_KNanD6D_YLcZkU67MtHAds';

// Inicialización única
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SISTEMA REUTILIZABLE DE NOTIFICACIONES TOAST (LIQUID GLASS)
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
  toast.innerHTML = `
    <i class="fa-solid ${iconClass} text-base"></i>
    <span>${mensaje}</span>
  `;

  contenedor.appendChild(toast);

  // Animación de entrada y salida
  setTimeout(() => {
    toast.classList.remove('translate-y-5', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}