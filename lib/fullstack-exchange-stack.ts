import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";

export class FullstackExchangeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webBucket = new Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      bucketName: "ryan-fullstack-exchange",
    });

    const deploymentBucket = new s3Deploy.BucketDeployment(
      this,
      "DeployBucket",
      {
        sources: [s3Deploy.Source.asset("./website/build")],
        destinationBucket: webBucket,
      }
    );
  }
}
