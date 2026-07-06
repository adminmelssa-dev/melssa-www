import { createRouteHandler } from "uploadthing/next";
import { uploadThingRouter } from "@/server/storage/providers/uploadthing/router";

export const { GET, POST } = createRouteHandler({
  router: uploadThingRouter,
});
