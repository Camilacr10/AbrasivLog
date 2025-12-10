// JS/dashboardReportes.js (completo, listo para pegar)

(function () {
  const API_URL = '/backend/dashboardReportes.php';

  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
  );

  const qs = (sel) => document.querySelector(sel);

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      if (!r.ok || !json || json.ok === false) {
        throw new Error((json && json.error) || text || ('HTTP ' + r.status));
      }
      return json;
    } catch {
      throw new Error(text);
    }
  }

  function buildRangeQuery() {
    const from = qs('#from')?.value?.trim();
    const to   = qs('#to')?.value?.trim();
    const p = [];
    if (from) p.push('from=' + encodeURIComponent(from));
    if (to)   p.push('to='   + encodeURIComponent(to));
    return p.length ? '&' + p.join('&') : '';
  }

  // Utilidad segura para asignar texto si el elemento existe
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ====== MÉTRICAS ======  (sin ventasTotales)
  async function cargarMetricas() {
    const res = await fetchJSON(`${API_URL}?q=metrics${buildRangeQuery()}`);
    setText('totalClientes',    res.totalClientes ?? 0);
    setText('totalPedidos',     res.totalPedidos ?? 0);
    setText('totalProveedores', res.totalProveedores ?? 0);
  }

  // ====== TOP PRODUCTOS ======
  let barChart;
  async function cargarTopProductos() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;
    const res = await fetchJSON(`${API_URL}?q=top_products${buildRangeQuery()}`);
    const labels = (res.data || []).map(r => r.nombre);
    const data   = (res.data || []).map(r => Number(r.unidades));
    const ctx = canvas.getContext('2d');
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Unidades Vendidas', data }] },
      options: {
        responsive: true,
        plugins: { legend: { display: true } }
      }
    });
  }

  // ====== CLIENTES FRECUENTES ======
  let donutChart;
  async function cargarClientesFrecuentes() {
    const canvas = document.getElementById('donutChart');
    if (!canvas) return;
    const res = await fetchJSON(`${API_URL}?q=frequent_clients${buildRangeQuery()}`);
    const labels = (res.data || []).map(r => r.nombre);
    const data   = (res.data || []).map(r => Number(r.entregas));
    const ctx = canvas.getContext('2d');
    if (donutChart) donutChart.destroy();
    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#0d6efd', '#ff6384', '#ffcd56', '#4bc0c0', '#ff9f40', '#9966ff']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 18, padding: 14, textAlign: 'left' }
          }
        },
        layout: { padding: 6 }
      }
    });
  }

  // ====== ENTREGAS PENDIENTES ======
  async function cargarEntregasPendientes() {
    const res = await fetchJSON(`${API_URL}?q=pending_deliveries`);
    const tbody = document.querySelector('#reporteEntregas table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!res.data || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted">No hay entregas pendientes</td></tr>`;
      return;
    }
    for (const r of res.data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${safe(r.cliente)}</td>
        <td>${safe(r.producto)}</td>
        <td>${safe(r.fecha)}</td>
        <td><span class="badge bg-warning text-dark"><i class="fas fa-hourglass-half me-1"></i>${safe(r.estado)}</span></td>
      `;
      tbody.appendChild(tr);
    }
  }

  // ====== TOP PROVEEDORES ======  (agrega data-score para PDF)
  async function cargarTopProveedores() {
    const res = await fetchJSON(`${API_URL}?q=top_suppliers`);
    const tbody = document.querySelector('#reporteProveedores table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!res.data || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-muted">Sin datos</td></tr>`;
      return;
    }
    const renderStars = (score) => {
      const s = Math.max(0, Math.min(5, Number(score || 0)));
      const full = Math.floor(s);
      const half = (s - full) >= 0.5 ? 1 : 0;
      const empty = 5 - full - half;
      return `${'<i class="fas fa-star text-warning"></i>'.repeat(full)}${
              half ? '<i class="fas fa-star-half-alt text-warning"></i>' : ''}${
              '<i class="far fa-star text-warning"></i>'.repeat(empty)}`;
    };
    for (const r of res.data) {
      const score = Number(r.calificacion ?? 0);
      const tr = document.createElement('tr');
      tr.className = 'text-center';
      tr.innerHTML = `
        <td>${safe(r.proveedor)}</td>
        <td data-score="${score}">${renderStars(score)}</td>
        <td>${safe(r.ultimo_pedido || '—')}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // ====== RECARGAR TODO ======
  async function recargarTodo() {
    await Promise.all([
      cargarMetricas(),
      cargarTopProductos(),
      cargarClientesFrecuentes(),
      cargarEntregasPendientes(),
      cargarTopProveedores()
    ]).catch(err => console.error(err));
  }

  // ====== EVENTOS ======
  document.addEventListener('DOMContentLoaded', () => {
    qs('#btnFiltrar')?.addEventListener('click', recargarTodo);
    qs('#btnLimpiar')?.addEventListener('click', () => {
      if (qs('#from')) qs('#from').value = '';
      if (qs('#to')) qs('#to').value = '';
      recargarTodo();
    });
    recargarTodo();
  });


  //Se pone variable global para que se use en lo de sesion
  window.cargarMetricas = cargarMetricas;
})();

(function () {
  // Exporta tablas a PDF mostrando "Calificación" como "X / 5" usando data-score
  window.descargarReporteLimpio = function ({ id, filename, title, orientation = 'landscape' }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation });

    const logo = new Image();
    logo.src = '../IMG/logo.png';
    doc.addImage(logo, 'PNG', 12, 8, 16, 16);
    doc.setFontSize(14);
    doc.text('Abrasivos Industriales S.A.', 32, 16);
    doc.setFontSize(11);
    doc.text(title || '', 32, 23);

    const from = (document.querySelector('#from')?.value || '').trim();
    const to   = (document.querySelector('#to')?.value || '').trim();
    const rango = (from || to) ? `Rango: ${from || '—'} a ${to || '—'}` : 'Rango: Todos';
    doc.setFontSize(9);
    doc.text(rango, 32, 29);
    doc.text(`Generado: ${new Date().toLocaleString('es-CR')}`, doc.internal.pageSize.getWidth() - 12, 12, { align: 'right' });

    let y = 38;
    const card = document.getElementById(id);
    const table = card ? card.querySelector('table') : null;
    if (!table) {
      doc.text('No hay datos para exportar.', 12, y);
      doc.save(filename || 'reporte.pdf');
      return;
    }

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
    const bodyTrs = Array.from(table.querySelectorAll('tbody tr'));
    const califIdx = headers.findIndex(h => /calificaci[oó]n/i.test(h)); // índice columna Calificación

    const rowsTds = bodyTrs
      .map(tr => Array.from(tr.querySelectorAll('td')))
      .filter(cols => !(cols.length === 1 && /cargando|sin datos|no hay/i.test(cols[0].innerText)));

    if (rowsTds.length === 0) {
      doc.text('No hay datos para exportar.', 12, y);
      doc.save(filename || 'reporte.pdf');
      return;
    }

    const pageW = doc.internal.pageSize.getWidth();
    const leftX = 12, rightX = pageW - 12;
    const tableW = rightX - leftX;
    const cols = headers.length || (rowsTds[0] ? rowsTds[0].length : 1);
    const colW = tableW / cols;

    // Encabezados
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    for (let c = 0; c < cols; c++) {
      doc.text(headers[c] || '', leftX + c * colW + 1, y);
    }
    y += 6; 
    doc.setDrawColor(200); 
    doc.line(leftX, y, rightX, y); 
    y += 4;
    doc.setFont('helvetica', 'normal');

    // Cuerpo
    const lineHeight = 6, bottomMargin = doc.internal.pageSize.getHeight() - 16;
    rowsTds.forEach((tds) => {
      if (y + lineHeight > bottomMargin) { 
        doc.addPage({ orientation }); 
        y = 16; 
      }
      for (let c = 0; c < cols; c++) {
        let text = (tds[c]?.innerText || '-').trim();

        // Si es la columna Calificación → imprime número "X / 5" desde data-score
        if (c === califIdx) {
          const score = Number(tds[c]?.getAttribute('data-score') ?? NaN);
          if (!Number.isNaN(score)) text = `${score} / 5`;
        }

        doc.text(text, leftX + c * colW + 1, y);
      }
      y += lineHeight;
    });

    // Pie de página
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.text('Abrasivos Industriales S.A.', 12, h - 8);
      doc.text(`Página ${i} de ${total}`, w - 12, h - 8, { align: 'right' });
    }

    doc.save(filename || 'reporte.pdf');
  };
})();


// =============================
//    VERIFICACIÓN DE SESIÓN
// =============================
async function verificarSesionYMostrarUsuario() {
  try {
    const res = await fetch("../backend/login.php?op=me", {
      credentials: "same-origin"
    });

    const me = await res.json();

    if (!me.authenticated) {
      window.location.href = "login.html";
      return;
    }

    const spanUser = document.getElementById("usuarioActual");
    const spanRol  = document.getElementById("usuarioRol");

    if (spanUser) spanUser.textContent = (me.empleado_nombre || me.username);
    if (spanRol)  spanRol.textContent  = "Rol: " + (me.rol || "-");
    const linkCred = document.getElementById("linkCredenciales");
    if (linkCred && me.rol !== "Administrador") {
      linkCred.style.display = "none";
    }

  } catch (err) {
    console.error("Error verificando sesión:", err);
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  verificarSesionYMostrarUsuario();
  cargarMetricas();
});

window.onpageshow = function(event) {
  if (event.persisted) {
    verificarSesionYMostrarUsuario();
    cargarMetricas();
  }
};

async function salir() {
  try {
    await fetch("../backend/login.php?op=logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch (e) { /* ignore */ }

  window.location.href = "login.html";  
}
