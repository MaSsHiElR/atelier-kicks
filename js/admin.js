// ==========================================
// 1. CONFIGURACIÓN MOCKAPI Y CREDENCIALES
// ==========================================
const API_URL = "https://6af5d1d6f6270fa08d68ace9.mockapi.io/catalogo/productos";
const FALLBACK_IMG = "https://placehold.co/800x600/18181b/71717a?text=Sin+imagen";

const ADMIN_USER = "admin";
const ADMIN_PASS = "sneakers2026";

// ==========================================
// 2. REFERENCIAS AL DOM
// ==========================================
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const btnLogout = document.getElementById("btn-logout");

const kpiModelos = document.getElementById("kpi-modelos");
const kpiStock = document.getElementById("kpi-stock");
const kpiValor = document.getElementById("kpi-valor");
const kpiBajo = document.getElementById("kpi-bajo");

const productoForm = document.getElementById("producto-form");
const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const tablaProductos = document.getElementById("tabla-productos");
const adminSearch = document.getElementById("admin-search");
const imgPreview = document.getElementById("img-preview");
const toastEl = document.getElementById("admin-toast");

const inputId = document.getElementById("producto-id");
const inputNombre = document.getElementById("nombre");
const inputMarca = document.getElementById("marca");
const inputPrecio = document.getElementById("precio");
const inputStock = document.getElementById("stock");
const inputTalla = document.getElementById("talla");
const inputColor = document.getElementById("color");
const inputCategoria = document.getElementById("categoriaId");
const inputImagen = document.getElementById("imagen");
const inputDescripcion = document.getElementById("descripcion");
const inputLimitada = document.getElementById("edicionLimitada");

let productosCache = [];

// ==========================================
// 3. LOGIN POR CÓDIGO
// ==========================================
function verificarSesion() {
  const activo = sessionStorage.getItem("adminLogueado") === "true";
  loginSection.classList.toggle("hidden", activo);
  adminSection.classList.toggle("hidden", !activo);
  if (activo) cargarProductos();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("login-user").value.trim();
  const pass = document.getElementById("login-pass").value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem("adminLogueado", "true");
    loginError.classList.add("hidden");
    loginForm.reset();
    verificarSesion();
  } else {
    loginError.classList.remove("hidden");
  }
});

btnLogout.addEventListener("click", () => {
  sessionStorage.removeItem("adminLogueado");
  verificarSesion();
});

// ==========================================
// 4. PREVIEW DE IMAGEN EN VIVO
// ==========================================
inputImagen.addEventListener("input", () => {
  const url = inputImagen.value.trim();
  imgPreview.src = url || FALLBACK_IMG;
});

imgPreview.addEventListener("error", () => {
  imgPreview.src = FALLBACK_IMG;
});

// ==========================================
// 5. CRUD CON MOCKAPI
// ==========================================
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${API_URL}`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Respuesta inválida de MockAPI");

    productosCache = data;
    actualizarKPIs(productosCache);
    filtrarYRenderizar();
  } catch (error) {
    console.error("Error MockAPI Admin:", error);
    tablaProductos.innerHTML = `
      <tr>
        <td colspan="6" class="empty-cell">
          Error al conectar con MockAPI (${error.message}). Revisa la URL del recurso en js/admin.js.
        </td>
      </tr>
    `;
  }
}

function actualizarKPIs(lista) {
  const totalUnidades = lista.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const valorTotal = lista.reduce(
    (acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0),
    0
  );
  const stockBajo = lista.filter((p) => (Number(p.stock) || 0) <= 2).length;

  kpiModelos.textContent = lista.length;
  kpiStock.textContent = totalUnidades;
  kpiValor.textContent = `$${valorTotal.toLocaleString()}`;
  kpiBajo.textContent = stockBajo;
}

function filtrarYRenderizar() {
  const q = adminSearch.value.trim().toLowerCase();
  const filtrados = productosCache.filter(
    (p) =>
      (p.nombre || "").toLowerCase().includes(q) ||
      (p.marca || "").toLowerCase().includes(q) ||
      (p.color || "").toLowerCase().includes(q)
  );
  renderizarTabla(filtrados);
}

adminSearch.addEventListener("input", filtrarYRenderizar);

function renderizarTabla(lista) {
  if (lista.length === 0) {
    tablaProductos.innerHTML = `
      <tr><td colspan="6" class="empty-cell">No se encontraron productos.</td></tr>
    `;
    return;
  }

  tablaProductos.innerHTML = lista
    .map((p) => {
      const stockNum = Number(p.stock) || 0;
      let stockClass = "stock-ok";
      if (stockNum <= 0) stockClass = "stock-out";
      else if (stockNum <= 2) stockClass = "stock-low";

      return `
        <tr>
          <td>
            <div class="prod-cell">
              <img src="${p.imagen || FALLBACK_IMG}" alt="${p.nombre}" class="thumb" onerror="this.src='${FALLBACK_IMG}'" />
              <div>
                <div class="prod-title">${p.nombre}</div>
                ${p.edicionLimitada ? `<span class="limited-tag">Edición Limitada</span>` : ""}
              </div>
            </div>
          </td>
          <td>${p.marca || "—"}</td>
          <td>${p.talla || "—"}</td>
          <td>$${Number(p.precio || 0).toLocaleString()}</td>
          <td>
            <span class="stock-badge ${stockClass}">
              <span class="dot"></span>${stockNum} u.
            </span>
          </td>
          <td class="align-right">
            <div class="row-actions">
              <button class="btn-sm" data-action="edit" data-id="${p.id}">Editar</button>
              <button class="btn-sm btn-sm-danger" data-action="delete" data-id="${p.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// CREATE (POST) / UPDATE (PUT)
productoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idEdicion = inputId.value;
  const payload = {
    nombre: inputNombre.value.trim(),
    marca: inputMarca.value,
    precio: Number(inputPrecio.value),
    stock: Number(inputStock.value),
    talla: inputTalla.value.trim(),
    color: inputColor.value.trim(),
    categoriaId: inputCategoria.value,
    edicionLimitada: inputLimitada.checked,
    descripcion: inputDescripcion.value.trim(),
    imagen: inputImagen.value.trim()
  };

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Guardando...";

  try {
    const url = idEdicion ? `${API_URL}/${idEdicion}` : API_URL;
    const method = idEdicion ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} al guardar en MockAPI`);

    resetearFormulario();
    await cargarProductos();
    mostrarToast(idEdicion ? "Producto actualizado" : "Producto creado en MockAPI");
  } catch (error) {
    console.error(error);
    alert(error.message || "Hubo un error al guardar el producto.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = inputId.value ? "Actualizar producto" : "Guardar en catálogo";
  }
});

// Acciones de tabla
tablaProductos.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const { action, id } = btn.dataset;
  if (action === "edit") cargarEnFormulario(id);
  if (action === "delete") eliminarProducto(id);
});

function cargarEnFormulario(id) {
  const p = productosCache.find((item) => item.id === id);
  if (!p) return;

  inputId.value = p.id;
  inputNombre.value = p.nombre || "";
  inputMarca.value = p.marca || "Jordan";
  inputPrecio.value = p.precio ?? "";
  inputStock.value = p.stock ?? 0;
  inputTalla.value = p.talla || "";
  inputColor.value = p.color || "";
  inputCategoria.value = String(p.categoriaId || "1");
  inputImagen.value = p.imagen || "";
  inputDescripcion.value = p.descripcion || "";
  inputLimitada.checked = Boolean(p.edicionLimitada);
  imgPreview.src = p.imagen || FALLBACK_IMG;

  formTitle.textContent = `Editando: ${p.nombre}`;
  btnSubmit.textContent = "Actualizar producto";
  btnCancelEdit.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

btnCancelEdit.addEventListener("click", resetearFormulario);

function resetearFormulario() {
  productoForm.reset();
  inputId.value = "";
  imgPreview.src = FALLBACK_IMG;
  formTitle.textContent = "Nuevo Sneaker";
  btnSubmit.textContent = "Guardar en catálogo";
  btnCancelEdit.classList.add("hidden");
}

async function eliminarProducto(id) {
  const p = productosCache.find((item) => item.id === id);
  if (!confirm(`¿Eliminar "${p?.nombre || id}" del inventario?`)) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar`);

    await cargarProductos();
    mostrarToast("Producto eliminado");
  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo eliminar el producto.");
  }
}

let toastTimer;
function mostrarToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

verificarSesion();