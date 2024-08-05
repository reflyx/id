import { generateMnemonic, mnemonicToSeed } from "npm:ethereum-cryptography/bip39/index.js"
import { wordlist } from "npm:ethereum-cryptography/bip39/wordlists/english.js"
import { HDKey } from "npm:ethereum-cryptography/hdkey.js"

export function cryptoFactory({ passphrase, store, alias }) {
  async function init() {
    //

    const jsonKey = await store.getObject("$identity")

    if (jsonKey) {
      console.log("no need to create a new key", jsonKey)
    } else {
      const mnemonic = generateMnemonic(wordlist)

      console.log("STORE THESE CAREFULLY:", mnemonic)

      const seed = await mnemonicToSeed(mnemonic, passphrase)
      const hdKey = HDKey.fromMasterSeed(seed)

      await store.saveObject("$identity", { alias, hdKey: hdKey.toJSON() })
    }
  }

  init().catch(console.error)

  return {}
}
