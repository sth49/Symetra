import { useState, useEffect } from "react";
import trialData from "./data/ParaSuit_without_branch.json";
import configData from "./data/config.json";
import { Experiment } from "./model/experiment";
import "./App.css";
import { Box, ChakraProvider } from "@chakra-ui/react";
import Overview from "./components/Overview";
import ScatterContourPlot from "./components/ScatterPlot";
import { useCustomStore } from "./store";
import FastDataTable from "./components/FastDataTable";
import GroupView from "./components/GroupView";
import FastEffectTable from "./components/FastEffectTable";
import theme from "./theme";
import AnalysisView from "./components/AnalysisView";
function App() {
  const { exp, setExp, setHyperparams, setGroups, groups } = useCustomStore();
  const [selectedTrials, setSelectedTrials] = useState([]);
  const [selectedRowPositions, setSelectedRowPositions] = useState([]);
  const [lastViewIndex, setLastViewIndex] = useState(0);

  const handleSelectTrial = (trialIds: number[], positions: never[], index) => {
    setSelectedTrials(trialIds);
    setSelectedRowPositions(positions);
    setLastViewIndex(index);
  };

  useEffect(() => {
    async function loadExperiment() {
      if (exp !== null) {
        return;
      }
      try {
        const experiment = await Experiment.fromJson(configData, trialData);
        setExp(experiment);
        if (groups.getLength() === 0) {
          groups.addGroup(experiment?.trials); // 전체 데이터를 그룹에 추가
          const topGroup = experiment?.trials
            .sort((a, b) => b.metric - a.metric)
            .slice(0, experiment.trials.length * 0.1);
          groups.addGroup(topGroup); // 상위 10% 데이터를 그룹에 추가
          setGroups(groups);
        }

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
                  height="calc(100vh - 44px - 6px)"
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
                      <FastDataTable onSelectTrial={handleSelectTrial} />
                    </Box>
                    <Box height={"29%"} bg="white" m={0.5} mb={1}>
                      <GroupView />
                    </Box>
                  </Box>
                  <Box
                    width="50%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"70%"} m={0.5} bg="white" mr={1}>
                      <ScatterContourPlot
                        selectedTrials={selectedTrials}
                        selectedRowPositions={selectedRowPositions}
                        lastViewIndex={lastViewIndex}
                      />
                    </Box>
                    <Box height={"29%"} bg="white" m={0.5} mr={1} mb={1}>
                      <AnalysisView />
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
