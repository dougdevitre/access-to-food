import { Stack, type StackProps, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";

export interface SortShiftStackProps extends StackProps {
  envName: "dev" | "staging" | "prod";
  /** Comma-separated allowed origins for CORS; never "*" in prod. */
  corsOrigins: string[];
}

export class SortShiftStack extends Stack {
  constructor(scope: Construct, id: string, props: SortShiftStackProps) {
    super(scope, id, props);
    const { envName, corsOrigins } = props;

    const table = new dynamodb.Table(this, "Table", {
      tableName: `sortshift-${envName}`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: envName === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      pointInTimeRecovery: envName === "prod",
    });
    table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const hmacParam = `/sortshift/${envName}/hmac-key`;
    const baseEnv = {
      TABLE_NAME: table.tableName,
      HMAC_KEY_PARAM: hmacParam,
      MAX_MEALS_PER_SHIFT: "900",
      CLERK_JWKS_URL: process.env.CLERK_JWKS_URL ?? "",
      CLERK_ISSUER: process.env.CLERK_ISSUER ?? "",
    };

    const fn = (name: string, entry: string, handlerName = "handler") =>
      new NodejsFunction(this, name, {
        entry,
        handler: handlerName,
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: baseEnv,
      });

    const ssmRead = new iam.PolicyStatement({
      actions: ["ssm:GetParameter"],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${hmacParam}`],
    });

    const shiftStart = fn("ShiftStartFn", "src/handlers/shiftStart.ts");
    shiftStart.addToRolePolicy(ssmRead);

    const submitScore = fn("SubmitScoreFn", "src/handlers/submitScore.ts");
    submitScore.addToRolePolicy(ssmRead);
    table.grantWriteData(submitScore); // Put/Update/Transact only; no read, no Scan

    const leaderboard = fn("LeaderboardFn", "src/handlers/leaderboard.ts");
    table.grantReadData(leaderboard);

    const eventsCreate = fn("EventsCreateFn", "src/handlers/events.ts", "createHandler");
    table.grantWriteData(eventsCreate);
    const eventsGet = fn("EventsGetFn", "src/handlers/events.ts", "getHandler");
    table.grantReadData(eventsGet);

    const missSubmit = fn("MissSubmitFn", "src/handlers/misses.ts", "submitHandler");
    missSubmit.addToRolePolicy(ssmRead);
    table.grantWriteData(missSubmit);
    const missRead = fn("MissReadFn", "src/handlers/misses.ts", "readHandler");
    table.grantReadData(missRead);

    const exportCsv = fn("ExportCsvFn", "src/handlers/exportCsv.ts");
    table.grantReadData(exportCsv);

    const api = new apigwv2.HttpApi(this, "Api", {
      apiName: `sortshift-${envName}`,
      corsPreflight: {
        allowOrigins: corsOrigins,
        allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST],
        allowHeaders: ["content-type", "authorization"],
        maxAge: Duration.hours(1),
      },
    });
    const route = (path: string, method: apigwv2.HttpMethod, f: NodejsFunction, name: string) =>
      api.addRoutes({ path, methods: [method], integration: new HttpLambdaIntegration(name, f) });

    route("/v1/shifts/start", apigwv2.HttpMethod.POST, shiftStart, "ShiftStartInt");
    route("/v1/scores", apigwv2.HttpMethod.POST, submitScore, "SubmitScoreInt");
    route("/v1/leaderboard/global", apigwv2.HttpMethod.GET, leaderboard, "LbGlobalInt");
    route("/v1/events/{code}/leaderboard", apigwv2.HttpMethod.GET, leaderboard, "LbEventInt");
    route("/v1/events", apigwv2.HttpMethod.POST, eventsCreate, "EventsCreateInt");
    route("/v1/events/{code}", apigwv2.HttpMethod.GET, eventsGet, "EventsGetInt");
    route("/v1/misses", apigwv2.HttpMethod.POST, missSubmit, "MissSubmitInt");
    route("/v1/coordinator/misses", apigwv2.HttpMethod.GET, missRead, "MissReadInt");
    route("/v1/coordinator/export", apigwv2.HttpMethod.GET, exportCsv, "ExportInt");

    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
