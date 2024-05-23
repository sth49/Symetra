import DataTable from "./components/DataTable";
import Header from "./components/Header";
import React, { useState, useEffect, ReactNode } from "react";
import trialData from "./data/ParaSuit";
import configData from "./data/config";
import { HyperparamTypes } from "./model/hyperparam";
import { Experiment } from "./model/experiment";
import "./App.css";
import { Button } from "@chakra-ui/react";

function generateData(count) {
  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Hannah",
    "Ivan",
    "Juliet",
  ];
  const jobs = [
    "Engineer",
    "Designer",
    "Artist",
    "Doctor",
    "Nurse",
    "Teacher",
    "Plumber",
    "Chef",
    "Lawyer",
    "Writer",
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `${names[Math.floor(Math.random() * names.length)]} ${index}`,
    age: Math.floor(Math.random() * 60) + 18,
    job: jobs[Math.floor(Math.random() * jobs.length)],
    a: Math.floor(Math.random() * 60) + 18,
    b: Math.floor(Math.random() * 60) + 18,
    c: Math.floor(Math.random() * 60) + 18,
    d: Math.floor(Math.random() * 60) + 18,
    e: Math.floor(Math.random() * 60) + 18,
    f: Math.floor(Math.random() * 60) + 18,
    g: Math.floor(Math.random() * 60) + 18,
    h: Math.floor(Math.random() * 60) + 18,
  }));
}

function App() {
  const [exp, setExp] = useState<Experiment | null>(null);

  const data2 = generateData(300); // 1000개의 데이터 생성

  const [sortedData, setSortedData] = useState(data2);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const newPositions = sortedData.reduce((acc, item, index) => {
      acc[item.id] = index; // id를 기준으로 새 위치 저장
      return acc;
    }, {});
    setPositions(newPositions);
  }, [sortedData]);

  const sortData = (field) => {
    const newData = [...sortedData].sort((a, b) =>
      a[field] > b[field] ? 1 : -1
    );
    setSortedData(newData);
  };

  useEffect(() => {
    const experiment = Experiment.fromJson(configData, trialData);
    setExp(experiment);
    console.log(experiment);

    let trials = experiment.trials.filter((trial) => trial.metric > 0);

    let masks = trials.map((t) => {
      let mask = [];
      experiment.hyperparams.forEach((hp) => {
        if (hp.type === HyperparamTypes.Boolean) {
          mask.push(t.params[hp.name] ? 1 : 0);
        }
      });
      return mask;
    });

    let repr = [];
    masks.forEach((mask) => {
      let overlap = false;
      repr.forEach((r) => {
        let diff = 0;
        for (let i = 0; i < mask.length; i++) {
          diff += Math.abs(mask[i] - r[i]);
        }
        if (diff <= 10) {
          overlap = true;
        }
      });

      if (!overlap) {
        repr.push(mask);
      }
    });

    console.log(repr.length, trials.length);
    experiment.hyperparams.forEach((hp) => {
      if (hp.type === HyperparamTypes.Boolean) {
        let t = trials.filter((t) => t.params[hp.name]);
        let f = trials.filter((t) => !t.params[hp.name]);

        let tsum = t.reduce((acc, t) => acc + t.metric, 0);
        let fsum = f.reduce((acc, t) => acc + t.metric, 0);

        let diff = tsum / t.length - fsum / f.length;

        // console.log(Math.abs(diff), hp.name);
      }
    });

    experiment.hyperparams.forEach((hp1) => {
      experiment.hyperparams.forEach((hp2) => {
        if (
          hp1.type === HyperparamTypes.Boolean &&
          hp2.type === HyperparamTypes.Boolean
        ) {
          let counter = {
            true: {
              true: 0,
              false: 0,
            },
            false: {
              true: 0,
              false: 0,
            },
          };
          trials.forEach((trial) => {
            counter[trial.params[hp1.name]][trial.params[hp2.name]] += 1;
          });
          let p =
            (counter[true][true] +
              counter[false][false] -
              counter[true][false] -
              counter[false][true]) /
            trials.length;
          // if (hp1 !== hp2 && Math.abs(p) > 0.2)
          // console.log(hp1.name, hp2.name, p, Math.abs(p));
        }
      });
    });
  }, []);

  return (
    <>
      <Header />
      {/* <DataTable data={exp} /> */}
      {/* <Button onClick={() => sortData("name")}>Sort by Name</Button>
      <Button onClick={() => sortData("age")}>Sort by Age</Button>
      <Button onClick={() => sortData("job")}>Sort by Job</Button>
      <div className="grid-container">
        {sortedData.map((item, index) => (
          <div
            key={item.id}
            className="grid-item"
            style={{
              gridRow: index + 1,
              transform: `translateY(${positions[item.id] * 0}px)`,
            }}
          >
            {item.name} - {item.age} - {item.job}
          </div>
        ))}
      </div> */}
      <DataTable data={exp} />
    </>
  );
}

export default App;
