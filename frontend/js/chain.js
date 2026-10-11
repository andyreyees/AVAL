import { CFG } from "./config.js";
import { isConnected, requestAccess, signTransaction } from "https://esm.sh/@stellar/freighter-api@2.0.0";
const S = window.StellarSdk, NET = S.Networks.TESTNET;
export { S };
const server = new S.Horizon.Server(CFG.horizon);

// status: 0 sin solicitud, 1 pendiente, 2 activa, 3 rechazada/suspendida
export const state = { address: null, status: 0, active: false, name: "", domain: "", isOwner: false };
const listeners = [];
export const onChange = f => listeners.push(f);
export const configured = () => /^G[A-Z2-7]{55}$/.test(CFG.admin);
export const idOf = h => h.replace(/^0x/, "").toLowerCase().slice(0, 62);
const txt = b => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));

export async function readAccount(g) {
  const a = await server.loadAccount(g);
  return { data: Object.fromEntries(Object.entries(a.data_attr).map(([k, v]) => [k, txt(v)])), home: a.home_domain || "" };
}

// Quienes pidieron acceso: pagos de 1 XLM al admin con memo "aval-req"
export async function listRequesters() {
  const res = await server.payments().forAccount(CFG.admin).order("desc").limit(200).join("transactions").call();
  const out = new Set();
  for (const p of res.records) if (p.type === "payment" && p.to === CFG.admin && (await p.transaction()).memo === "aval-req") out.add(p.from);
  return [...out];
}

export async function send(build) {
  const b = new S.TransactionBuilder(await server.loadAccount(state.address), { fee: S.BASE_FEE, networkPassphrase: NET });
  build(b);
  const r = await signTransaction(b.setTimeout(60).build().toXDR(), { networkPassphrase: NET });
  if (r?.error) throw new Error(r.error.message || r.error);
  return server.submitTransaction(S.TransactionBuilder.fromXDR(r.signedTxXdr ?? r, NET));
}

export async function refresh() {
  const adm = (await readAccount(CFG.admin)).data;
  const me = await readAccount(state.address).catch(() => ({ data: {}, home: "" }));
  state.isOwner = state.address === CFG.admin;
  state.active = state.isOwner || !!adm[`inst:${state.address}`];
  state.name = state.isOwner ? "ULACIT (demo)" : adm[`inst:${state.address}`] || me.data["aval:name"] || "";
  state.domain = me.home;
  state.status = state.active ? 2 : adm[`rej:${state.address}`] ? 3 : me.data["aval:name"] ? 1 : 0;
  listeners.forEach(f => f());
}

export async function connect() {
  const c = await isConnected();
  if (!(c?.isConnected ?? c)) throw new Error("Instale la extensión Freighter y active la red Testnet.");
  const r = await requestAccess();
  if (r?.error) throw new Error(r.error.message || r.error);
  state.address = r.address ?? r;
  await refresh();
}

// Busca el documento en la cuenta del admin y de las instituciones que pidieron acceso
export async function lookup(h) {
  const key = "c:" + idOf(h), adm = (await readAccount(CFG.admin)).data;
  for (const g of [CFG.admin, ...(await listRequesters())]) {
    const a = await readAccount(g).catch(() => null), v = a?.data[key];
    if (!v) continue;
    const [ts, ...k] = v.replace(/^R/, "").split("|"), own = g === CFG.admin;
    return { exists: true, revoked: v[0] === "R", issuerActive: own || !!adm[`inst:${g}`], issuer: g,
      issuerName: own ? "ULACIT (demo)" : adm[`inst:${g}`] || a.data["aval:name"] || "", issuerDomain: a.home || (own ? "ulacit.ac.cr" : ""), issuedAt: Number(ts), kind: k.join("|") };
  }
  return { exists: false };
}
