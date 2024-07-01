import React, { useState, useEffect, ReactNode, useRef } from "react";
import trialData from "./data/ParaSuit";
import configData from "./data/config";
import { Experiment } from "./model/experiment";
import { Icon } from "@chakra-ui/react";
import { AiFillRocket } from "react-icons/ai";
import "./App.css";
import { Box, Button, Heading } from "@chakra-ui/react";
import OptimizedDataTable from "./components/OptimizedDataTable";
import EffectTable from "./components/EffectTable";
import Overview from "./components/Overview";
import ScatterContourPlot from "./components/ScatterPlot";
function App() {
  const [exp, setExp] = useState<Experiment | null>(null);
  const overviewContainerRef = useRef(null);
  useEffect(() => {
    async function loadExperiment() {
      try {
        // 가정: Experiment.fromJson은 비동기 함수로 데이터를 처리한다.
        const experiment = await Experiment.fromJson(
          configData,
          trialData
          // shapValues
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
    <Box bg="gray.200">
      <Heading p={3} color="gray.600" height={"7vh"}>
        <Icon as={AiFillRocket} color="gray.600" />
        VisCovery
      </Heading>
      <Box display={"flex"}>
        {exp ? (
          <>
            <Box height={"92vh"} width="20%" display="flex" flexDir="column">
              <Heading
                as="h5"
                size="sm"
                color="gray.600"
                bg={"white"}
                m={1}
                mb={0}
                p={4}
                flexShrink={0}
              >
                Hyperparameter Effects
              </Heading>
              <Box
                overflow={"auto"}
                bg={"white"}
                m={1}
                mt={0}
                position={"relative"}
                height={"100%"}
                flexGrow={1}
              >
                <EffectTable data={exp} />
              </Box>
            </Box>
            <Box display="flex" flexDir="column" width="80%" height="92vh">
              <Box flexShrink={0} m={1}>
                <Overview data={exp} />
              </Box>
              <Box display="flex" width="100%" flexGrow={1} overflow="hidden">
                <Box width="50%" bg="white" m={1}>
                  <Heading as="h5" size="sm" color="gray.600" p={4}>
                    Trial Details
                  </Heading>
                  <Box height={"95%"}>
                    <ScatterContourPlot data={exp} />
                  </Box>
                </Box>
                <Box width="50%" bg="white" m={1}>
                  <Heading as="h5" size="sm" color="gray.600" p={4}>
                    Trial Details
                  </Heading>
                  <Box overflow={"auto"} position="relative" height={"95%"}>
                    <OptimizedDataTable data={exp} />
                  </Box>
                </Box>
              </Box>
            </Box>
            {/* <Box
              display={"flex"}
              flexDir={"column"}
              width="80%"
              height={"92vh"}
              m={1}
            >
              <Box pb={2} >
                <Overview data={exp} />
              </Box>

              <Box display={"flex"} width={"100%"} >
                <Box width="50%" overflow={"auto"} position={"relative"}>
                  ㅁㄴㅇㄹ
                </Box>
                <Box
                  width="50%"
                  overflow={"auto"}
                  position={"relative"}
                  bg={"white"}
                >
                  <OptimizedDataTable data={exp} />
                </Box>
              </Box>
            </Box> */}
          </>
        ) : (
          <div>Loading...</div>
        )}
      </Box>
    </Box>
  );
}

export default App;
