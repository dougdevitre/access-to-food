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
  // exactly (never "*"). food.dougdevitre.org is canonical; food.cotrackpro.com
  // and the Vercel alias are kept so the game works at every served URL.
  corsOrigins: [
    "https://food.dougdevitre.org",
    "https://food.cotrackpro.com",
    "https://access-to-food.vercel.app",
  ],
});
