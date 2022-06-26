import type { AddPersonRequest } from "../../functions/savePerson";

const baseUrl = process.env.REACT_APP_API_URL ?? "localhost:3000";

export type PeopleResponse = {
  people: Person[];
  requestId: string;
};

export type Person = {
  id: string;
  name: string;
};

export const getPeople = async () => {
  const result = await fetch(baseUrl);

  const people: PeopleResponse = await result.json();
  return people;
};

export const addPerson = async (newPerson: AddPersonRequest) => {
  const reponse = await fetch(baseUrl, {
    body: JSON.stringify(newPerson),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const person: Person = await reponse.json();

  return person;
};
