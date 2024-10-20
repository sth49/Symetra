import { useEffect } from "react";
import trialData from "./data/ParaSuit_encoded.json";
import configData from "./data/config.json";
import { Experiment } from "./model/experiment";
import "./App.css";
import { Box, ChakraProvider } from "@chakra-ui/react";
import Overview from "./components/Overview";
import CoverageView from "./components/CoverageView";
import TrialGroupView from "./components/TrialGroupView";
import HparamView from "./components/HparamView";
import theme from "./theme";
import GroupDetailView from "./components/GroupDetailView";
import { useConstDataStore } from "./components/store/constDataStore";
import TrialView from "./components/TrialView";
import GroupComparisonView from "./components/GroupComparisonView";
import Heatmap from "./components/Heatmap";
function App() {
  const { exp, setExp, setHyperparams } = useConstDataStore();

  useEffect(() => {
    async function loadExperiment() {
      if (exp !== null) {
        return;
      }
      try {
        const experiment = await Experiment.fromJson(configData, trialData);
        setExp(experiment);
        console.log("trials", experiment.trials);
        const hyperparams = experiment.hyperparams;
        setHyperparams(hyperparams);
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
                <Box height="99%" bg="white" m={1} mr={0.5} mt={0.5}>
                  <HparamView />
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
                    width="35%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"99%"} bg="white" m={0.5}>
                      <CoverageView />
                    </Box>
                  </Box>
                  <Box
                    width="35%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"99%"} m={0.5} bg="white">
                      <TrialView />
                    </Box>
                  </Box>
                  <Box
                    width="30%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"20%"} m={0.5} bg="white" mr={1} mb={0}>
                      <TrialGroupView />
                    </Box>
                    <Box height={"10%"} m={0.5} bg="white" mr={1} mt={0}>
                      <GroupDetailView />
                    </Box>
                    <Box height={"20%"} m={0.5} bg="white" mr={1}>
                      <Heatmap />
                    </Box>
                    <Box height={"calc(49% - 8px)"} m={0.5} bg="white" mr={1}>
                      <GroupComparisonView />
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
