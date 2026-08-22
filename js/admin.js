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

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function renderKpis(invites) {
    const now = Date.now() / 1000;
    let opened = 0;
    let pending = 0;
    let expired = 0;
    for (const inv of invites || []) {
      const isExpired = inv.expiry && Number(inv.expiry) < now;
      if (isExpired) expired += 1;
      if (inv.opened_at) opened += 1;
      else if (!isExpired) pending += 1;
    }
    setText("kpi-total", (invites || []).length);
    setText("kpi-opened", opened);
    setText("kpi-pending", pending);
    setText("kpi-expired", expired);
  }

  function render(invites) {
    const list = invites || [];
    renderKpis(list);
    const n = list.length;
    countEl.textContent = n === 1 ? "1 persona" : n + " personas";
    if (!n) {
      rowsEl.innerHTML = '<tr><td colspan="4" class="muted">Aún no hay invitados.</td></tr>';
      return;
    }
    rowsEl.innerHTML = list
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

  function flagEmoji(iso) {
    if (!iso || iso.length !== 2) return "";
    return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  }

  function fillDialSelect(select) {
    const countries = window.COUNTRY_DIALS || [];
    const peru = countries.find((c) => c.iso === "PE");
    const rest = countries
      .filter((c) => c.iso !== "PE")
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    const add = (c, selected) => {
      const opt = document.createElement("option");
      opt.value = c.iso;
      opt.dataset.dial = c.dial;
      opt.textContent = `${flagEmoji(c.iso)} ${c.name} (+${c.dial})`;
      if (selected) opt.selected = true;
      select.appendChild(opt);
    };
    if (peru) add(peru, true);
    if (peru && rest.length) {
      const sep = document.createElement("option");
      sep.disabled = true;
      sep.textContent = "────────";
      select.appendChild(sep);
    }
    rest.forEach((c) => add(c, false));
    select.value = "PE";
  }

  function composePhone(form) {
    const local = form.phone.value.replace(/\D/g, "");
    if (!local) return "";
    const selected = form.dial.selectedOptions[0];
    const prefix = (selected?.dataset.dial || "").replace(/\D/g, "");
    if (!prefix) return "+" + local;
    if (local.startsWith(prefix)) return "+" + local;
    return "+" + prefix + local;
  }

  const createForm = document.getElementById("create");
  fillDialSelect(createForm.dial);

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api("/api/invites", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: composePhone(form),
        }),
      });
      form.reset();
      form.dial.value = "PE";
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
