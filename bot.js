const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const inquirer = require("inquirer");
const pino = require("pino");

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection }) => {
    if (connection === "connecting") {
      console.log("Connecting...");
    }

    if (connection === "open") {
      console.log("Connected.");
    }

    if (connection === "close") {
      console.log("Connection closed. Restarting...");
      start();
    }
  });

  if (!state.creds.registered) {
    const { phone } = await inquirer.prompt([
      {
        type: "input",
        name: "phone",
        message: "Enter phone number (country code + number):"
      }
    ]);

    const code = await sock.requestPairingCode(
      phone.replace(/\D/g, "")
    );

    console.log("");
    console.log("Pairing Code:");
    console.log(code);
    console.log("");
  } else {
    console.log("Session already exists.");
  }
}

start().catch(() => {
  console.log("Unable to start.");
});
