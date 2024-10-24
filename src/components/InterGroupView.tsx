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
import { GrRadialSelected } from "react-icons/gr";
import { MdPushPin } from "react-icons/md";
import { FaLightbulb } from "react-icons/fa";
const InterGroupView = () => {
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
      group1Positive: hp.getPositiveEffect(trialIds1),
      group1Negative: hp.getNegativeEffect(trialIds1),
      trialIds1: trialIds1,
      group2: hp.getEffect(trialIds2),
      group2Positive: hp.getPositiveEffect(trialIds2),
      group2Negative: hp.getNegativeEffect(trialIds2),
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
          <Box width={"20%"}></Box>

          <Box width={"35%"} display={"flex"} justifyContent={"center"}>
            <Text
              align={"center"}
              fontWeight={"bold"}
              alignItems={"center"}
              display={"flex"}
              justifyContent={"center"}
              color={"gray.600"}
            >
              <Icon as={FaLightbulb} color={"gray.600"} mr={1} />
              {currentSelectedGroup ? currentSelectedGroup.name : "None"}
            </Text>
          </Box>
          <Box width={"35%"} display={"flex"} justifyContent={"center"}>
            <Select
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
            {stats && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 0 ",
                  }}
                >
                  <Box width={"20%"}>
                    <Text align={"left"} fontSize={"sm"}>
                      Mean CVRG
                    </Text>
                  </Box>
                  <Box width={"35%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {formatting(stats["mean"].group1, stats["mean"].type)}
                    </Text>
                  </Box>

                  <Box width={"35%"}>
                    <Text align={"center"} fontSize={"sm"}>
                      {formatting(stats["mean"].group2, stats["mean"].type)}
                    </Text>
                  </Box>
                  <Box width={"10%"} display={"flex"} justifyContent={"center"}>
                    {/* <Text align={"center"}></Text> */}
                    <IconButton
                      size={"xs"}
                      icon={
                        "cvrg" === expander ? (
                          <Icon as={FaAngleDown} color={"gray.500"} />
                        ) : (
                          <Icon as={FaAngleUp} color={"gray.500"} />
                        )
                      }
                      onClick={() => {
                        if (expander === "cvrg") {
                          setExpander("");
                        } else {
                          setExpander("cvrg");
                        }
                      }}
                      aria-label={""}
                    />
                  </Box>
                </div>
                {expander === "cvrg" &&
                  ["min", "max"].map((key) => (
                    <div
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: "5px 0",
                      }}
                    >
                      <Box width={"100%"} display={"flex"}>
                        <Box width={"20%"}>
                          <Text fontSize={"sm"}>{key.toUpperCase()} CVRG</Text>
                        </Box>

                        <Box width={"35%"}>
                          <Text align={"center"} fontSize={"sm"}>
                            {formatting(stats[key].group1, "int")}
                          </Text>
                        </Box>
                        <Box width={"35%"}>
                          <Text align={"center"} fontSize={"sm"}>
                            {formatting(stats[key].group2, "int")}
                          </Text>
                        </Box>
                      </Box>
                    </div>
                  ))}
              </>
            )}

            <div style={{ height: "90%", width: "100%", position: "relative" }}>
              {data &&
                data
                  .sort((a, b) => a.pValue - b.pValue)
                  .map((d) => {
                    console.log(d.displayName, d.pValue);
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                          }}
                        >
                          <Box width={"20%"}>
                            <Tooltip label={d.fullName}>
                              <Text
                                display={"flex"}
                                justifyContent={"left"}
                                fontSize={"sm"}
                                alignItems={"center"}
                                userSelect={"none"}
                              >
                                {d.pValue < 0.05 && (
                                  <StarIcon color={"yellow.400"} mr={2} />
                                )}
                                <Icon as={d.icon} mr={1} color={"gray.600"} />
                                {d.name}
                              </Text>
                            </Tooltip>
                          </Box>
                          <Box
                            width={"35%"}
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
                            width={"35%"}
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
                          <Box
                            width={"10%"}
                            display={"flex"}
                            justifyContent={"center"}
                          >
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
                              padding: "5px 0",
                            }}
                          >
                            <Box
                              width={"100%"}
                              display={"flex"}
                              alignItems={"center"}
                            >
                              <Box width={"20%"}>
                                <Text fontSize={"sm"}>Effect (+/-)</Text>
                              </Box>

                              <Box width={"35%"}>
                                <Text align={"center"} fontSize={"sm"}>
                                  {formatting(d.group1Positive, "float")} /{" "}
                                  {formatting(d.group1Negative, "float")}
                                </Text>
                              </Box>

                              <Box width={"35%"}>
                                <Text align={"center"} fontSize={"sm"}>
                                  {formatting(d.group2Positive, "float")} /{" "}
                                  {formatting(d.group2Negative, "float")}
                                </Text>
                              </Box>
                            </Box>
                          </div>
                        )}
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
