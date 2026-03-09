// JS/categorias.js
(function () {
  const cont = document.getElementById('categorias-list');
  if (!cont) return;

  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

  // Icono "sin imagen" (SVG inline)
  const NO_IMAGE_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#f2f2f2"/>
      <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM5 5h14v10.5l-3.5-3.5-3 3-2-2L5 18V5Zm2.5 3.5A1.5 1.5 0 1 0 9 7a1.5 1.5 0 0 0-1.5 1.5Z" fill="#999"/>
      <path d="M5 19h14" stroke="#ccc"/>
      <path d="M7 17l10-10" stroke="#999" stroke-width="1.2"/>
    </svg>
  `);

  fetch('/backend/index.php', { cache: 'no-store' })
    .then(async r => {
      const text = await r.text();
      try { return JSON.parse(text); } catch { throw new Error(text); }
    })
    .then(json => {
      if (!json.ok) throw new Error(json.error || 'Error en la API');

      const frag = document.createDocumentFragment();

      json.data.forEach(cat => {
        const hrefLista = `/HTML/producto.html?cat=${encodeURIComponent(cat.slug)}`;
        const card = document.createElement('div');
        card.className = 'card-categoria-custom';
        card.innerHTML = `
          <a href="${hrefLista}">
            <img
              src="${cat.icono_path ? safe(cat.icono_path) : NO_IMAGE_SVG}"
              alt="${safe(cat.nombre)}"
              class="icono-categoria-custom"
              onerror="this.onerror=null; this.src='${NO_IMAGE_SVG}';">
          </a>
          <p class="categoria-nombre">${safe(cat.nombre)}</p>
        `;

        frag.appendChild(card);
      });

      cont.innerHTML = '';
      cont.appendChild(frag);
    })
    .catch(err => {
      cont.innerHTML = `<p style="color:#c00">No se pudieron cargar las categorías: ${safe(err.message)}</p>`;
      console.error(err);
    });
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
    const spanRol = document.getElementById("usuarioRol");

    if (spanUser) spanUser.textContent = (me.empleado_nombre || me.username);
    if (spanRol) spanRol.textContent = "Rol: " + (me.rol || "-");

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
});

window.onpageshow = function (event) {
  if (event.persisted) {
    verificarSesionYMostrarUsuario();
  }
};

async function salir() {
  try {
    await fetch("../backend/login.php?op=logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch (e) { }

  window.location.href = "login.html";
}