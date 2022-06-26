#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FullstackExchangeBackendStack } from "../lib/fullstack-exchange-backend-stack";
import { FullstackExchangeFrontendStack } from "../lib/fullstack-exchange-frontend-stack";

const app = new cdk.App();
const backend = new FullstackExchangeBackendStack(
  app,
  "FullstackExchangeBackendStack",
  {}
);

new FullstackExchangeFrontendStack(app, "FullstackExchangeFrontendStack", {});
