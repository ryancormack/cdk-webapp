#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkDemoBackendStack } from "../lib/cdk-demo-backend-stack";
import { CdkDemoFrontendStack } from "../lib/cdk-demo-frontend-stack";

const app = new cdk.App();
const backend = new CdkDemoBackendStack(app, "CdkDemoBackendStack", {});

const frontend = new CdkDemoFrontendStack(app, "CdkDemoFrontendStack", {});
