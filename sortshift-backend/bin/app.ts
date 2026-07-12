import { App } from "aws-cdk-lib";
import { SortShiftStack } from "../lib/sortshift-stack.js";

const app = new App();

new SortShiftStack(app, "SortShift-dev", {
  envName: "dev",
  corsOrigins: ["http://localhost:5173"],
});

new SortShiftStack(app, "SortShift-prod", {
  envName: "prod",
  // Allowed game origins — must match every domain the SPA is served from
  // exactly (never "*"). food.cotrackpro.com is canonical; the Vercel alias is
  // kept so the game also works when opened at the *.vercel.app URL.
  corsOrigins: ["https://food.cotrackpro.com", "https://access-to-food.vercel.app"],
});
