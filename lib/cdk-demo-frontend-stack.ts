import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { join } from "path";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class CdkDemoFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webBucket = new Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      bucketName: "ryan-cdk-demo",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const deploymentBucket = new BucketDeployment(this, "DeployBucket", {
      sources: [Source.asset(join(__dirname, "../website"))],
      destinationBucket: webBucket,
      logRetention: RetentionDays.ONE_DAY,
      retainOnDelete: false,
    });

    new CfnOutput(this, "WebsiteUrl", {
      value: webBucket.bucketWebsiteDomainName,
    });
  }
}
