import { Application, Router } from "@oak/oak"
import { oakCors } from "https://deno.land/x/cors/mod.ts"

export function idServerFactory({ port }) {
  const router = new Router()

  router.get("/", ctx => {
    ctx.response.body = "Hello world"
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
