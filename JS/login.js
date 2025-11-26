// login.js
(() => {
  const form = document.getElementById("loginForm");
  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const submitBtn = form?.querySelector('[type="submit"]');
 
  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.dataset._label ??= submitBtn.textContent;
    submitBtn.textContent = loading ? "Ingresando..." : submitBtn.dataset._label;
  }
 
  function redirectByRole(rol) {
    if (rol === "Administrador") {
      window.location.href = "index.html";
    } else {
      window.location.href = "index.html";
    }
  }
 
  async function doLogin(username, password) {
    const res = await fetch("../backend/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    });
 
 
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Error HTTP ${res.status} al procesar la respuesta.`);
    }
 
    if (!res.ok || !data?.success) {
      const msg =
        data?.message ||
        (res.status === 401
          ? "No autenticado."
          : res.status === 403
          ? "Acceso denegado."
          : "Credenciales incorrectas o error del servidor.");
      throw new Error(msg);
    }
 
    return data;
  }
 
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
 
    const username = userEl?.value.trim();
    const password = passEl?.value.trim();
 
    if (!username || !password) {
      alert("Por favor, complete ambos campos.");
      return;
    }
 
    setLoading(true);
    try {
      const data = await doLogin(username, password);
 
      redirectByRole(data.rol);
    } catch (err) {
      console.error("Login error:", err);
      alert(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  });
 
  [userEl, passEl].forEach((el) =>
    el?.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") form?.dispatchEvent(new Event("submit", { cancelable: true }));
    })
  );
})();