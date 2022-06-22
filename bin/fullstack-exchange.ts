#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FullstackExchangeStack } from "../lib/fullstack-exchange-stack";

const app = new cdk.App();
new FullstackExchangeStack(app, "FullstackExchangeStack", {});
