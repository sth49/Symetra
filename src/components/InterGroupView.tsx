import { Box, Heading, Icon, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { memo, useEffect, useMemo, useState } from "react";
import { formatting } from "../model/utils";
import { performStatisticalTest } from "../model/statistic";
import { useConstDataStore } from "./store/constDataStore";
import { Select } from "@chakra-ui/react";
import BarChart from "./BarChart";
import { Tooltip } from "@chakra-ui/react";
import { TbCircleDotted, TbCircleFilled } from "react-icons/tb";

import { useMetricScale } from "../model/colorScale";
import AreaChart from "./AreaChart";
const InterGroupView = () => {
  const { exp } = useConstDataStore();
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const groups = useCustomStore((state) => state.groups);
  const { colorScale, metricScale } = useMetricScale();
  const [group2, setGroup2] = useState(
    groups.groups.filter((group) => {
      if (currentSelectedGroup) {
        return group.id !== currentSelectedGroup.id;
      }
      return false;
    })[0]
  );

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
      pValue:
        performStatisticalTest(
          currentSelectedGroup.getHyperparam(hp.name),
          group2.getHyperparam(hp.name),
          hp.type,
          hp
        ).pValue || 1,
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
          Inter Group Difference
        </Heading>
      </Box>

      <Box
        w={"100%"}
        height={`calc(100% - 36px)`}
        p={1}
        pt={0}
        overflow={"auto"}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #ddd",
            paddingRight: "4px",
          }}
        >
          <Box width={"20%"}></Box>

          <Box width={"40%"} display={"flex"} justifyContent={"center"}>
            <Text
              align={"center"}
              fontWeight={"bold"}
              alignItems={"center"}
              display={"flex"}
              justifyContent={"center"}
              color={"gray.600"}
            >
              <Box position="relative" width="24px" height="24px">
                <Icon
                  as={TbCircleFilled}
                  color={
                    currentSelectedGroup &&
                    colorScale(
                      metricScale(currentSelectedGroup.getStats().avg) || 0
                    )
                  }
                  opacity={0.7}
                  position="absolute"
                  left="50%"
                  top="50%"
                  transform="translate(-50%, -50%)"
                />
                <Icon
                  as={TbCircleDotted}
                  color={"gray.600"}
                  position="absolute"
                  left="50%"
                  top="50%"
                  transform="translate(-50%, -50%)"
                />
              </Box>
              {currentSelectedGroup ? currentSelectedGroup.name : "None"}
            </Text>
          </Box>
          <Box width={"40%"} display={"flex"} justifyContent={"center"}>
            <Select
              w={"85%"}
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
        </div>
        <div
          style={{
            height: "calc(100% - 35px)",
            width: "100%",
            position: "relative",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          <div style={{ height: "90%", width: "100%", position: "relative" }}>
            {stats && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 0",
                  }}
                  className="inter-group-view-item"
                >
                  <Box width={"20%"} pl={2}>
                    <Text fontSize={"sm"}>Count</Text>
                  </Box>
                  <Box width={"40%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {/* {formatting(stats["mean"].group1, stats["mean"].type)} */}
                      {formatting(currentSelectedGroup.trials.length, "int")}
                    </Text>
                  </Box>

                  <Box width={"40%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {/* {formatting(stats["mean"].group2, stats["mean"].type)} */}
                      {formatting(group2.trials.length, "int")}
                    </Text>
                  </Box>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 0",
                  }}
                  className="inter-group-view-item"
                >
                  <Box width={"20%"} pl={2}>
                    <Text fontSize={"sm"}>Mean CVRG</Text>
                  </Box>
                  <Box
                    width={"40%"}
                    background={colorScale(
                      metricScale(stats["mean"].group1) || 0
                    )}
                    color={stats["mean"].group1 < 1000 ? "white" : "black"}
                  >
                    <Text align={"center"} fontSize={"sm"}>
                      {formatting(stats["mean"].group1, stats["mean"].type)}
                    </Text>
                  </Box>

                  <Box
                    width={"40%"}
                    background={colorScale(
                      metricScale(stats["mean"].group2) || 0
                    )}
                    color={stats["mean"].group2 < 1000 ? "white" : "black"}
                  >
                    <Text align={"center"} fontSize={"sm"}>
                      {formatting(stats["mean"].group2, stats["mean"].type)}
                    </Text>
                  </Box>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 0",
                  }}
                  className="inter-group-view-item"
                >
                  <Box width={"20%"} pl={2}>
                    <Text fontSize={"sm"}>Covered Branch</Text>
                  </Box>
                  <Box width={"40%"} height={"35px"}>
                    <AreaChart trialGroup={currentSelectedGroup} />
                  </Box>

                  <Box width={"40%"} height={"35px"}>
                    <AreaChart trialGroup={group2} />
                  </Box>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 0",
                  }}
                  className="inter-group-view-item"
                >
                  <Box width={"20%"} pl={2}>
                    <Text fontSize={"sm"}>Covered Branch</Text>
                  </Box>
                  <Box width={"80%"} height={"35px"} position={"relative"}>
                    <AreaChart trialGroup={currentSelectedGroup} />
                    <Box
                      width={"100%"}
                      height={"35px"}
                      position={"absolute"}
                      left="50%"
                      top="50%"
                      transform="translate(-50%, -50%)"
                    >
                      <AreaChart trialGroup={group2} />
                    </Box>
                  </Box>
                </div>
              </>
            )}

            <div style={{ height: "90%", width: "100%", position: "relative" }}>
              {data &&
                data
                  .sort((a, b) => a.pValue - b.pValue)
                  .map((d) => {
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            height: "35px",
                          }}
                          className="inter-group-view-item"
                        >
                          <Box
                            width={"20%"}
                            display={"flex"}
                            alignItems={"center"}
                            pl={2}
                          >
                            <Tooltip label={d.fullName}>
                              <Text
                                display={"flex"}
                                justifyContent={"left"}
                                fontSize={"sm"}
                                alignItems={"center"}
                                userSelect={"none"}
                              >
                                <Icon as={d.icon} mr={1} color={"gray.600"} />
                                {d.name}
                                {d.pValue < 0.05 && (
                                  <Text color={"red.600"}>*</Text>
                                )}
                              </Text>
                            </Tooltip>
                          </Box>
                          <Box
                            width={"40%"}
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
                          </Box>
                          <Box
                            width={"40%"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                          >
                            <BarChart
                              dist={d.dist}
                              trialIds={d.trialIds2}
                              width={90}
                              height={30}
                            />
                          </Box>
                        </div>
                      </>
                    );
                  })}
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
};

export default memo(InterGroupView);
