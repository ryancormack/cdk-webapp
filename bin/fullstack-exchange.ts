#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyStack } from "../lib/fullstack-exchange-stack";

const app = new cdk.App();
new MyStack(app, "FullstackExchangeBackendStack", {});
