document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Por favor, complete ambos campos.");
    return;
  }

  try {
 
    const res = await fetch("../backend/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error("Error HTTP: " + res.status);
    }

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("rol", data.rol);
      localStorage.setItem("auth", "true");

      alert("Inicio de sesión exitoso como " + data.rol);

      if (data.rol === "Administrador") {
        window.location.href = "registro.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      alert(data.message || "Credenciales incorrectas");
    }
  } catch (error) {
    console.error("Error de conexión o backend:", error);
    alert("Error al conectar con el servidor. Verifique la conexión o el backend.");
  }
});
