const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", () => {
  let reg, owner, ulacit, other;
  const h = ethers.sha256(ethers.toUtf8Bytes("titulo-andy"));
  beforeEach(async () => {
    [owner, ulacit, other] = await ethers.getSigners();
    reg = await (await ethers.getContractFactory("CredentialRegistry")).deploy();
    await reg.connect(ulacit).requestAccess("ULACIT", "ulacit.ac.cr");
    await reg.review(ulacit.address, true);
  });
  it("emite y verifica", async () => {
    await reg.connect(ulacit).issue(h, "Bachillerato");
    const r = await reg.verify(h);
    expect(r.exists).to.equal(true);
    expect(r.issuerName).to.equal("ULACIT");
    expect(r.issuerActive).to.equal(true);
  });
  it("sin aprobación no se puede emitir", async () => {
    await expect(reg.connect(other).issue(h, "Falso")).to.be.revertedWith("Institucion no autorizada");
    await reg.connect(other).requestAccess("Falsa U", "falsa.com");
    await expect(reg.connect(other).issue(h, "Falso")).to.be.revertedWith("Institucion no autorizada");
  });
  it("solo el administrador aprueba", async () => {
    await reg.connect(other).requestAccess("Falsa U", "falsa.com");
    await expect(reg.connect(other).review(other.address, true)).to.be.revertedWith("Solo el administrador");
  });
  it("un hash alterado no existe", async () => {
    await reg.connect(ulacit).issue(h, "Titulo");
    expect((await reg.verify(ethers.sha256(ethers.toUtf8Bytes("titulo-andy!")))).exists).to.equal(false);
  });
  it("solo quien emitió revoca", async () => {
    await reg.connect(ulacit).issue(h, "Titulo");
    await expect(reg.connect(other).revoke(h)).to.be.revertedWith("Solo quien emitio");
    await reg.connect(ulacit).revoke(h);
    expect((await reg.verify(h)).revoked).to.equal(true);
  });
  it("una institución suspendida se refleja al verificar", async () => {
    await reg.connect(ulacit).issue(h, "Titulo");
    await reg.suspend(ulacit.address);
    expect((await reg.verify(h)).issuerActive).to.equal(false);
  });
  it("emisión masiva", async () => {
    const hs = [1, 2, 3].map(n => ethers.sha256(ethers.toUtf8Bytes("t" + n)));
    await reg.connect(ulacit).issueBatch(hs, "Certificado");
    for (const x of hs) expect((await reg.verify(x)).exists).to.equal(true);
  });
});
