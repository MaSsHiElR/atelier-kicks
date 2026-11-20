(function () {
  const STORAGE_KEY = "atelier_theme";
  const root = document.documentElement;
  const toggleBtn = document.getElementById("btn-theme-toggle");

  function aplicarTema(tema) {
    if (tema === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }

    if (toggleBtn) {
      const esClaro = tema === "light";
      toggleBtn.setAttribute(
        "aria-label",
        esClaro ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
      );
      toggleBtn.setAttribute("aria-pressed", String(esClaro));
    }
  }

  const temaGuardado = localStorage.getItem(STORAGE_KEY) || "dark";
  aplicarTema(temaGuardado);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const esClaroActual = root.getAttribute("data-theme") === "light";
      const nuevoTema = esClaroActual ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, nuevoTema);
      aplicarTema(nuevoTema);
    });
  }
})();