import { Box, Heading, Icon, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { memo, useMemo } from "react";
import StatTest from "./StatTest";
import { formatting } from "../model/utils";
import React from "react";
import { Group } from "../model/group";
import { performStatisticalTest } from "../model/statistic";
import { HyperparamTypes } from "../model/hyperparam";
const AnalysisView = () => {
  const { selectedGroup, groups, hyperparams, exp } = useCustomStore();
  const analysisGroups = useMemo(() => {
    return groups.groups.filter((group) => selectedGroup.has(group.id));
  }, [groups.groups, selectedGroup]);

  const hparamResults = useMemo(() => {
    if (analysisGroups.length === 0) {
      return [];
    }
    return hyperparams
      .map((param) =>
        performStatisticalTest(
          analysisGroups[0].getHyperparam(param.name),
          analysisGroups[1].getHyperparam(param.name),
          param.type,
          param
        )
      )
      .sort((a, b) => a.pValue - b.pValue);
  }, [analysisGroups, hyperparams]);
  console.log("hparamResults", hparamResults);
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Analysis View
        </Heading>
      </Box>

      <Box height={`calc(100% - 36px)`} p={3} overflow={"auto"}>
        {analysisGroups.length === 0 ? (
          <Text fontSize="md">
            Please select one or more groups from the Group View
          </Text>
        ) : (
          // <StatTest isOpen={true} selectedGroup={selectedGroup
          <Box display={"flex"} height={"100%"}>
            <Box
              display={"flex"}
              flexDir={"column"}
              alignItems={"center"}
              justifyContent={"space-between"}
              whiteSpace={"nowrap"}
              overflowX={"auto"}
              textOverflow={"ellipsis"}
              userSelect={"none"}
              w={"40%"}
            >
              <Box
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                p={1}
                borderBottom={"1px solid #ddd"}
              >
                <Box width={"20%"}></Box>
                {analysisGroups.map((group) => (
                  <Box width={"40%"} key={group.id}>
                    <Text fontWeight={"bold"} align="center" fontSize={"sm"}>
                      Group {group.id}
                      {group.id === 0 ? (
                        " (All)"
                      ) : group.id === 1 ? (
                        " (10%)"
                      ) : (
                        <></>
                      )}
                    </Text>
                  </Box>
                ))}
              </Box>
              <Box
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                p={1}
                pb={2}
              >
                <Box width={"20%"}>
                  <Text fontSize={"xs"} fontWeight={"bold"}>
                    Count
                  </Text>
                </Box>
                {analysisGroups.map((group) => (
                  <Box width={"40%"} key={group.id}>
                    <Text align="center" fontSize={"xs"}>
                      {formatting(group.trials.length, "int")}
                    </Text>
                  </Box>
                ))}
              </Box>
              <Box
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                p={1}
                pb={2}
              >
                <Box width={"20%"}>
                  <Text fontSize={"xs"} fontWeight={"bold"}>
                    Max. CVRG
                  </Text>
                </Box>
                {analysisGroups.map((group) => (
                  <Box width={"40%"} key={group.id}>
                    <Text align="center" fontSize={"xs"}>
                      {formatting(group.getStats().max, "int")}
                    </Text>
                  </Box>
                ))}
              </Box>
              <Box
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                p={1}
                pb={2}
              >
                <Box width={"20%"}>
                  <Text fontSize={"xs"} fontWeight={"bold"}>
                    Avg. CVRG
                  </Text>
                </Box>
                {analysisGroups.map((group) => (
                  <Box width={"40%"} key={group.id}>
                    <Text align="center" fontSize={"xs"}>
                      {formatting(group.getStats().avg, "float")}
                    </Text>
                  </Box>
                ))}
              </Box>
              <Box
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                p={1}
                pb={2}
              >
                <Box width={"20%"}>
                  <Text fontSize={"xs"} fontWeight={"bold"}>
                    Min. CVRG
                  </Text>
                </Box>
                {analysisGroups.map((group) => (
                  <Box width={"40%"} key={group.id}>
                    <Text align="center" fontSize={"xs"}>
                      {formatting(group.getStats().min, "int")}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box
              display={"flex"}
              flexDir={"column"}
              alignItems={"center"}
              justifyContent={"space-between"}
              whiteSpace={"nowrap"}
              overflowX={"auto"}
              textOverflow={"ellipsis"}
              userSelect={"none"}
              w={"30%"}
              pl={4}
            >
              <Box
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                p={1}
                borderBottom={"1px solid #ddd"}
              >
                <Box width={"50%"}>
                  <Text align={"center"} fontSize={"sm"} fontWeight={"bold"}>
                    Hparam
                  </Text>
                </Box>
                <Box width={"50%"}>
                  <Text align={"center"} fontSize={"sm"} fontWeight={"bold"}>
                    p-value
                  </Text>
                </Box>
              </Box>
              <Box overflow={"auto"} width="100%">
                {hparamResults.map((result, index) => (
                  <Box
                    width={"100%"}
                    display={"flex"}
                    alignItems={"center"}
                    p={1}
                    pb={2}
                    key={index}
                  >
                    <Box width={"50%"} display={"flex"} pl={2}>
                      <Text align={"center"} fontSize={"xs"}>
                        <Icon
                          as={result.param.icon}
                          color={"gray.600"}
                          mr={1}
                        />
                        {result.param.displayName}
                      </Text>
                    </Box>
                    <Box width={"50%"}>
                      <Text align={"center"} fontSize={"xs"}>
                        {formatting(result.pValue, "float")}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box pl={2}>
              <Text fontWeight={"bold"} fontSize={"sm"}>
                Expected Coverage
              </Text>
              {/* <Text fontSize={"sm"}>{analysisGroups[1].getUnion()}</Text> */}
              <Box display={"flex"}>
                <Text fontSize={"xs"} mr={2} width={"50%"}>
                  Group {analysisGroups[0].id}
                </Text>
                <Text fontSize={"xs"} width={"50%"}>
                  {formatting(analysisGroups[0].getUnion().size, "int")}
                </Text>
              </Box>
              <Box display={"flex"}>
                <Text fontSize={"xs"} mr={2} width={"50%"}>
                  Group {analysisGroups[1].id}
                </Text>
                <Text fontSize={"xs"} width={"50%"}>
                  {formatting(analysisGroups[1].getUnion().size, "int")}
                </Text>
              </Box>
              <Box display={"flex"}>
                <Text fontSize={"xs"} mr={2} width={"50%"}>
                  Combined
                </Text>
                <Text fontSize={"xs"} width={"50%"}>
                  {formatting(
                    new Set([
                      ...analysisGroups[0].getUnion(),
                      ...analysisGroups[1].getUnion(),
                    ]).size,
                    "int"
                  )}
                </Text>
              </Box>
            </Box>
          </Box>
        )}
        {/* <StatTest isOpen={true} selectedGroup={selectedGroup} /> */}
      </Box>
    </div>
  );
};

export default memo(AnalysisView);
