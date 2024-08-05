import { generateMnemonic, mnemonicToSeed } from "npm:ethereum-cryptography/bip39/index.js"
import { wordlist } from "npm:ethereum-cryptography/bip39/wordlists/english.js"
import { HDKey } from "npm:ethereum-cryptography/hdkey.js"
import { bytesToHex } from "npm:ethereum-cryptography/utils.js"

export function cryptoFactory({ passphrase, store, alias = "$identity" }) {
  const state = {}

  async function init() {
    //

    const jsonKey = await store.getObject(alias)

    if (jsonKey) {
      // check seed with provided passphrase
      const seed = await mnemonicToSeed(jsonKey.mnemonic, passphrase)

      if (bytesToHex(seed) === jsonKey.seed) {
        console.log("passphrase is valid. let's continue load this id service!")
        state.hdKey = HDKey.fromMasterSeed(seed)
      } else {
        throw new Error("unauthorized")
      }
    } else {
      const mnemonic = generateMnemonic(wordlist)

      console.log("STORE THESE CAREFULLY:", mnemonic)

      const seed = await mnemonicToSeed(mnemonic, passphrase)
      const hdKey = HDKey.fromMasterSeed(seed)

      await store.saveObject(alias, { alias, seed: bytesToHex(seed), mnemonic, hdKey: hdKey.toJSON() })
    }
  }

  init().catch(err => {
    if (err.message === "unauthorized") {
      console.log("Invalid passphrase. Unable to unlock identity private key. ")
      Deno.exit(2)
    } else {
      console.error(err)
    }
  })

  return {}
}
