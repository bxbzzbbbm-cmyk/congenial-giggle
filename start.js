const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const inquirer = require("inquirer");
const pino = require("pino");
const fs = require("fs");
const readline = require("readline");

async function start() {
    if (!fs.existsSync("./auth")) {
        fs.mkdirSync("./auth");
    }

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
            process.stdout.write("Connecting...\n");
        }

        if (connection === "open") {
            process.stdout.write("Connected.\n");
        }

        if (connection === "close") {
            process.stdout.write("Connection closed.\n");
            setTimeout(start, 3000);
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

        process.stdout.write("\nPairing Code: " + code + "\n");
    }
}

start().catch(() => {});
