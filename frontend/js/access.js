import { $, esc, cut, toast, errMsg } from "./utils.js";
import { state, send, S, connect, refresh } from "./chain.js";
import { CFG } from "./config.js";
import { DEMO } from "./dns.js";

const STEPS = `<ol class="steps"><li><div><strong>Conecte Freighter</strong><br><span class="muted">Su cuenta Stellar será la llave de la institución.</span></div></li>
<li><div><strong>Solicite acceso</strong><br><span class="muted">Nombre y dominio oficial.</span></div></li>
<li><div><strong>Demuestre que el dominio es suyo</strong><br><span class="muted">Con su archivo stellar.toml.</span></div></li>
<li><div><strong>Aval revisa y aprueba</strong><br><span class="muted">Sin aprobación no se reconocen sus emisiones.</span></div></li></ol>`;

export function render(el) {
  const head = "<h1>Acceso para instituciones</h1>";
  if (!state.address) {
    el.innerHTML = `${head}<p class="sub">Cada institución se revisa antes de que Aval reconozca sus documentos.</p>${STEPS}<button class="btn" id="c">Conectar Freighter</button>`;
    return $("#c", el).onclick = () => connect().catch(e => toast(errMsg(e), "err"));
  }
  if (state.status === 2) { el.innerHTML = `${head}<div class="result ok"><h2>${esc(state.name)} está aprobada</h2><p>Ya puede emitir y revocar documentos.</p><a class="btn" href="#/emitir">Emitir documentos</a></div>`; return; }
  if (state.status === 1) {
    el.innerHTML = `${head}<div class="result warn"><h2>Solicitud en revisión</h2><p>${esc(state.name)} · ${esc(state.domain)}</p>${DEMO ? "<p>Modo demo: la prueba de dominio se simula.</p>" : `<p>Publique en <code>https://${esc(state.domain)}/.well-known/stellar.toml</code> una línea <code>ACCOUNTS=["${state.address}"]</code>.</p>`}</div>`;
    return;
  }
  el.innerHTML = `${head}<p class="sub">${state.status === 3 ? "Su solicitud anterior no fue aprobada." : "Cuéntenos quién es su institución."} Se enviará 1 XLM de prueba al administrador junto con la solicitud.</p>
    <form id="f"><label for="n">Nombre de la institución</label><input id="n" required>
    <label for="d" style="margin-top:14px">Dominio web oficial</label><input id="d" required placeholder="colegiodemo.ed.cr" maxlength="32">
    <button class="btn" style="margin-top:18px">Enviar solicitud</button></form>`;
  $("#f", el).onsubmit = async e => {
    e.preventDefault();
    try {
      const d = $("#d", el).value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      await send(b => {
        b.addOperation(S.Operation.setOptions({ homeDomain: d }));
        b.addOperation(S.Operation.manageData({ name: "aval:name", value: cut($("#n", el).value.trim(), 60) }));
        b.addOperation(S.Operation.payment({ destination: CFG.admin, asset: S.Asset.native(), amount: "1" }));
        b.addMemo(S.Memo.text("aval-req"));
      });
      toast("Solicitud enviada"); await refresh();
    } catch (err) { toast(errMsg(err), "err"); }
  };
}
