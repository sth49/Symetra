import React, { useState, useEffect, ReactNode, useRef } from "react";
import trialData from "./data/ParaSuit";
import configData from "./data/config";
import { Experiment } from "./model/experiment";
import { Icon } from "@chakra-ui/react";
import { AiFillRocket } from "react-icons/ai";
import "./App.css";
import { Box, Button, Heading } from "@chakra-ui/react";
import Overview from "./components/Overview";
import ScatterContourPlot from "./components/ScatterPlot";
import { useCustomStore } from "./store";
import FastDataTable from "./components/FastDataTable";
import GroupView from "./components/GroupView";
import FastEffectTable from "./components/FastEffectTable";
import { RiFlowChart } from "react-icons/ri";
import theme from "./theme";
import { ChakraProvider } from "@chakra-ui/react";
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
    <ChakraProvider theme={theme}>
      {/* <AppContent /> */}
      <Box bg="gray.100" h={"100vh"} w={"100vw"}>
        <Box display={"flex"} justifyContent={"space-between"}>
          <Box
            color="gray.600"
            height="calc(44px - 6px)" // 양쪽 margin을 고려하여 높이 조정
            width="100%"
            bg="white"
            boxSizing="border-box"
            m={1}
            mb={0.5} // px 대신 rem 사용
            alignItems={"center"}
            display={"flex"}
          >
            {exp && (
              <Box m={1} width={"100%"}>
                <Overview />
              </Box>
            )}
          </Box>
        </Box>

        <Box display={"flex"}>
          {exp ? (
            <>
              <Box width="320px" height="calc(100vh - 44px)">
                <Box
                  height="calc(100vh - 44px - 8px)"
                  bg="white"
                  m={1}
                  mr={0.5}
                  mt={0.5}
                >
                  <FastEffectTable />
                </Box>
              </Box>
              <Box
                display="flex"
                flexDir="column"
                width="calc(100% - 320px)"
                height="calc(100vh - 44px)"
              >
                <Box display="flex" width="100%">
                  <Box
                    width="50%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"70%"} bg="white" m={0.5}>
                      <FastDataTable />
                    </Box>
                    <Box height={"30%"} bg="white" m={0.5} mb={1}>
                      <GroupView />
                    </Box>
                  </Box>
                  <Box
                    width="50%"
                    height="calc(100vh - 44px - 8px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"70%"} m={0.5} bg="white" mr={1}>
                      <ScatterContourPlot />
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
    </ChakraProvider>
  );
}

export default App;
