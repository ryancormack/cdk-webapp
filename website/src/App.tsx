import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { addTask, getTasks, Task } from "./apiClient";
import { AddTaskRequest } from "../../functions/addTask";

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState<string>("");
  useEffect(() => {
    const fetchData = async () => {
      const response = await getTasks();
      setTasks(response.tasks);
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (task) {
      const newTask: AddTaskRequest = {
        task: task,
      };

      const response = await addTask(newTask);

      setTasks([...tasks, response]);
    }
  };

  return (
    <div className="App">
      <div>
        <input
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter the task"
          type="text"
          value={task}
        />
        <button onClick={handleSubmit}>Save</button>
      </div>
      <div className="container">
        {tasks.map((task) => {
          return (
            <div key={task.id} className="item">
              <span>{task.task}</span> <span>{task.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
