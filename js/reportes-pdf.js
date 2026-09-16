// ============================================================================
// MOTOR GENERAL DE REPORTES PDF - MUNICIPALIDAD DE QUETZALTENANGO
// Carga estricta y exclusiva de img/logo.png con Marca de Agua y Fondo Blanco
// ============================================================================

/**
 * Carga de forma estricta el archivo físico img/logo.png convirtiéndolo a Base64 via Fetch/Blob
 */
async function obtenerLogoOficialRutaFija() {
  try {
    const respuesta = await fetch('img/logo.png');
    if (!respuesta.ok) throw new Error('No se pudo acceder a img/logo.png');
    const blob = await respuesta.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Aviso: No se pudo cargar img/logo.png mediante fetch, intentando método secundario de imagen...', error);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = 'img/logo.png';
    });
  }
}

/**
 * Aplica el membrete de encabezado, marca de agua central y pie de página
 */
function aplicarPlantillaInstitucionalImpresion(doc, logoPNG, tituloReporte, moduloNombre) {
  const totalPaginas = doc.internal.getNumberOfPages();
  const fechaImpresion = new Date().toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' });

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);

    // A. MARCA DE AGUA EN EL CENTRO DE LA HOJA (Solo si cargó img/logo.png)
    if (logoPNG) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.07 })); // Transparencia tenue
      doc.addImage(logoPNG, 'PNG', 45, 85, 120, 120); // Centrado en la página
      doc.restoreGraphicsState();
    }

    // B. LOGO DEL ENCABEZADO (Esquina superior izquierda)
    if (logoPNG) {
      doc.addImage(logoPNG, 'PNG', 12, 8, 18, 18);
    }

    // C. ENCABEZADO INSTITUCIONAL
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MUNICIPALIDAD DE QUETZALTENANGO', 33, 14);

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`SECRETARÍA MUNICIPAL — ${moduloNombre.toUpperCase()}`, 33, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(tituloReporte, 33, 24);

    // LÍNEA DE SEPARACIÓN ENCABEZADO
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(12, 28, 198, 28);

    // D. PIE DE PÁGINA
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(12, 282, 198, 282);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Emisión: ${fechaImpresion} | Secretaría Municipal de Quetzaltenango`, 12, 287);
    doc.text(`Página ${i} de ${totalPaginas}`, 198, 287, { align: 'right' });
  }
}

/**
 * Función Exportadora Principal en PDF
 */
async function generarReporteEstandarPDF({ titulo, modulo, items, auditoriaGetter, nombreArchivo }) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Error: La librería jsPDF no está disponible.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('portrait');

  // Carga exclusiva y directa de img/logo.png
  const logoPNG = await obtenerLogoOficialRutaFija();

  let currentY = 36;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];

    if (idx > 0 && currentY > 210) {
      doc.addPage();
      currentY = 36;
    }

    // Tabla 1: Datos Generales
    doc.autoTable({
      startY: currentY,
      head: [[`REGISTRO No. ${idx + 1}: ${item.codigo || item.id_expediente || item.numero_expediente || item.numero_acta}`, 'INFORMACIÓN OFICIAL']],
      body: item.filasResumen || [],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 8 },
      margin: { left: 12, right: 12 }
    });

    // Tabla 2: Auditoría y Movimientos
    const historial = typeof auditoriaGetter === 'function' ? await auditoriaGetter(item) : [];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 2,
      head: [['Fecha / Hora', 'Evento / Fase', 'Origen / Detalle', 'Destino / Obs.', 'Responsable']],
      body: historial.length > 0 ? historial : [['-', 'Sin registros de auditoría', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fillColor: [255, 255, 255], textColor: [30, 41, 59], fontSize: 7 },
      margin: { left: 12, right: 12 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Estampar Marca de Agua y Membrete usando exclusivamente img/logo.png
  aplicarPlantillaInstitucionalImpresion(doc, logoPNG, titulo, modulo || 'Gestión Documental');

  // Descargar el archivo
  doc.save(`${nombreArchivo || 'Reporte_Secretaria_Municipal'}.pdf`);
}