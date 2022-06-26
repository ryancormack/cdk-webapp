import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const table = process.env.PERSON_TABLE;
const ddb = new DynamoDBClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body)
    return {
      statusCode: 400,
      body: "invalid request",
    };
  const request: AddPersonRequest = JSON.parse(event.body);

  const name = getValidatedNameOrThrow(request.name);
  const id = uuidv4();
  const ddbResponse = await ddb.send(
    new PutItemCommand({
      Item: {
        pk: {
          S: id,
        },
        name: {
          S: name,
        },
      },
      TableName: table,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: id,
      name: name,
    }),
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Method": "OPTIONS,POST",
    },
  };
};

const getValidatedNameOrThrow = (body: string | null) => {
  if (!body) throw "Invalid name";
  const trimmed = body.trim();
  return trimmed;
};

export type AddPersonRequest = {
  name: string;
};
