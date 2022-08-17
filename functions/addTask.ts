import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const ddb = new DynamoDBClient({});
const table = process.env.TASKS_TABLE;
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const request: AddTaskRequest = JSON.parse(event.body);
  const task = getValidatedTaskOrThrow(request.task);

  const id = uuidv4();
  await addTaskToDynamoDb(id, task);

  return successResponse(id, task);
};

const successResponse = (id: string, task: string) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      id: id,
      task: task,
    }),
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Method": "OPTIONS,POST",
    },
  };
};

const addTaskToDynamoDb = async (newTaskId: string, newTaskDetail: string) => {
  const ddbResponse = await ddb.send(
    new PutItemCommand({
      Item: {
        id: {
          S: newTaskId,
        },
        task: {
          S: newTaskDetail,
        },
      },
      TableName: table,
    })
  );
};

const getValidatedTaskOrThrow = (body: string | null) => {
  if (!body) throw "Invalid task";
  const trimmed = body.trim();
  return trimmed;
};

export type AddTaskRequest = {
  task: string;
};
