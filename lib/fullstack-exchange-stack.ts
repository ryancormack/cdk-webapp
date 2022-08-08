import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as api from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myTable = new ddb.Table(this, "PeopleTable", {
      partitionKey: {
        name: "pk",
        type: ddb.AttributeType.STRING,
      },
      tableName: "ryan-fullstack-exchange",
    });

    const myLambdaFunction = new NodejsFunction(this, "ListPeopleFunction", {
      functionName: "ryan-fullstack-list-people",
      entry: `functions/listPeople.ts`,
      environment: {
        PERSON_TABLE: myTable.tableName,
      },
    });

    myTable.grantReadData(myLambdaFunction);

    const myApi = new api.LambdaRestApi(this, "PersonApi", {
      handler: myLambdaFunction,
    });

    const webBucket = new s3.Bucket(this, "WebsiteBucket", {
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
