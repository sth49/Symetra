import { Box, Heading, Icon, IconButton, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { memo, useEffect, useMemo, useState } from "react";
import { formatting } from "../model/utils";
import { performStatisticalTest } from "../model/statistic";
import { useConstDataStore } from "./store/constDataStore";
import { FaAngleUp } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";
import { Select } from "@chakra-ui/react";
import BarChart from "./BarChart";
import { StarIcon } from "@chakra-ui/icons";
import { Tooltip } from "@chakra-ui/react";
const GroupComparisonView = () => {
  const { hyperparams, exp } = useConstDataStore();
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const groups = useCustomStore((state) => state.groups);

  const [group2, setGroup2] = useState(
    groups.groups.filter((group) => group.id !== currentSelectedGroup.id)[0]
  );

  const [expander, setExpander] = useState("");

  const stats = useMemo(() => {
    if (!currentSelectedGroup || !group2) {
      return null;
    }
    const group1Stats = currentSelectedGroup.getStats();
    const group2Stats = group2.getStats();

    return {
      max: {
        group1: group1Stats.max,
        group2: group2Stats.max,
        type: "int",
      },
      mean: {
        group1: group1Stats.avg,
        group2: group2Stats.avg,
        type: "float",
      },
      min: {
        group1: group1Stats.min,
        group2: group2Stats.min,
        type: "int",
      },
    };
  }, [currentSelectedGroup, group2]);

  const data = useMemo(() => {
    if (!currentSelectedGroup || !group2) {
      return null;
    }
    const trialIds1 =
      (currentSelectedGroup &&
        currentSelectedGroup.trials.map((trial) => trial.id)) ||
      [];
    const trialIds2 = (group2 && group2.trials.map((trial) => trial.id)) || [];

    return exp?.hyperparams.map((hp, index) => ({
      id: index,
      name: hp.displayName,
      fullName: hp.name,
      displayName: hp.displayName,
      group1: hp.getEffect(trialIds1),
      trialIds1: trialIds1,
      group2: hp.getEffect(trialIds2),
      trialIds2: trialIds2,
      dist: hp.name,
      type: hp.type,
      icon: hp.icon,
      pValue: performStatisticalTest(
        currentSelectedGroup.getHyperparam(hp.name),
        group2.getHyperparam(hp.name),
        hp.type,
        hp
      ).pValue,
    }));
  }, [currentSelectedGroup, exp, group2]);

  useEffect(() => {
    if (currentSelectedGroup) {
      setGroup2(
        groups.groups.filter((group) => group.id !== currentSelectedGroup.id)[0]
      );
    }
  }, [currentSelectedGroup, groups]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Group Comparison View
        </Heading>
      </Box>

      <Box
        w={"100%"}
        height={`calc(100% - 36px)`}
        p={2}
        pt={0}
        overflow={"auto"}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Box width={"37%"} display={"flex"} justifyContent={"center"}>
            <Text align={"center"} fontWeight={"bold"}>
              {currentSelectedGroup ? currentSelectedGroup.name : "None"}
            </Text>
          </Box>
          <Box width={"15%"}></Box>
          <Box width={"37%"} display={"flex"} justifyContent={"center"}>
            <Select
              width={"75%"}
              value={group2 ? group2.id.toString() : ""}
              size={"sm"}
              onChange={(e) => {
                const newGroup = groups.getGroup(parseInt(e.target.value));
                console.log("Selected group:", newGroup);
                setGroup2(newGroup);
              }}
            >
              {groups.groups
                .filter((g) => g.id !== currentSelectedGroup.id)
                .map((group) => (
                  <option key={group.id} value={group.id.toString()}>
                    {group.name}
                  </option>
                ))}
            </Select>
          </Box>
          <Box width={"10%"}></Box>
        </div>
        <div
          style={{
            height: "calc(100% - 35px)",
            width: "100%",
            position: "relative",
            overflowY: "auto",
          }}
        >
          <div style={{ height: "90%", width: "100%", position: "relative" }}>
            {stats &&
              Object.keys(stats).map((key) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box width={"37%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {formatting(stats[key].group1, stats[key].type)}
                    </Text>
                  </Box>
                  <Box width={"15%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {key} cvrg
                    </Text>
                  </Box>
                  <Box width={"37%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {formatting(stats[key].group2, stats[key].type)}
                    </Text>
                  </Box>
                  <Box width={"10%"}>
                    <Text align={"center"}></Text>
                  </Box>
                </div>
              ))}

            <div style={{ height: "90%", width: "100%", position: "relative" }}>
              {data &&
                data
                  .sort((a, b) => a.pValue - b.pValue)
                  .map((d) => (
                    <>
                      <div
                        style={{
                          display: "flex",
                        }}
                      >
                        <Box
                          width={"37%"}
                          display={"flex"}
                          justifyContent={"space-around"}
                          alignItems={"center"}
                        >
                          <BarChart
                            dist={d.dist}
                            trialIds={d.trialIds1}
                            width={90}
                            height={30}
                          />
                          {/* <Text fontSize={"sm"}>
                        {formatting(d.group1, "float")}
                      </Text> */}
                        </Box>
                        <Box width={"15%"}>
                          <Tooltip label={d.fullName}>
                            <Text
                              display={"flex"}
                              justifyContent={"center"}
                              fontSize={"sm"}
                              alignItems={"center"}
                              userSelect={"none"}
                            >
                              <Icon as={d.icon} mr={1} color={"gray.600"} />
                              {d.name}
                              {d.pValue < 0.05 && (
                                <StarIcon color={"yellow.400"} ml={2} />
                              )}
                            </Text>
                          </Tooltip>
                        </Box>
                        <Box
                          width={"37%"}
                          display={"flex"}
                          // justifyContent={"space-around"}
                          justifyContent={"center"}
                          alignItems={"center"}
                        >
                          {/* <Text align={"center"} fontSize={"sm"}>
                        {formatting(d.group2, "float")}
                      </Text> */}
                          <BarChart
                            dist={d.dist}
                            trialIds={d.trialIds2}
                            width={90}
                            height={30}
                          />
                        </Box>
                        <Box
                          width={"10%"}
                          display={"flex"}
                          justifyContent={"center"}
                        >
                          {/* <Text align={"center"}></Text> */}
                          <IconButton
                            size={"xs"}
                            icon={
                              d.fullName === expander ? (
                                <Icon as={FaAngleDown} color={"gray.500"} />
                              ) : (
                                <Icon as={FaAngleUp} color={"gray.500"} />
                              )
                            }
                            onClick={() => {
                              if (expander === d.fullName) {
                                setExpander("");
                              } else {
                                setExpander(d.fullName);
                              }
                            }}
                            aria-label={""}
                          />
                        </Box>
                      </div>
                      {expander === d.fullName && (
                        <div
                          style={{
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <Box
                            width={"100%"}
                            display={"flex"}
                            alignItems={"center"}
                          >
                            <Box width={"37%"}>
                              <Text align={"center"} fontSize={"sm"}>
                                {formatting(d.group1, "float")}
                              </Text>
                            </Box>
                            <Box width={"15%"}>
                              <Text align={"center"} fontSize={"sm"}>
                                Effect
                              </Text>
                            </Box>
                            <Box width={"37%"}>
                              <Text align={"center"} fontSize={"sm"}>
                                {formatting(d.group2, "float")}
                              </Text>
                            </Box>
                          </Box>
                        </div>
                      )}
                    </>
                  ))}
            </div>
          </div>
        </div>

        {/* {analysisGroups.length === 0 ? (
          <Text fontSize="md">
            Please select one or more groups from the Trial Group View
          </Text>
        ) : (
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
        )} */}
      </Box>
    </div>
  );
};

export default memo(GroupComparisonView);
