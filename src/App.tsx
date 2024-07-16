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
import { useCustomStore } from "./store";
import FastDataTable from "./components/FastDataTable";
import GroupView from "./components/GroupView";
import FastEffectTable from "./components/FastEffectTable";
function App() {
  // const [exp, setExp] = useState<Experiment | null>(null);
  const { exp, setExp, setHyperparams } = useCustomStore();
  useEffect(() => {
    async function loadExperiment() {
      try {
        // 가정: Experiment.fromJson은 비동기 함수로 데이터를 처리한다.
        const experiment = await Experiment.fromJson(configData, trialData);
        setExp(experiment);

        const hyperparams = experiment.hyperparams;
        setHyperparams(hyperparams);
        // 여기서 추가적인 비동기 로직 처리 가능
        console.log("Loaded experiment:", experiment);
      } catch (error) {
        console.error("Failed to load the experiment data:", error);
      }
    }

    loadExperiment();
  }, []);

  return (
    <Box bg="gray.200">
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading p={3} color="gray.600" height={"7vh"}>
          <Icon as={AiFillRocket} color="gray.600" />
          VisCovery
        </Heading>
        {exp && <Overview data={exp} />}
      </Box>

      <Box display={"flex"}>
        {exp ? (
          <>
            <Box height="92vh" width="20%">
              <Box height={"98.5%"} bg="white" m={1}>
                <FastEffectTable />
              </Box>
            </Box>
            <Box display="flex" flexDir="column" width="80%" height="92vh">
              <Box display="flex" width="100%" flexGrow={1} overflow="hidden">
                <Box width="50%" height={"94%"} bg="white" m={1}>
                  <ScatterContourPlot data={exp} />
                </Box>
                <Box width="50%">
                  <Box height={"49%"} bg="white" m={1}>
                    <FastDataTable></FastDataTable>
                  </Box>
                  <Box height={"49%"} bg="white" m={1}>
                    <GroupView></GroupView>
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <div>Loading...</div>
        )}
      </Box>
    </Box>
  );
}

export default App;
