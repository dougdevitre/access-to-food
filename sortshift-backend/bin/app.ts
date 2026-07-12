import { App } from "aws-cdk-lib";
import { SortShiftStack } from "../lib/sortshift-stack.js";

const app = new App();

new SortShiftStack(app, "SortShift-dev", {
  envName: "dev",
  corsOrigins: ["http://localhost:5173"],
});

new SortShiftStack(app, "SortShift-prod", {
  envName: "prod",
  // Replace with the real game origin before first prod deploy — never "*".
  corsOrigins: ["https://REPLACE-WITH-GAME-DOMAIN"],
});
