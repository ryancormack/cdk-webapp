import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
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

export class CdkDemoBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tasksTable = new Table(this, "TasksTable", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "task",
        type: AttributeType.STRING,
      },
      tableName: "ryan-cdk-demo",
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const addTaskFunction = new NodejsFunction(this, "AddTaskFunction", {
      functionName: "ryan-cdk-add-task",
      logRetention: RetentionDays.ONE_DAY,
      entry: `functions/addTask.ts`,
      environment: {
        TASKS_TABLE: tasksTable.tableName,
      },
      architecture: Architecture.ARM_64,
    });

    tasksTable.grantReadWriteData(addTaskFunction);

    const tasksApi = new RestApi(this, "TasksAPI", {
      restApiName: "TaskApi",
      description: "API for adding tasks",
      defaultCorsPreflightOptions: {
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    tasksApi.root.addMethod("POST", new LambdaIntegration(addTaskFunction));

    const scanTasksApiRole = new Role(this, "ScanTasksApiRole", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      inlinePolicies: {
        allowDynamoScan: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["dynamodb:Scan"],
              resources: [tasksTable.tableArn],
            }),
          ],
        }),
      },
    });
    tasksApi.root.addMethod(
      "GET",
      new AwsIntegration({
        service: "dynamodb",
        action: "Scan",
        options: {
          credentialsRole: scanTasksApiRole,
          requestTemplates: {
            "application/json": `
            {
              "TableName": "${tasksTable.tableName}"
            }`,
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": `
                  #set($inputRoot = $input.path('$'))
                  {
                    "requestId": "$context.requestId",
                    "tasks": [
                      #foreach($item in $inputRoot.Items)
                        {
                          "id": "$item.id.S",
                          "task": "$item.task.S"
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

    new StringParameter(this, "ApiUrlParameter", {
      allowedPattern: ".*",
      description: "The url of the api",
      parameterName: "ApiUrl",
      stringValue: tasksApi.url,
      tier: ParameterTier.STANDARD,
    });
  }
}
