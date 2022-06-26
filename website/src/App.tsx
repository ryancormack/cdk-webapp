import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { addPerson, getPeople, Person } from "./apiClient";
import { AddPersonRequest } from "../../functions/savePerson";

const App = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState<string>("");
  useEffect(() => {
    const fetchData = async () => {
      const response = await getPeople();
      if (response && response?.people?.length > 0) {
        setPeople(response.people);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (name) {
      const newPerson: AddPersonRequest = {
        name: name,
      };

      const response = await addPerson(newPerson);

      setPeople([...people, response]);
    }
  };

  return (
    <div className="App">
      <div>
        <input
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          type="text"
          value={name}
        />
        <button onClick={handleSubmit}>Save</button>
      </div>
      <div className="container">
        {people?.map((person) => {
          return (
            <div key={person.id} className="item">
              <span>{person.name}</span>
              <span>{person.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
