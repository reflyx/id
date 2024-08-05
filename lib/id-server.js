import { Application, Router } from "@oak/oak"
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"
import { DateTime } from "npm:luxon"

export function idServerFactory({ port, crypto, store }) {
  const router = new Router()

  const ACTIVE_CODES = []

  router.get("/auth-code", ctx => {
    // generate code
    const authCode = crypto.generateAuthCode(6)
    ACTIVE_CODES.push({ code: authCode, expiresAt: DateTime.now().plus({ minutes: 5 }) })
    console.log("ENTER THIS CODE IN YOUR COCKPIT TO ESTABLISH THE CONNECTION:", authCode)
    ctx.response.body = "ok"
  })

  router.post("/sessions", async ctx => {
    // check if code is valid
    const req = await ctx.request.body.json()
    const activeCode = ACTIVE_CODES.find(c => c.code === req.code)
    if (activeCode) {
      console.log("diff", activeCode.expiresAt.diffNow("seconds").get("seconds"))
      if (activeCode.expiresAt.diffNow("seconds").get("seconds") > 0) {
        const identity = crypto.getIdentity()
        const profile = { ...store.getObject(`${identity.alias}.profile`, { settings: {}, preferences: {}, actor: {} }), identity }

        // generate access and refresh tokens
        const { access, refresh } = crypto.generateTokens({ profile, identity })

        // store refresh token
        await store.saveObject([identity.id, "refresh"], { refresh })

        ctx.response.body = { tokens: { access, refresh }, profile }
      } else {
        ctx.response.status = 401
        ctx.response.body = "expired"
      }
    } else {
      ctx.response.status = 401
      ctx.response.body = "unauthorized"
    }
  })

  const app = new Application()
  app.use(oakCors())
  app.use(router.routes())
  app.use(router.allowedMethods())

  return {
    start() {
      console.log("starting id server on port %s", port)
      return app.listen({ port })
    },
  }
}
