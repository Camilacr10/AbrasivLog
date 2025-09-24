// /JS/producto.js
document.addEventListener('DOMContentLoaded', async () => {
    const $   = (id) => document.getElementById(id);
    const fmt = (n) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD' })
                       .format(Number(n || 0));
    const qs  = new URLSearchParams(location.search);
    const codigoURL = qs.get('codigo');
    const catURL    = qs.get('cat');
  
    // Link volver
    const volver = $('volver-link');
    if (volver && catURL) volver.href = '/HTML/index.html#producto';
  
    if (!codigoURL && !catURL) return fail('Falta id o codigo en la URL.');
  
    try {
      const url = `/backend/producto_detalle.php?${codigoURL ? 'codigo='+encodeURIComponent(codigoURL)
                                                              : 'cat='+encodeURIComponent(catURL)}`;
      const r = await fetch(url, { cache: 'no-store' });
      const t = await r.text();
      let json;
      try { json = JSON.parse(t); } catch { throw new Error(t); }
      if (!json.ok) throw new Error(json.error || 'Error en la API');
  
      const p = json.data;
      render(p);
  
      
      const slug = p.categoria_slug || catURL || '';
      if (slug && p.codigo) setupPrevNext(slug, p.codigo);
    } catch (e) {
      fail(e.message);
    }
  
    function render(p) {
      $('prod-img').src               = p.imagen_path || '../IMG/placeholder.png';
      $('prod-nombre').textContent    = p.nombre || '—';
      $('prod-codigo').textContent    = p.codigo || '—';
      $('prod-categoria').textContent = p.categoria || '—';
      $('prod-existencia').textContent= p.existencia ?? 0;
      $('prod-detalle').textContent   = p.detalle || '—';
  
      // Mostrar TAL CUAL los campos de la BD
      $('prod-precio-final').textContent = fmt(p.precio_final);
      $('precio-unitario').textContent   = fmt(p.precio_base);
      $('precio-descuento').textContent  = fmt(p.porcentaje_descuento);
      $('precio-iva-monto').textContent  = fmt(p.iva);
      $('precio-iva-pct').textContent    = `${p.porcentaje_iva ?? 0}%`;
      $('precio-final').textContent      = fmt(p.precio_final);
  
      const load = $('estado-carga'); if (load) load.style.display = 'none';
    }
  
    async function setupPrevNext(slug, currentCode) {
      const prev = $('btn-prev');
      const next = $('btn-next');
      if (!prev || !next) return; 
  
      const disable = (a) => {
        a.classList.add('disabled');
        a.setAttribute('aria-disabled','true');
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
       
        const r = await fetch(`/backend/categoria.php?cat=${encodeURIComponent(slug)}`, { cache: 'no-store' });
        const t = await r.text();
        const j = JSON.parse(t);
        if (!j.ok) throw new Error(j.error || 'Error al cargar la categoría');
        const list = (j.data || []).filter(x => x && x.codigo);
  
        if (!list.length) { disable(prev); disable(next); return; }
  
        const idx = Math.max(0, list.findIndex(x => x.codigo === currentCode));
        const prevIdx = idx > 0 ? idx - 1 : null;
        const nextIdx = idx < list.length - 1 ? idx + 1 : null;
  
        if (prevIdx !== null) {
          enable(prev, `/HTML/producto.html?codigo=${encodeURIComponent(list[prevIdx].codigo)}&cat=${encodeURIComponent(slug)}`);
        } else {
          disable(prev);
        }
  
        if (nextIdx !== null) {
          enable(next, `/HTML/producto.html?codigo=${encodeURIComponent(list[nextIdx].codigo)}&cat=${encodeURIComponent(slug)}`);
        } else {
          disable(next);
        }
      } catch (err) {
        console.error(err);
       
        disable(prev);
        disable(next);
      }
    }
  
    function fail(msg) {
      const load = $('estado-carga'); if (load) load.style.display='none';
      const ebox = $('estado-error'); if (ebox) { ebox.style.display='block'; ebox.textContent = msg; }
      console.error(msg);
    }
  });
  