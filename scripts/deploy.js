const fs = require("fs");
const hre = require("hardhat");

// Función principal encargada de desplegar el contrato y configurar el entorno.
async function main() {

  // Obtiene la fábrica del contrato y lo despliega en la red seleccionada.
  const reg = await (
    await hre.ethers.getContractFactory("CredentialRegistry")
  ).deploy();

  // Espera hasta que el contrato quede completamente desplegado.
  await reg.waitForDeployment();

  // Obtiene la dirección donde fue desplegado el contrato.
  const address = await reg.getAddress();

  // Obtiene las cuentas disponibles en la red.
  const [deployer] = await hre.ethers.getSigners();

  // En el modo demo, el usuario que despliega solicita acceso
  // como una institución utilizando datos de ejemplo.
  await (
    await reg.requestAccess("ULACIT (demo)", "ulacit.ac.cr")
  ).wait();

  // El administrador aprueba la solicitud de la cuenta que realizó el despliegue.
  await (
    await reg.review(deployer.address, true)
  ).wait();

  // Define la dirección RPC según la red utilizada.
  // Para localhost se utiliza el nodo local de Hardhat.
  // Para Sepolia se utiliza la dirección configurada mediante la variable de entorno.
  const rpc =
    hre.network.name === "localhost"
      ? "http://127.0.0.1:8545"
      : (process.env.SEPOLIA_RPC || "");

  // Genera el archivo de configuración del frontend con
  // la dirección del contrato, la red y la configuración del modo demo.
  fs.writeFileSync(
    "frontend/js/config.js",
    `export const CFG = ${JSON.stringify(
      {
        address,
        rpc,
        chainName: hre.network.name,
        demo: process.env.DEMO !== "false"
      },
      null,
      2
    )};\n`
  );

  // Muestra en la consola la dirección del contrato desplegado.
  console.log("Contrato desplegado en:", address);
}

// Ejecuta la función principal y muestra cualquier error ocurrido.
main().catch(e => {
  console.error(e);
  process.exit(1);
});
