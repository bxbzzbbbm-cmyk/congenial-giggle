const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const pino = require("pino");

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection }) => {
        if (connection === "open") {
            process.stdout.write("Connected\n");
        }
    });

    if (!state.creds.registered) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("Phone Number (country code + number): ", async (phone) => {
            const code = await sock.requestPairingCode(
                phone.replace(/\D/g, "")
            );

            process.stdout.write("Pairing Code: " + code + "\n");
            rl.close();
        });
    }
})();
