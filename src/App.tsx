import { useEffect, useState } from "react";
import configData from "./data/config.json";
import targetConfigData from "./data/targetConfig.json";
import { Experiment, Target } from "./model/experiment";
import "./App.css";
import {
  Box,
  ChakraProvider,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import Overview from "./components/Overview";
import CoverageView from "./components/CoverageView";
import TrialGroupView from "./components/TrialGroupView";
import HparamView from "./components/HparamView";
import theme from "./theme";
import { useConstDataStore } from "./components/store/constDataStore";
import TrialView from "./components/TrialView";
import InterGroupView from "./components/InterGroupView";
import { SettingsIcon } from "@chakra-ui/icons";
import { formatting } from "./model/utils";
import CodeDetail from "./components/CodeDetail";
function App() {
  const { exp, setExp, setHyperparams, target, setTarget } =
    useConstDataStore();

  const [currentTarget, setCurrentTarget] = useState<string>();
  // useEffect(() => {
  //   async function loadExperiment() {
  //     if (exp !== null) {
  //       return;
  //     }
  //     try {
  //       const target = [];
  //       targetConfigData["targets"].map((targetJson) => {
  //         console.log(targetJson);
  //         target.push(Target.fromJson(targetJson));
  //       });
  //       setTarget(target);
  //       setCurrentTarget(target[0].name);
  //       console.log(target);
  //       const experiment = await Experiment.fromJson(configData, trialData);
  //       setExp(experiment);
  //       console.log("trials", experiment.trials);
  //       const hyperparams = experiment.hyperparams;
  //       setHyperparams(hyperparams);
  //       console.log("Loaded experiment:", experiment);
  //     } catch (error) {
  //       console.error("Failed to load the experiment data:", error);
  //     }
  //   }
  //   loadExperiment();
  // }, []);

  // useEffect(() => {
  //   async function loadExperiment() {
  //     try {
  //       configData.name = currentTarget;
  //       const trialJson = await import(
  //         `./data/tuned_parameters_${currentTarget}_final.json`
  //       );
  //       const experiment = await Experiment.fromJson(configData, trialJson);
  //       setExp(experiment);
  //       console.log("trials", experiment.trials);
  //       const hyperparams = experiment.hyperparams;
  //       setHyperparams(hyperparams);
  //       console.log("Loaded experiment:", experiment);
  //     } catch (error) {
  //       console.error("Failed to load the experiment data:", error);
  //     }
  //   }
  //   loadExperiment();
  // }, [currentTarget]);

  // 초기 로딩을 위한 useEffect
  useEffect(() => {
    async function initializeApp() {
      try {
        // 타겟 데이터 로드
        const targets = targetConfigData["targets"].map((targetJson) =>
          Target.fromJson(targetJson)
        );
        setTarget(targets);

        // 초기 타겟 설정
        // const initialTarget = targets[0].name;
        // const initialTarget = "gcal_2200";
        // const initialTarget = "grep_2200_250302";
        const initialTarget = "gawk_800_250224";
        setCurrentTarget(initialTarget);

        // 초기 데이터 로드
        const module = await import(
          `./data/tuned_parameters_${initialTarget}_final.json`
        );
        const branchInfo = await import(
          `./data/branch_info_${initialTarget.split("_")[0]}.json`
        );
        // console.log(`./data/branch_info_${initialTarget.split("_")[0]}.json`);
        // console.log("branchInfo", branchInfo.default);
        const trialJson = module.default;
        const paramList = Object.keys(trialJson[0].config);
        const updatedConfig = { ...configData, name: initialTarget };
        const experiment = await Experiment.fromJson(
          updatedConfig,
          trialJson,
          paramList,
          branchInfo.default
        );
        // console.log("experiment", experiment.branchInfo);
        setExp(experiment);

        const hyperparams = experiment.hyperparams;
        setHyperparams(hyperparams);
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    }

    initializeApp();
  }, []); // 빈 의존성 배열로 변경

  // currentTarget 변경 시 실험 데이터를 로드하는 useEffect
  useEffect(() => {
    async function loadExperiment() {
      if (!currentTarget) return;

      try {
        const module = await import(
          `./data/tuned_parameters_${currentTarget}_final.json`
        );
        const branchInfo = await import(
          `./data/branch_info_${currentTarget.split("_")[0]}.json`
        );

        const trialJson = module.default;

        const paramList = Object.keys(trialJson[0].config);

        const updatedConfig = { ...configData, name: currentTarget };
        const experiment = await Experiment.fromJson(
          updatedConfig,
          trialJson,
          paramList,
          branchInfo.default
        );
        setExp(experiment);

        const hyperparams = experiment.hyperparams;
        setHyperparams(hyperparams);
      } catch (error) {
        console.error(
          `Failed to load experiment data for ${currentTarget}:`,
          error
        );
      }
    }

    if (exp && currentTarget !== exp.name) {
      loadExperiment();
    }
  }, [currentTarget, setExp, setHyperparams, exp]);
  return (
    <ChakraProvider theme={theme}>
      {exp ? (
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
              justifyContent={"space-between"}
            >
              {exp && (
                <Box m={1} width={"98%"}>
                  <Overview />
                </Box>
              )}
              {target && (
                <Menu>
                  <MenuButton
                    mr={1}
                    size={"xs"}
                    as={IconButton}
                    aria-label="Options"
                    value={currentTarget}
                    icon={<SettingsIcon />}
                    colorScheme={"blue"}
                    variant="outline"
                  />
                  <MenuList zIndex={10000}>
                    {target.map((t) => (
                      <MenuItem
                        key={t.name}
                        value={t.name}
                        onClick={() => setCurrentTarget(t.name)}
                      >
                        {t.name} (mse: {formatting(t.mse, "float", 2)}, r2:{" "}
                        {formatting(t.r2, "float", 2)})
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              )}
            </Box>
          </Box>

          <Box display={"flex"}>
            <>
              <Box width="330px" height="calc(100vh - 44px)">
                <Box height="99%" bg="white" m={1} mr={0.5} mt={0.5}>
                  <HparamView />
                </Box>
              </Box>
              <Box
                display="flex"
                flexDir="column"
                width="calc(100% - 330px)"
                height="calc(100vh - 44px)"
              >
                <Box display="flex" width="100%">
                  <Box
                    width="35%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"59%"} bg="white" m={0.5}>
                      <CoverageView />
                    </Box>
                    <Box height={"39.5%"} bg="white" m={0.5} mb={2}>
                      <TrialGroupView />
                    </Box>
                  </Box>
                  <Box
                    width="35%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"59%"} m={0.5} bg="white">
                      <TrialView />
                    </Box>
                    <Box height={"39.5%"} m={0.5} bg="white" mb={2}>
                      <InterGroupView />
                    </Box>
                  </Box>
                  <Box
                    width="30%"
                    height="calc(100vh - 44px)"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box height={"99%"} m={0.5} bg="white" mr={1} mb={2}>
                      <CodeDetail />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </>
          </Box>
        </Box>
      ) : (
        <div>Loading ...</div>
      )}
    </ChakraProvider>
  );
}

export default App;
