import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import {
  CfnOutput,
  DockerImage,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { execSync, ExecSyncOptions } from "child_process";
import { join } from "path";
import { copySync } from "fs-extra";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class FullstackExchangeFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let url;
    try {
      const ssm = execSync(
        "aws ssm get-parameter --name ApiUrl --region eu-west-1 --profile ryandemo-deployment"
      );
      const asString = ssm.toString("utf8");
      const value = JSON.parse(asString);
      url = value.Parameter.Value;
    } catch (error) {
      console.error("Unable to get API URL. Ensure API has been deployed");
    }

    const execOptions: ExecSyncOptions = {
      stdio: ["ignore", process.stderr, "inherit"],
    };

    const bundle = Source.asset(join(__dirname, "../website"), {
      bundling: {
        command: [
          "sh",
          "-c",
          'echo "Docker build not supported. Please install esbuild."', //do nothing on Docker. We won't build there.
        ],
        image: DockerImage.fromRegistry("alpine"),
        local: {
          tryBundle(outputDir: string) {
            try {
              execSync("esbuild --version", execOptions);
            } catch {
              return false;
            }
            execSync(
              `REACT_APP_API_URL=${url} npm --prefix website run build`,
              execOptions
            );
            copySync(join(__dirname, "../website/build"), outputDir, {
              ...execOptions,
              recursive: true,
            });
            return true;
          },
        },
      },
    });

    const webBucket = new Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      bucketName: "ryan-fullstack-exchange",
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const deploymentBucket = new BucketDeployment(this, "DeployBucket", {
      sources: [bundle],
      destinationBucket: webBucket,
      logRetention: RetentionDays.ONE_DAY,
    });

    new CfnOutput(this, "WebsiteUrl", {
      value: webBucket.bucketWebsiteDomainName,
    });
  }
}
