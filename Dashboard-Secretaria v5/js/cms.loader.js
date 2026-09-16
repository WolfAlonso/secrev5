// js/cms-loader.js - Carga dinámica de textos e imágenes desde Supabase

async function cargarCMSPagina() {
  const path = window.location.pathname.split('/').pop() || 'index.html';

  try {
    // 1. Obtener contenidos de la página actual
    const { data: contenidos } = await supabaseClient
      .from('secciones_paginas')
      .select('*')
      .eq('pagina', path)
      .eq('visible', true);

    if (contenidos && contenidos.length > 0) {
      contenidos.forEach(item => {
        const el = document.getElementById(`cms-${item.seccion_key}`);
        if (el) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = item.contenido;
          } else {
            el.innerHTML = item.contenido;
          }
        }
      });
    }

    // 2. Cargar variables globales (logos e institución)
    const { data: configGlobal } = await supabaseClient
      .from('configuracion_sistema')
      .select('*');

    if (configGlobal) {
      configGlobal.forEach(conf => {
        const elementos = document.querySelectorAll(`.cms-global-${conf.clave}`);
        elementos.forEach(el => {
          if (el.tagName === 'IMG') el.src = conf.valor;
          else el.textContent = conf.valor;
        });
      });
    }
  } catch (err) {
    console.warn('Error al cargar elementos CMS:', err);
  }
}

document.addEventListener('DOMContentLoaded', cargarCMSPagina);