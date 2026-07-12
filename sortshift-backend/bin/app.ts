import { App } from "aws-cdk-lib";
import { SortShiftStack } from "../lib/sortshift-stack.js";

const app = new App();

new SortShiftStack(app, "SortShift-dev", {
  envName: "dev",
  corsOrigins: ["http://localhost:5173"],
});

new SortShiftStack(app, "SortShift-prod", {
  envName: "prod",
  // The game origin — must match the deployed SPA exactly (never "*"). If Vercel
  // assigns a suffixed domain instead of this one, update it here and redeploy.
  corsOrigins: ["https://access-to-food.vercel.app"],
});
