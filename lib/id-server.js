import { Application, Router } from "@oak/oak"
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"
import { DateTime } from "npm:luxon"

export function idServerFactory({ port, host = "0.0.0.0", crypto, store }) {
  const router = new Router()

  const ACTIVE_CODES = []

  router.get("/auth-code", ctx => {
    // generate code
    const authCode = crypto.generateAuthCode(6)
    ACTIVE_CODES.push({ code: authCode, expiresAt: DateTime.now().plus({ minutes: 5 }) })
    console.log("ENTER THIS CODE IN YOUR COCKPIT TO ESTABLISH THE CONNECTION:", authCode)
    ctx.response.body = "ok"
  })

  router.get("/discovery", ctx => {
    ctx.response.body = {
      vendor: "reflyx.io",
      version: "1.0.0",
      protocols: ["rfx:id:1"],
      host,
    }
  })

  router.post("/sessions", async ctx => {
    const req = await ctx.request.body.json()
    const activeCode = ACTIVE_CODES.find(c => c.code === req.code)
    if (activeCode) {
      if (activeCode.expiresAt.diffNow("seconds").get("seconds") > 0) {
        const identity = crypto.getIdentity()
        const profile = { ...store.getObject([identity.alias, "profile"], { settings: {}, preferences: {}, actor: {} }), identity }

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

  router.put("/profile", async ctx => {
    // verify token
    const identity = crypto.verifyToken(ctx.request.headers.authorization)
    const req = await ctx.request.body.json()
    store.saveObject([identity.alias, "profile"], { ...req.profile, identity })
  })

  router.get("/profile", async ctx => {
    // verify token
    const identity = crypto.verifyToken(ctx.request.headers.get("authorization").split(" ")[1])
    ctx.response.body = await store.getObject([identity.alias, "profile"], identity.actor)
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
