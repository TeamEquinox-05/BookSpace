    at require (node:internal/modules/helpers:141:16)

    at Object.<anonymous> (/app/server.cjs:39:24)

 

Node.js v22.11.0

[dotenv@17.2.1] injecting env (0) from src/config/config.env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

/app/src/routes/places.cjs:40

router.delete('/:id', auth, verifyRole('admin'), async (req, res) => {

                      ^

 

ReferenceError: auth is not defined

    at Object.<anonymous> (/app/src/routes/places.cjs:40:23)

    at Module._compile (node:internal/modules/cjs/loader:1546:14)

    at Object..js (node:internal/modules/cjs/loader:1689:10)

    at Module.load (node:internal/modules/cjs/loader:1318:32)

    at Function._load (node:internal/modules/cjs/loader:1128:12)

    at TracingChannel.traceSync (node:diagnostics_channel:315:14)

    at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)

    at Module.require (node:internal/modules/cjs/loader:1340:12)

    at require (node:internal/modules/helpers:141:16)

    at Object.<anonymous> (/app/server.cjs:39:24)

 

Node.js v22.11.0

[dotenv@17.2.1] injecting env (0) from src/config/config.env -- tip: ⚙️  write to custom object with { processEnv: myObject }

/app/src/routes/places.cjs:40

router.delete('/:id', auth, verifyRole('admin'), async (req, res) => {

                      ^

 

ReferenceError: auth is not defined

    at Object.<anonymous> (/app/src/routes/places.cjs:40:23)

    at Module._compile (node:internal/modules/cjs/loader:1546:14)

    at Object..js (node:internal/modules/cjs/loader:1689:10)

    at Module.load (node:internal/modules/cjs/loader:1318:32)

    at Function._load (node:internal/modules/cjs/loader:1128:12)

    at TracingChannel.traceSync (node:diagnostics_channel:315:14)

    at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)

    at Module.require (node:internal/modules/cjs/loader:1340:12)

    at require (node:internal/modules/helpers:141:16)

    at Object.<anonymous> (/app/server.cjs:39:24)

 

Node.js v22.11.0

[dotenv@17.2.1] injecting env (0) from src/config/config.env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar

/app/src/routes/places.cjs:40

router.delete('/:id', auth, verifyRole('admin'), async (req, res) => {

                      ^

 

ReferenceError: auth is not defined

    at Object.<anonymous> (/app/src/routes/places.cjs:40:23)

    at Module._compile (node:internal/modules/cjs/loader:1546:14)

    at Object..js (node:internal/modules/cjs/loader:1689:10)

    at Module.load (node:internal/modules/cjs/loader:1318:32)

    at Function._load (node:internal/modules/cjs/loader:1128:12)

    at TracingChannel.traceSync (node:diagnostics_channel:315:14)

    at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)

    at Module.require (node:internal/modules/cjs/loader:1340:12)

    at require (node:internal/modules/helpers:141:16)

    at Object.<anonymous> (/app/server.cjs:39:24)

 

Node.js v22.11.0
