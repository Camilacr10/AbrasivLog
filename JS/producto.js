document.addEventListener('DOMContentLoaded', async () => {
  const NO_IMAGE_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#f2f2f2"/>
      <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM5 5h14v10.5l-3.5-3.5-3 3-2-2L5 18V5Zm2.5 3.5A1.5 1.5 0 1 0 9 7a1.5 1.5 0 0 0-1.5 1.5Z" fill="#999"/>
      <path d="M5 19h14" stroke="#ccc"/>
      <path d="M7 17l10-10" stroke="#999" stroke-width="1.2"/>
    </svg>
  `);

  const me = await verificarSesionYMostrarUsuario();
  if (!me || !me.authenticated) {
    window.location.href = "login.html";
    return;
  }

  const $   = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' })
                     .format(Number(n || 0));
  const qs  = new URLSearchParams(location.search);
  const codigoURL = qs.get('codigo');
  const catURL    = qs.get('cat');

  const vLista   = $('vista-lista');
  const vDetalle = $('vista-detalle');

  if (catURL && !codigoURL) {
    activarLista(catURL);
    return;
  }
  if (!codigoURL && !catURL) {
    return failDetalle('Falta id o codigo en la URL.');
  }

  if (vDetalle) vDetalle.style.display = '';
  if (vLista)   vLista.style.display   = 'none';

  const volver = $('volver-link');
  if (volver) {
    if (catURL) {
      volver.href = `producto.html?cat=${encodeURIComponent(catURL)}`;
    } else if (document.referrer.includes('producto.html?cat=')) {
      volver.addEventListener('click', (e) => { e.preventDefault(); history.back(); });
    } else {
      volver.href = 'index.html#producto';
    }
  }

  try {
    const url = `../backend/producto_detalle.php?codigo=${encodeURIComponent(codigoURL)}${catURL ? '&cat=' + encodeURIComponent(catURL) : ''}`;
    const r = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    const t = await r.text();
    let json;
    try { json = JSON.parse(t); } catch { throw new Error(t); }
    if (!json.ok) throw new Error(json.error || 'Error en la API');

    const p = json.data;
    renderDetalle(p);

    const slug = p.categoria_slug || catURL || '';
    if (slug && p.codigo) setupPrevNext(slug, p.codigo);
  } catch (e) {
    failDetalle(e.message);
  }

  function renderDetalle(p) {
    const imgDetalle = $('prod-img');
    if (imgDetalle) {
      imgDetalle.src = p.imagen_path ? p.imagen_path : NO_IMAGE_SVG;
      imgDetalle.onerror = function () {
        this.onerror = null;
        this.src = NO_IMAGE_SVG;
      };
    }

    $('prod-nombre').textContent     = p.nombre || '—';
    $('prod-codigo').textContent     = p.codigo || '—';
    $('prod-categoria').textContent  = p.categoria || '—';
    $('prod-existencia').textContent = parseInt(p.existencia ?? 0);
    $('prod-detalle').textContent    = p.detalle || '—';

    const precioBase   = Number(p.precio_base ?? 0);
    const ivaPct       = Number(p.porcentaje_iva ?? 0);
    const ivaColones   = Number(p.iva ?? 0);
    const descPct      = Number(p.porcentaje_descuento ?? 0);
    const descColones  = (precioBase * descPct) / 100;
    const precioFinal  = Number(p.precio_final ?? 0);

    $('prod-precio-final').textContent = fmt(precioFinal);
    $('precio-unitario').textContent   = fmt(precioBase);
    $('precio-descuento').textContent  = fmt(descColones);
    $('precio-iva-monto').textContent  = fmt(ivaColones);
    $('precio-iva-pct').textContent    = `${ivaPct}%`;
    $('precio-final').textContent      = fmt(precioFinal);

    const load = $('estado-carga');
    if (load) load.style.display = 'none';
  }

  async function setupPrevNext(slug, currentCode) {
    const prev = $('btn-prev');
    const next = $('btn-next');
    if (!prev || !next) return;

    const disable = (a) => {
      a.classList.add('disabled');
      a.setAttribute('aria-disabled', 'true');
      a.style.pointerEvents = 'none';
      a.href = '#';
    };
    const enable = (a, href) => {
      a.classList.remove('disabled');
      a.removeAttribute('aria-disabled');
      a.style.pointerEvents = '';
      a.href = href;
    };

    try {
      const r = await fetch(`../backend/categoria.php?cat=${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const t = await r.text();
      const j = JSON.parse(t);
      if (!j.ok) throw new Error(j.error || 'Error al cargar la categoría');
      const list = (j.data || []).filter(x => x && x.codigo);

      if (!list.length) {
        disable(prev);
        disable(next);
        return;
      }

      const idx = Math.max(0, list.findIndex(x => x.codigo === currentCode));
      const prevIdx = idx > 0 ? idx - 1 : null;
      const nextIdx = idx < list.length - 1 ? idx + 1 : null;

      if (prevIdx !== null) {
        enable(prev, `producto.html?codigo=${encodeURIComponent(list[prevIdx].codigo)}&cat=${encodeURIComponent(slug)}`);
      } else {
        disable(prev);
      }

      if (nextIdx !== null) {
        enable(next, `producto.html?codigo=${encodeURIComponent(list[nextIdx].codigo)}&cat=${encodeURIComponent(slug)}`);
      } else {
        disable(next);
      }
    } catch (err) {
      console.error(err);
      disable(prev);
      disable(next);
    }
  }

  function failDetalle(msg) {
    const load = $('estado-carga');
    if (load) load.style.display = 'none';

    const ebox = $('estado-error');
    if (ebox) {
      ebox.style.display = 'block';
      ebox.textContent = msg;
    }
    console.error(msg);
  }

  async function activarLista(slug) {
    if (vLista)   vLista.style.display   = '';
    if (vDetalle) vDetalle.style.display = 'none';

    const bc = $('breadcrumb-cat');
    const titulo = $('titulo-categoria');
    const load = $('estado-carga-lista');
    const errb = $('estado-error-lista');
    const grid = $('grid-categoria');

    if (errb) errb.style.display = 'none';
    if (load) load.style.display = '';

    try {
      const r = await fetch(`../backend/categoria.php?cat=${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const t = await r.text();
      const j = JSON.parse(t);
      if (!j.ok) throw new Error(j.error || 'Error en la API');

      const list = j.data || [];
      if (bc) bc.textContent = `Categoría: ${list[0]?.categoria ?? slug}`;
      if (titulo) titulo.textContent = `Productos en ${list[0]?.categoria ?? slug}`;

      if (!list.length) {
        if (grid) grid.innerHTML = `<div class="col-12 text-muted">Sin productos en esta categoría.</div>`;
        if (load) load.style.display = 'none';
        return;
      }

      if (grid) grid.innerHTML = list.map(p => cardProducto(p, slug)).join('');
      if (load) load.style.display = 'none';

    } catch (e) {
      console.error(e);
      if (load) load.style.display = 'none';
      if (errb) {
        errb.style.display = 'block';
        errb.textContent = e.message;
      }
    }
  }

  function cardProducto(p, slug) {
    const img = p.imagen_path ? p.imagen_path : NO_IMAGE_SVG;
    const nombre = escapeHTML(p.nombre || '');
    const codigo = encodeURIComponent(p.codigo || '');
    const href = `producto.html?codigo=${codigo}&cat=${encodeURIComponent(slug)}`;
    const precio = fmt(p.precio_final ?? p.precio_base ?? 0);

    return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card h-100 shadow-sm">
          <a href="${href}" class="text-decoration-none">
            <img src="${img}" class="card-img-top" alt="${nombre}" onerror="this.onerror=null; this.src='${NO_IMAGE_SVG}'">
          </a>
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-1">${nombre}</h6>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <span class="fw-semibold">${precio}</span>
              <a class="btn btn-sm btn-outline-primary" href="${href}">Ver</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
});

async function verificarSesionYMostrarUsuario() {
  try {
    const res = await fetch("../backend/login.php?op=me", {
      credentials: "same-origin"
    });
    const me = await res.json();
    if (!me.authenticated) return null;

    const spanUser = document.getElementById("usuarioActual");
    const spanRol  = document.getElementById("usuarioRol");
    if (spanUser) spanUser.textContent = (me.empleado_nombre || me.username);
    if (spanRol)  spanRol.textContent  = "Rol: " + (me.rol || "-");

    const linkCred = document.getElementById("linkCredenciales");
    if (linkCred && me.rol !== "Administrador") linkCred.style.display = "none";

    return me;
  } catch (err) {
    console.error("Error verificando sesión:", err);
    return null;
  }
}

async function salir() {
  try {
    await fetch("../backend/login.php?op=logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch (e) {}
  window.location.href = "login.html";
}

window.onpageshow = function (event) {
  if (event.persisted) {
    verificarSesionYMostrarUsuario().then(me => {
      if (!me || !me.authenticated) {
        location.replace("login.html");
      }
    });
  }
};