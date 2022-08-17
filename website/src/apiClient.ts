import type { AddTaskRequest } from "../../functions/addTask";

const baseUrl = process.env.REACT_APP_API_URL;

if (!baseUrl) throw new Error("No api url");

export type TasksResponse = {
  tasks: Task[];
  requestId: string;
};

export type Task = {
  id: string;
  task: string;
};

export const getTasks = async () => {
  const result = await fetch(baseUrl);

  const tasks: TasksResponse = await result.json();
  return tasks;
};

export const addTask = async (newTask: AddTaskRequest) => {
  const reponse = await fetch(baseUrl, {
    body: JSON.stringify(newTask),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const task: Task = await reponse.json();

  return task;
};
