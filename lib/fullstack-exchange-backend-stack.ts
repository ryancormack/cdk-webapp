import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  AwsIntegration,
  Cors,
  EndpointType,
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";

export class FullstackExchangeBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const personTable = new Table(this, "PeopleTable", {
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "name",
        type: AttributeType.STRING,
      },
      tableName: "ryan-fullstack-exchange",
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const addPersonFunction = new NodejsFunction(this, "AddNameFunction", {
      functionName: "ryan-fullstack-save-person",
      logRetention: RetentionDays.ONE_DAY,
      entry: `functions/savePerson.ts`,
      environment: {
        PERSON_TABLE: personTable.tableName,
      },
      architecture: Architecture.ARM_64,
    });

    personTable.grantReadWriteData(addPersonFunction);

    const personApi = new RestApi(this, "PersonApi", {
      restApiName: "PersonApi",
      description: "API for adding people",
      endpointTypes: [EndpointType.REGIONAL],
      deployOptions: {
        loggingLevel: MethodLoggingLevel.ERROR,
        throttlingRateLimit: 20,
        throttlingBurstLimit: 10,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    personApi.root.addMethod("POST", new LambdaIntegration(addPersonFunction));

    const scanPersonApiRole = new Role(this, "ScanPersonApiRole", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      inlinePolicies: {
        allowDynamoScan: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["dynamodb:Scan"],
              resources: [personTable.tableArn],
            }),
          ],
        }),
      },
    });
    personApi.root.addMethod(
      "GET",
      new AwsIntegration({
        service: "dynamodb",
        action: "Scan",
        options: {
          credentialsRole: scanPersonApiRole,
          requestTemplates: {
            "application/json": `
            {
              "TableName": "${personTable.tableName}"
            }`,
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
              responseTemplates: {
                "application/json": `
                  #set($inputRoot = $input.path('$'))
                  {
                    "requestId": "$context.requestId",
                    "people": [
                      #foreach($item in $inputRoot.Items)
                        {
                          "id": "$item.pk.S",
                          "name": "$item.name.S"
                        }#if($foreach.hasNext),#end
                      #end
                    ]
                  }
                `,
              },
            },
          ],
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );

    //note we need to store this value in param store so we can reference it at build time in the front end
    new StringParameter(this, "ApiUrlParameter", {
      allowedPattern: ".*",
      description: "The url of the api",
      parameterName: "ApiUrl",
      stringValue: personApi.url,
      tier: ParameterTier.STANDARD,
    });
    //Still use a cfn output so we see the output value printed at deploy time
    new CfnOutput(this, "ApiUrl", { value: personApi.url });
  }
}
