import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { memo, useEffect, useMemo, useState } from "react";
import { formatting } from "../model/utils";
import { performStatisticalTest } from "../model/statistic";
import { useConstDataStore } from "./store/constDataStore";
import { Select } from "@chakra-ui/react";
import BarChart from "./BarChart";
import { Tooltip } from "@chakra-ui/react";

import AreaChart from "./AreaChart";
import MetricBadge from "./MetricBadge";
import SelectIcon from "./SelectIcon";
const InterGroupView = () => {
  const { exp } = useConstDataStore();
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const [sortDirection, setSortDirection] = useState("htl");
  const groups = useCustomStore((state) => state.groups);
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
      Max: {
        group1: group1Stats.max,
        group2: group2Stats.max,
        type: "int",
      },
      Mean: {
        group1: group1Stats.avg,
        group2: group2Stats.avg,
        type: "float",
      },
      Min: {
        group1: group1Stats.min,
        group2: group2Stats.min,
        type: "int",
      },
    };
  }, [currentSelectedGroup, group2]);

  const insignificantHparams = useMemo(() => {
    if (!currentSelectedGroup || !exp) {
      return [];
    }
    return exp.hyperparams
      .map((hp) => {
        return {
          name: hp.name,
          pValue:
            performStatisticalTest(
              currentSelectedGroup.getHyperparam(hp.name),
              hp.values,
              hp.type,
              hp
            ).pValue || 1,
        };
      })
      .filter((d) => d.pValue > 0.05)
      .map((d) => d.name);
  }, [currentSelectedGroup, exp]);
  const [visible, setVisible] = useState(false);

  const data = useMemo(() => {
    if (!currentSelectedGroup || !group2) {
      return null;
    }
    const trialIds1 =
      (currentSelectedGroup &&
        currentSelectedGroup.trials.map((trial) => trial.id)) ||
      [];
    const trialIds2 = (group2 && group2.trials.map((trial) => trial.id)) || [];

    return exp?.hyperparams
      .map((hp, index) => {
        console.log("HP:", hp);
        return {
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

          allpValue: performStatisticalTest(
            currentSelectedGroup.getHyperparam(hp.name),
            hp.values,
            hp.type,
            hp
          ).pValue,
        };
      })
      .filter((d) => {
        if (visible) {
          return insignificantHparams.includes(d.fullName) ? false : true;
        }
        return true;
      });
  }, [
    currentSelectedGroup,
    exp?.hyperparams,
    group2,
    insignificantHparams,
    visible,
  ]);

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
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"center"}
        >
          Inter Group Difference {"("}
          <SelectIcon />
          {currentSelectedGroup?.name} {" )"}
        </Heading>
      </Box>

      <Box style={{ height: "80px" }} p={2}>
        <FormControl
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <FormLabel htmlFor="metric-switch" mr={1} width={"50%"}>
            <Text fontSize="xs" color="gray.600">
              Sorted by difference between groups
            </Text>
          </FormLabel>

          <Select
            placeholder=""
            size={"xs"}
            width={"40%"}
            onChange={(e) => setSortDirection(e.target.value)}
            value={sortDirection}
          >
            <option value="htl">large to small</option>
            <option value="lth">small to large</option>
          </Select>
        </FormControl>
        <Box display={"flex"}>
          <Text color={"red.600"} mr={1}>
            *
          </Text>
          <Text fontSize={"xs"} color={"gray.600"}>
            two groups are statistically different (
            {data?.filter((d) => d.pValue < 0.05).length || 0} / {data?.length})
          </Text>
        </Box>
        <Box display={"flex"}>
          <Text color={"blue.600"} mr={1}>
            *
          </Text>
          <Text fontSize={"xs"} color={"gray.600"}>
            the Top 10% group is significantly different from the all trials (
            {data?.filter((d) => d.allpValue < 0.05).length || 0} /{" "}
            {data?.length})
          </Text>
        </Box>
        {/* <FormControl
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <FormLabel htmlFor="metric-switch" mr={1} width={"50%"}>
            <Text fontSize="xs" color="gray.600">
              Hide insignificant difference {`(${insignificantHparams.length})`}
            </Text>
          </FormLabel>
          <Switch
            id="metric-switch"
            onChange={() => setVisible(!visible)}
            isChecked={visible}
            size={"sm"}
          />
        </FormControl> */}
      </Box>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          paddingRight: "4px",
          paddingBottom: "4px",
        }}
      >
        <Box width={"30%"}></Box>

        <Box width={"35%"} display={"flex"} justifyContent={"center"}>
          <Text
            align={"center"}
            fontWeight={"bold"}
            alignItems={"center"}
            display={"flex"}
            justifyContent={"center"}
            color={"gray.600"}
          >
            <SelectIcon />
            {currentSelectedGroup ? currentSelectedGroup.name : "None"}
          </Text>
        </Box>
        <Box width={"35%"} display={"flex"} justifyContent={"center"}>
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

      <Box
        w={"100%"}
        height={`calc(100% - 36px - 36px - 90px)`}
        p={1}
        pt={0}
        overflow={"auto"}
      >
        <div style={{ width: "100%", position: "relative" }}>
          {stats && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                  height: "35px",
                }}
                className="inter-group-view-item"
              >
                <Box width={"30%"} pl={2}>
                  <Text fontSize={"sm"}>Size</Text>
                </Box>
                <Box width={"35%"}>
                  <Text align={"center"} fontSize={"sm"}>
                    {formatting(currentSelectedGroup.trials.length, "int")}{" "}
                    trials
                  </Text>
                </Box>

                <Box width={"35%"}>
                  <Text align={"center"} fontSize={"sm"}>
                    {formatting(group2.trials.length, "int")} trials
                  </Text>
                </Box>
              </div>

              {Object.keys(stats).map((key) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 0",
                    height: "35px",
                  }}
                  className="inter-group-view-item"
                >
                  <Box width={"30%"} pl={2}>
                    <Text fontSize={"sm"}>{key} Coverage</Text>
                  </Box>
                  <Box
                    width={"35%"}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MetricBadge
                      metricValue={stats[key].group1}
                      type={stats[key].type}
                    />
                  </Box>

                  <Box
                    width={"35%"}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MetricBadge
                      metricValue={stats[key].group2}
                      type={stats[key].type}
                    />
                  </Box>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "5px 0",
                    }}
                    className="inter-group-view-item"
                  ></div>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                }}
                className="inter-group-view-item"
              >
                <Box width={"30%"} pl={2}>
                  <Text fontSize={"sm"}>Covered Branch</Text>
                </Box>
                <Box width={"35%"} height={"25px"} pr={1} pl={1}>
                  <AreaChart trialGroup={currentSelectedGroup} />
                </Box>

                <Box width={"35%"} height={"25px"} pr={1} pl={1}>
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
                <Box width={"30%"} pl={2}>
                  <Text fontSize={"sm"}>Superimposed</Text>
                </Box>
                <Box
                  width={"70%"}
                  height={"25px"}
                  position={"relative"}
                  pr={1}
                  pl={1}
                >
                  <AreaChart trialGroup={currentSelectedGroup} />
                  <Box
                    width={"100%"}
                    height={"25px"}
                    position={"absolute"}
                    left="50%"
                    top="50%"
                    transform="translate(-50%, -50%)"
                    pr={1}
                    pl={1}
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
                // .sort((a, b) => a.pValue - b.pValue)
                .sort((a, b) => {
                  if (sortDirection === "htl") {
                    return a.pValue - b.pValue;
                  }
                  return b.pValue - a.pValue;
                })
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
                              {d.allpValue < 0.05 && (
                                <Text color={"blue.600"}>*</Text>
                              )}
                            </Text>
                          </Tooltip>
                        </Box>
                        <Box
                          width={"40%"}
                          display={"flex"}
                          justifyContent={"space-around"}
                          alignItems={"center"}
                          p={"0 4px"}
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
                          p={"0 4px"}
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
      </Box>
    </div>
  );
};

export default memo(InterGroupView);
