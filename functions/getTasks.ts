import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const table = process.env.TASKS_TABLE;
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const tasks = await getTasksFromDynamo();

  return successResponse(context.awsRequestId, tasks);
};

const successResponse = (id: string, tasks: string[]) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      id: id,
      tasks: tasks,
    }),
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Method": "OPTIONS,POST",
    },
  };
};

const getTasksFromDynamo = async (): Promise<string[]> => {
  const ddbResponse = await ddb.send(
    new ScanCommand({
      TableName: table,
    })
  );

  const tasks: string[] = [];

  ddbResponse.Items?.forEach((element) => {
    tasks.push(element["tasks"].S);
  });
  return tasks;
};
