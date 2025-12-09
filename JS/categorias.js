// JS/categorias.js
(function () {
    const cont = document.getElementById('categorias-list');
    if (!cont) return;
  
    const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
    );
  
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
              <img src="${safe(cat.icono_path)}"
                   alt="${safe(cat.nombre)}"
                   class="icono-categoria-custom">
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
 
});

window.onpageshow = function(event) {
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
  } catch (e) { /* ignore */ }

  window.location.href = "login.html";  
}

