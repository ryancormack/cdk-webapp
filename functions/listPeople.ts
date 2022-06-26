import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { PeopleResponse, Person } from "../website/src/apiClient";

const table = process.env.PERSON_TABLE;
const ddb = new DynamoDBClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const ddbResponse = await ddb.send(
    new ScanCommand({
      TableName: table,
    })
  );

  const items = ddbResponse.Items?.map((item) => {
    return {
      id: item.pk.S,
      name: item.name.S,
    };
  });

  const reponse: PeopleResponse = {
    people: items,
    requestId: event.requestContext.requestId,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(reponse),
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Method": "OPTIONS,POST",
    },
  };
};
