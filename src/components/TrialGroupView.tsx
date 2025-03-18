import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import GroupDetailView from "./GroupDetailView";
import { Groups } from "../model/group";
import TrialGroupTable from "./TrialGroupTable";
import { performStatisticalTest } from "../model/statistic";

import * as d3 from "d3";
import { formatting } from "../model/utils";
const TrialGroupView = () => {
  // const [visible, setVisible] = useState(true);
  const { exp } = useConstDataStore();
  const setGroups = useCustomStore((state) => state.setGroups);
  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );

  useEffect(() => {
    const updatedGroups = new Groups();

    updatedGroups.addGroup(exp?.trials, "All");

    updatedGroups.addGroup(
      exp?.trials
        .sort((a, b) => b.metric - a.metric)
        .slice(0, exp?.trials.length * 0.1) ?? [],
      "Top 10%"
    );
    updatedGroups.addGroup(
      exp?.trials
        .sort((a, b) => a.metric - b.metric)
        .slice(0, exp?.trials.length * 0.1) ?? [],
      "Bottom 10%"
    );

    // const group1 = [
    //   774, 755, 1228, 475, 1175, 1341, 2012, 2031, 793, 1677, 1663, 1867, 2045,
    //   483, 2125, 595, 1836,
    // ];

    // updatedGroups.addGroup(
    //   exp?.trials.filter((t) => group1.includes(t.id)) ?? [],
    //   "Group 1"
    // );

    // if (exp.name === "gcal_2200") {
    //   const group1 = [
    //     1963, 534, 950, 2085, 1163, 1936, 1698, 2121, 1689, 774, 1190, 1375,
    //     1565, 510, 766, 1358, 1616, 809, 535, 931, 22, 1150, 517, 73, 730, 937,
    //     236, 230, 991, 235, 58, 629, 1327, 1117, 932, 1123, 1175, 1110, 284,
    //     132, 1139, 61, 779, 155, 92, 900, 909, 1179, 786,
    //   ];

    //   const group2 = [
    //     788, 246, 403, 234, 1728, 1258, 321, 421, 548, 536, 1075, 1206, 1248,
    //     633, 182, 399, 377, 187, 546, 825, 565, 1065, 1058, 105, 1341, 1148,
    //     819, 394, 777, 267, 1223, 1287, 9, 611, 1119, 355, 2089, 69, 911, 228,
    //     269, 1129, 117, 810, 914, 891, 944, 1141, 1126, 285, 1008, 67, 142, 977,
    //     27, 244, 619, 583, 913, 20, 25, 1222,
    //   ];

    //   const group3 = [
    //     93, 129, 260, 266, 279, 322, 333, 431, 443, 450, 460, 670, 676, 685,
    //     727, 874, 955, 970, 982, 1047, 1053, 1054, 1074, 1082, 1107, 1264, 1313,
    //     1618, 2133, 1070,
    //   ];

    //   const group4 = [
    //     10, 11, 59, 71, 134, 162, 171, 237, 357, 365, 409, 434, 463, 464, 514,
    //     642, 644, 648, 660, 687, 716, 735, 740, 772, 785, 787, 841, 844, 846,
    //     886, 923, 930, 945, 952, 984, 999, 1002, 1061, 1096, 1097, 1115, 1290,
    //     1640, 1644, 1655, 1663, 1695, 1699, 1704, 1716, 1735, 1737, 1747, 1781,
    //     1784, 1788, 1789, 1790, 1797, 1800, 1802, 1805, 1834, 1844, 1855, 1857,
    //     1877, 1881, 1882, 1900, 1925, 1934, 1976, 1985, 1994, 1996, 2002, 2018,
    //     2021, 2097, 2117, 2123, 2126, 2134, 2140, 2198,
    //   ];

    //   updatedGroups.addGroup(
    //     exp?.trials.filter((t) => group1.includes(t.id)) ?? [],
    //     "Best 2%"
    //   );
    //   updatedGroups.addGroup(
    //     exp?.trials.filter((t) => group2.includes(t.id)) ?? [],
    //     "Second Best"
    //   );

    //   updatedGroups.addGroup(
    //     exp?.trials.filter((t) => group3.includes(t.id)) ?? [],
    //     "Third Best"
    //   );

    //   updatedGroups.addGroup(
    //     exp?.trials.filter((t) => group4.includes(t.id)) ?? [],
    //     "Bad"
    //   );
    // }

    setGroups(updatedGroups);

    setCurrnetSelectedGroup(updatedGroups.groups[0]);
  }, [exp]);

  const groups = useCustomStore((state) => state.groups);

  const groupNames = useMemo(() => {
    return groups.groups.map((group) => group.name);
  }, [groups]);

  const { hyperparams } = useConstDataStore();

  const [heatmapType, setHeatmapType] = useState<"union" | "difference">(
    "difference"
  );

  const heatmapData = useMemo(() => {
    return groups.groups
      .map((group) => {
        const groupData = groups.groups.map((g) => {
          if (group.id === g.id) {
            return 0;
          }
          const differences = hyperparams.map((param) => {
            const group1 = group.getHyperparam(param.name);
            const group2 = g.getHyperparam(param.name);
            return {
              param: param.name,
              ...performStatisticalTest(group1, group2, param.type, param),
            };
          });

          const diffCount =
            heatmapType === "difference"
              ? differences.filter(
                  (d) => d.interpretationLevel > 1 && d.pValue < 0.05
                ).length
              : new Set([...group.getUnion(), ...g.getUnion()]).size -
                Math.max(
                  new Set([...group.getUnion()]).size,
                  new Set([...g.getUnion()]).size
                );

          return diffCount;
        });
        return groupData;
      })
      .flat();
  }, [groups.groups, heatmapType, hyperparams]);

  const minValue = Math.min(...heatmapData);
  const maxValue = Math.max(...heatmapData);

  const gradientStops = useMemo(() => {
    return d3.range(0, 1.01, 0.1).map((t) => {
      const value = minValue + t * (maxValue - minValue);
      const color = d3
        .scaleSequential(
          heatmapType === "union" ? d3.interpolateGreens : d3.interpolateRdPu
        )
        .domain([minValue, maxValue])(value);
      return { offset: `${t * 100}%`, color };
    });
  }, [minValue, maxValue, heatmapType]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial Group View
        </Heading>

        <FormControl
          display="flex"
          justifyContent="right"
          alignItems="center"
          width="300px"
          pr={2}
        >
          <FormLabel htmlFor="heatmapType-switch" mb={0} mr={1}>
            <Text fontSize="xs" color="gray.600">
              Show union coverage
            </Text>
          </FormLabel>
          <Switch
            id="heatmapType-switch"
            onChange={() =>
              setHeatmapType((prev) =>
                prev === "union" ? "difference" : "union"
              )
            }
            isChecked={heatmapType === "union"}
            // onChange={() => setIsPreference(!isPreference)}
            // isChecked={isPreference}
            size={"sm"}
          />
        </FormControl>
      </Box>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        w={"100%"}
        height={"25px"}
        padding={"0 8px"}
      >
        <Text fontSize="xs" color="gray.600">
          {heatmapType === "union"
            ? "Increase in accumulated CVRG when merged:"
            : "# of statistically different parameters:"}
        </Text>

        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Text fontSize="xs" color={"gray.600"} textAlign={"center"}>
            {heatmapType === "union" ? "min" : "similar"} (
            {formatting(minValue, "int")})
          </Text>
          <svg width="180" height="16">
            <defs>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                {gradientStops.map((stop, i) => (
                  <stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <rect x="5" width="170" height="16" fill="url(#gradient2)" />
          </svg>

          <Text fontSize="xs" color={"gray.600"} textAlign={"center"}>
            {heatmapType === "union" ? "max" : "dissimilar"} (
            {formatting(maxValue, "int")})
          </Text>
        </Box>
      </Box>
      <Box
        height={`calc(100% - 35px - 65px - 5px)`}
        style={{
          display: "flex",
          position: "relative",
        }}
      >
        <Box style={{ position: "relative", zIndex: 0 }}>
          <TrialGroupTable heatmapType={heatmapType} />
        </Box>
        <Box
          flex={1}
          height={65}
          width={`calc(100% - 305px)`}
          position={"absolute"}
          zIndex={2}
          marginTop={"-10px"}
          marginLeft={"305px"}
        >
          <svg width={"100%"} height={"100%"}>
            {groupNames.map((name, i) => {
              return (
                <>
                  <text
                    key={i}
                    x={15 + i * 30}
                    y={64} // rect의 높이(66px)에 맞춤
                    fill={"black"}
                    fontSize={10}
                    textAnchor="end" // 텍스트 앵커 포인트를 시작점으로 설정
                    dominantBaseline="text-after-edge" // 텍스트 기준선을 텍스트 하단으로 설정
                    transform={`rotate(45, ${15 + i * 30}, 55)`} // 회전 중심을 바닥에 맞춤
                  >
                    {name}
                  </text>
                  {/* <line
                    x1={22.5 + i * 45}
                    y1={0}
                    x2={22.5 + i * 45}
                    y2={"120%"}
                    stroke={"#ccc"}
                    strokeWidth={1}
                    // transform={`rotate(-45, ${22.5 + i * 45}, 60)`}
                  ></line> */}
                </>
              );
            })}
          </svg>
        </Box>
      </Box>
      <Box
        width={"98%"}
        height={"5px"}
        borderTop={"1px solid #ddd"}
        ml={"1%"}
      ></Box>
      <GroupDetailView />
    </div>
  );
};

export default TrialGroupView;
