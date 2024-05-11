import Content from "./components/Content";
import Header from "./components/Header";
import React, { useState, useEffect } from "react";
import trialData from "./data/ParaSuit";
import configData from "./data/config";
import { Hyperparam, HyperparamJson } from "./model/hyperparam";
import { Experiment } from "./model/experiment";
function App() {
  const [exp, setExp] = useState<Experiment | null>(null);

  useEffect(() => {
    const experiment = Experiment.fromJson(configData, trialData);
    setExp(experiment);
  }, []);

  return (
    <>
      <Header />
      <Content />
    </>
  );
}

export default App;
