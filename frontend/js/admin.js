import { $, esc, short, cut, toast, errMsg } from "./utils.js";
import { state, readAccount, listRequesters, send, S, connect } from "./chain.js";
import { CFG } from "./config.js";
import { domainOk, DEMO } from "./dns.js";

export async function render(el) {
  if (!state.isOwner) {
    el.innerHTML = `<h1>Administración</h1><div class="empty"><p>Solo la cuenta administradora revisa instituciones.</p>${state.address ? "" : '<button class="btn" id="c">Conectar Freighter</button>'}</div>`;
    return $("#c", el)?.addEventListener("click", () => connect().catch(e => toast(errMsg(e), "err")));
  }
  el.innerHTML = `<h1>Administración</h1><p class="sub">Apruebe solo instituciones que pueda comprobar.</p><div id="list" class="empty"><p>Cargando…</p></div>`;
  const adm = (await readAccount(CFG.admin)).data;
  const items = await Promise.all((await listRequesters()).map(async g => {
    const a = await readAccount(g).catch(() => ({ data: {}, home: "" }));
    return { g, name: a.data["aval:name"] || "(sin nombre)", home: a.home, st: adm[`inst:${g}`] ? 2 : adm[`rej:${g}`] ? 3 : 1 };
  }));
  const box = $("#list", el); box.className = "";
  if (!items.length) { box.className = "empty"; box.innerHTML = "<p>Aún no hay solicitudes.</p>"; return; }
  const label = ["", "Pendiente", "Activa", "Rechazada"];
  box.innerHTML = items.map(({ g, name, home, st }) => `<div class="item"><div><strong>${esc(name)}</strong> <span class="pill ${st == 2 ? "ok" : "warn"}">${label[st]}</span><br><span class="muted">${esc(home)} · <code>${short(g)}</code></span> <span class="dns" data-w="${g}" data-d="${esc(home)}"></span></div>
    <div class="acts">${st == 1 ? `<button class="link" data-a="ok" data-w="${g}">Aprobar</button><button class="link danger" data-a="no" data-w="${g}">Rechazar</button>` : ""}${st == 2 ? `<button class="link danger" data-a="sus" data-w="${g}">Suspender</button>` : ""}</div></div>`).join("");
  el.querySelectorAll(".dns").forEach(async s => { const ok = await domainOk(s.dataset.d, s.dataset.w); s.innerHTML = `<span class="pill ${ok ? "ok" : "warn"}">dominio ${ok ? "comprobado" + (DEMO ? " (demo)" : "") : "sin comprobar"}</span>`; });
  const md = (name, value) => S.Operation.manageData({ name, value });
  box.onclick = async e => {
    const { a, w } = e.target.dataset; if (!a) return;
    const it = items.find(i => i.g === w);
    try {
      await send(b => {
        if (a === "ok") b.addOperation(md(`inst:${w}`, cut(it.name, 60)));
        if (a === "no") b.addOperation(md(`rej:${w}`, "1"));
        if (a === "sus") { b.addOperation(md(`inst:${w}`, null)); b.addOperation(md(`rej:${w}`, "1")); }
      });
      toast("Listo"); render(el);
    } catch (err) { toast(errMsg(err), "err"); }
  };
}
