import { BehaviorSubject } from "npm:rxjs"
import { produce } from "npm:immer"

export function storeFactory({ path = "./store.db" } = {}) {
  const data = new BehaviorSubject({ objects: {} })

  // persist state
  data.subscribe(state => {
    if (Object.keys(state.objects).length > 0) {
      Deno.writeTextFileSync(path, JSON.stringify(state))
    }
  })

  try {
    // load initial state
    const textState = Deno.readTextFileSync(path)
    const state = JSON.parse(textState)
    data.next(state)
  } catch (err) {
    data.next({ objects: {} })
  }

  return {
    saveObject(key, obj) {
      data.next(
        produce(data.getValue(), draft => {
          draft.objects[key] = obj
        })
      )
    },
    getObject(key) {
      return data.getValue().objects[key]
    },
  }
}
