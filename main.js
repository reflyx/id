/**
 * Exposes ReflyxOS ID API Version 1.0
 *
 * This is a prototype of the hardware ID that should be used by humans when accessing ReflyxOS.
 *
 */

// Detect ReflyxOS node on this local network.
import { cryptoFactory } from "./lib/crypto.js"
import { storeFactory } from "./lib/datastore.js"
import { idServerFactory } from "./lib/id-server.js"
import { parseArgs } from "jsr:@std/cli/parse-args"
import { promptSecret } from "https://deno.land/std@0.224.0/cli/prompt_secret.ts"

const flags = parseArgs(Deno.args, {
  string: ["alias", "data", "port", "passphrase"],
  alias: {
    p: "port",
    a: "alias",
    d: "data",
  },
  default: {
    data: "./store.db",
    port: "10250",
  },
})

// Ask passphrase associated with this alias
if (!flags.passphrase) {
  flags.passphrase = promptSecret("Please enter your passphrase:")
}

try {
  const store = storeFactory({ path: flags.data, ...flags })
  const crypto = cryptoFactory({ store, ...flags })
  const idServer = idServerFactory({ port: 10250, store, crypto, ...flags })

  await idServer.start()
} catch (err) {
  console.error("caught main error", err)
  Deno.exit(1)
}
