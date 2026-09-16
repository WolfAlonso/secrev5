// js/cms-bridge.js - Puente de previsualización en tiempo real

// 1. Cargar cambios guardados en Supabase al abrir la página
async function aplicarCambiosCMSIniciales() {
  if (typeof supabaseClient === 'undefined') return;
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

  try {
    const { data } = await supabaseClient
      .from('cms_elementos_pagina')
      .select('*')
      .eq('pagina', paginaActual);

    if (data) {
      data.forEach(item => aplicarCambioEnDOM(item.selector_id, item.contenido, item.estilos));
    }
  } catch (err) {
    console.error('Error al cargar elementos CMS:', err);
  }
}

// 2. Escuchar cambios instantáneos enviados desde el panel de administración (Iframe)
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CMS_LIVE_UPDATE') {
    const { selectorId, contenido, estilos } = event.data;
    aplicarCambioEnDOM(selectorId, contenido, estilos);
  }
});

function aplicarCambioEnDOM(selectorId, contenido, estilos) {
  const el = document.getElementById(selectorId);
  if (!el) return;

  if (contenido !== undefined) {
    if (el.tagName === 'IMG') el.src = contenido;
    else el.innerHTML = contenido;
  }

  if (estilos) {
    if (estilos.visible !== undefined) {
      if (estilos.visible) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
    if (estilos.color) el.style.color = estilos.color;
  }
}

document.addEventListener('DOMContentLoaded', aplicarCambiosCMSIniciales);