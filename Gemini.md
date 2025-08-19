PS C:\Projects\React\BookSpace\backend> node server.cjs
[dotenv@17.2.1] injecting env (4) from src\config\config.env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
C:\Projects\React\BookSpace\backend\src\routes\bookings.cjs:227
router.get('/approved', auth, verifyRole('admin'), async (req, res) => {
                        ^

ReferenceError: verifyRole is not defined
    at Object.<anonymous> (C:\Projects\React\BookSpace\backend\src\routes\bookings.cjs:227:25)
    at Module._compile (node:internal/modules/cjs/loader:1554:14)
    at Object..js (node:internal/modules/cjs/loader:1706:10)
    at Module.load (node:internal/modules/cjs/loader:1289:32)
    at Function._load (node:internal/modules/cjs/loader:1108:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
    at Module.require (node:internal/modules/cjs/loader:1311:12)
    at require (node:internal/modules/helpers:136:16)
    at Object.<anonymous> (C:\Projects\React\BookSpace\backend\server.cjs:40:26)

Node.js v22.14.0