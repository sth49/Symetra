import Header from "./components/Header";
import React, { useState, useEffect, ReactNode } from "react";
import trialData from "./data/ParaSuit";
import configData from "./data/config";
import shapValues from "./data/shap_values";
import { Experiment } from "./model/experiment";
import "./App.css";
import { Box, Button } from "@chakra-ui/react";
import OptimizedDataTable from "./components/OptimizedDataTable";
import EffectColumn from "./components/EffectColumn";
function App() {
  const [exp, setExp] = useState<Experiment | null>(null);

  useEffect(() => {
    async function loadExperiment() {
      try {
        // 가정: Experiment.fromJson은 비동기 함수로 데이터를 처리한다.
        const experiment = await Experiment.fromJson(
          configData,
          trialData,
          shapValues
        );
        setExp(experiment);

        // 여기서 추가적인 비동기 로직 처리 가능
        console.log("Loaded experiment:", experiment);
      } catch (error) {
        console.error("Failed to load the experiment data:", error);
      }
    }

    loadExperiment();
  }, []);

  // useEffect(() => {
  //   const experiment = Experiment.fromJson(configData, trialData);
  //   setExp(experiment);
  //   console.log(experiment);

  //   let trials = experiment.trials.filter((trial) => trial.metric > 0);

  //   let masks = trials.map((t) => {
  //     let mask = [];
  //     experiment.hyperparams.forEach((hp) => {
  //       if (hp.type === HyperparamTypes.Boolean) {
  //         mask.push(t.params[hp.name] ? 1 : 0);
  //       }
  //     });
  //     return mask;
  //   });

  //   let repr = [];
  //   masks.forEach((mask) => {
  //     let overlap = false;
  //     repr.forEach((r) => {
  //       let diff = 0;
  //       for (let i = 0; i < mask.length; i++) {
  //         diff += Math.abs(mask[i] - r[i]);
  //       }
  //       if (diff <= 10) {
  //         overlap = true;
  //       }
  //     });

  //     if (!overlap) {
  //       repr.push(mask);
  //     }
  //   });

  //   console.log(repr.length, trials.length);
  //   experiment.hyperparams.forEach((hp) => {
  //     if (hp.type === HyperparamTypes.Boolean) {
  //       let t = trials.filter((t) => t.params[hp.name]);
  //       let f = trials.filter((t) => !t.params[hp.name]);

  //       let tsum = t.reduce((acc, t) => acc + t.metric, 0);
  //       let fsum = f.reduce((acc, t) => acc + t.metric, 0);

  //       let diff = tsum / t.length - fsum / f.length;

  //       // console.log(Math.abs(diff), hp.name);
  //     }
  //   });

  //   experiment.hyperparams.forEach((hp1) => {
  //     experiment.hyperparams.forEach((hp2) => {
  //       if (
  //         hp1.type === HyperparamTypes.Boolean &&
  //         hp2.type === HyperparamTypes.Boolean
  //       ) {
  //         let counter = {
  //           true: {
  //             true: 0,
  //             false: 0,
  //           },
  //           false: {
  //             true: 0,
  //             false: 0,
  //           },
  //         };
  //         trials.forEach((trial) => {
  //           counter[trial.params[hp1.name]][trial.params[hp2.name]] += 1;
  //         });
  //         let p =
  //           (counter[true][true] +
  //             counter[false][false] -
  //             counter[true][false] -
  //             counter[false][true]) /
  //           trials.length;
  //       }
  //     });
  //   });
  // }, []);

  return (
    <>
      <Header />
      <Box display={"flex"}>
        {exp ? <EffectColumn data={exp} /> : <div>Loading...</div>}
        {exp ? <OptimizedDataTable data={exp} /> : <div>Loading...</div>}
      </Box>
    </>
  );
}

export default App;
