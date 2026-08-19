(function () {
  const KEY = "filomena_admin_secret";
  const login = document.getElementById("login");
  const app = document.getElementById("app");
  const flash = document.getElementById("flash");
  const rowsEl = document.getElementById("rows");
  const countEl = document.getElementById("count");
  const loginError = document.getElementById("login-error");

  function secret() {
    return sessionStorage.getItem(KEY) || "";
  }
  function headers() {
    return { "Content-Type": "application/json", "x-admin-secret": secret() };
  }
  function showFlash(msg) {
    flash.hidden = !msg;
    flash.textContent = msg || "";
  }
  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
  async function api(path, opts = {}) {
    const res = await fetch(path, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }
  function fmtExpiry(sec) {
    if (!sec) return "—";
    return new Date(Number(sec) * 1000).toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function render(invites) {
    const n = (invites || []).length;
    countEl.textContent = n === 1 ? "1 persona" : n + " personas";
    if (!n) {
      rowsEl.innerHTML = '<tr><td colspan="4" class="muted">Aún no hay invitados.</td></tr>';
      return;
    }
    rowsEl.innerHTML = invites
      .map((inv) => {
        const contact = [inv.email, inv.phone].filter(Boolean).join(" · ") || "—";
        return `<tr>
          <td>${escapeHtml(inv.name)}</td>
          <td class="muted">${escapeHtml(contact)}</td>
          <td class="muted">${escapeHtml(fmtExpiry(inv.expiry))}</td>
          <td class="actions">
            <a href="${escapeHtml(inv.url)}" target="_blank" rel="noopener">Abrir</a>
            <button type="button" data-copy="${escapeHtml(inv.url)}">Copiar</button>
            <button type="button" class="danger" data-del="${escapeHtml(inv.token)}">Eliminar</button>
          </td>
        </tr>`;
      })
      .join("");
    rowsEl.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await copyText(btn.getAttribute("data-copy"));
        showFlash(ok ? "Link copiado. El invitado abre esa página y acerca el QR a la cabina." : "No se pudo copiar.");
      });
    });
    rowsEl.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!window.confirm("¿Eliminar esta cortesía? El QR dejará de mostrarse (la cabina no se entera sola).")) return;
        api("/api/invites/" + encodeURIComponent(btn.getAttribute("data-del")), { method: "DELETE" })
          .then((data) => {
            showFlash("Eliminado.");
            render(data.invites || []);
          })
          .catch((err) => showFlash(err.message));
      });
    });
  }

  async function refresh() {
    const data = await api("/api/invites");
    render(data.invites || []);
  }

  function showApp() {
    login.hidden = true;
    app.hidden = false;
    refresh().catch((err) => showFlash(err.message));
  }

  login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = login.secret.value.trim();
    sessionStorage.setItem(KEY, value);
    loginError.hidden = true;
    try {
      await api("/api/admin/ping");
      showApp();
    } catch {
      sessionStorage.removeItem(KEY);
      loginError.hidden = false;
      loginError.textContent = "Clave incorrecta.";
    }
  });

  document.getElementById("create").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api("/api/invites", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
        }),
      });
      form.reset();
      showFlash("QR creado. Copia el link o ábrelo para verlo.");
      await refresh();
    } catch (err) {
      showFlash(err.message);
    }
  });

  if (secret()) {
    api("/api/admin/ping")
      .then(showApp)
      .catch(() => sessionStorage.removeItem(KEY));
  }
})();
