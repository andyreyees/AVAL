import { $, short, toast, errMsg } from "./utils.js";
import { state, connect, onChange } from "./chain.js";
import * as verify from "./verify.js";
import * as access from "./access.js";
import * as issue from "./issue.js";
import * as registry from "./registry.js";
import * as admin from "./admin.js";

const routes = { verificar: verify, institucion: access, emitir: issue, emisiones: registry, admin };

function route() {
  const [, name = "verificar", param] = location.hash.split("/");
  const key = routes[name] ? name : "verificar";
  document.querySelectorAll("nav a").forEach(a => a.setAttribute("aria-current", a.dataset.r === key ? "page" : "false"));
  routes[key].render($("#view"), param);
}

function paint() {
  const b = $("#wallet");
  b.textContent = state.address ? short(state.address) : "Conectar";
  b.classList.toggle("on", !!state.address);
  $('nav a[data-r="emitir"]').hidden = !state.active;
  $('nav a[data-r="emisiones"]').hidden = !state.active;
  $('nav a[data-r="admin"]').hidden = !state.isOwner;
}

$("#wallet").onclick = () => connect().catch(e => toast(errMsg(e), "err"));
onChange(() => { paint(); route(); });
window.addEventListener("hashchange", route);
paint(); route();
