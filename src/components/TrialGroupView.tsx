import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Radio,
  RadioGroup,
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
    // const group1 = [
    //   21, 22, 26, 51, 58, 61, 73, 81, 92, 132, 135, 150, 155, 176, 178, 219,
    //   229, 234, 235, 264, 283, 289, 290, 307, 360, 381, 507, 514, 524, 531, 532,
    //   546, 571, 622, 722, 723, 757, 765, 767, 770, 773, 777, 780, 800, 887, 891,
    //   893, 900, 908, 922, 923, 928, 937, 941, 947, 949, 956, 982, 988, 989,
    //   1000, 1101, 1104, 1108, 1114, 1130, 1141, 1154, 1166, 1170, 1181, 1184,
    //   1287, 1296, 1301, 1318, 1335, 1338, 1349, 1366, 1367, 1500, 1542, 1556,
    //   1575, 1607, 1658, 1680, 1689, 1927, 1949, 1954, 2052, 2062, 2063, 2076,
    //   2112,
    // ];
    // const group2 = [
    //   9, 12, 16, 20, 23, 25, 27, 29, 31, 34, 35, 37, 41, 44, 62, 65, 67, 69, 75,
    //   78, 79, 82, 87, 88, 105, 110, 114, 116, 117, 118, 120, 139, 142, 144, 146,
    //   149, 154, 156, 166, 167, 168, 169, 171, 173, 175, 181, 186, 188, 190, 193,
    //   195, 199, 205, 206, 213, 227, 231, 233, 239, 243, 245, 246, 248, 249, 251,
    //   252, 266, 268, 270, 284, 291, 292, 298, 300, 302, 303, 318, 319, 320, 324,
    //   341, 348, 351, 352, 357, 358, 364, 374, 382, 386, 391, 396, 400, 417, 418,
    //   433, 436, 448, 475, 496, 501, 505, 509, 510, 515, 518, 526, 529, 533, 543,
    //   545, 562, 569, 570, 578, 580, 585, 590, 592, 597, 605, 606, 612, 613, 616,
    //   626, 627, 646, 651, 656, 666, 674, 676, 682, 712, 721, 724, 729, 738, 747,
    //   748, 751, 758, 759, 766, 768, 769, 772, 774, 779, 781, 784, 786, 787, 795,
    //   796, 801, 810, 813, 816, 866, 868, 881, 882, 889, 892, 896, 898, 902, 904,
    //   905, 913, 915, 916, 917, 924, 926, 930, 935, 936, 939, 954, 966, 968, 969,
    //   974, 987, 995, 999, 1001, 1007, 1008, 1022, 1030, 1047, 1049, 1050, 1056,
    //   1057, 1059, 1066, 1067, 1072, 1074, 1080, 1084, 1095, 1097, 1105, 1107,
    //   1110, 1111, 1113, 1115, 1117, 1120, 1124, 1127, 1128, 1132, 1138, 1139,
    //   1142, 1143, 1146, 1164, 1167, 1175, 1186, 1187, 1197, 1206, 1213, 1214,
    //   1239, 1249, 1262, 1268, 1277, 1278, 1280, 1284, 1286, 1299, 1302, 1306,
    //   1316, 1319, 1320, 1321, 1332, 1333, 1340, 1344, 1348, 1356, 1395, 1409,
    //   1412, 1415, 1420, 1429, 1435, 1445, 1448, 1465, 1495, 1519, 1539, 1541,
    //   1660, 1662, 1688, 1693, 1719, 1724, 1729, 1748, 1750, 1754, 1756, 1784,
    //   1798, 1813, 1847, 1854, 1864, 1887, 1917, 1919, 1945, 1960, 1970, 1975,
    //   1980, 2000, 2005, 2013, 2020, 2025, 2026, 2027, 2056, 2080, 2088, 2099,
    //   2117, 2174, 2189,
    // ];

    // const group3 = [
    //   0, 9, 27, 62, 65, 67, 75, 85, 86, 98, 100, 129, 130, 142, 166, 168, 173,
    //   185, 187, 198, 207, 210, 224, 232, 250, 254, 266, 268, 284, 300, 318, 321,
    //   348, 358, 367, 378, 396, 401, 411, 412, 469, 473, 484, 491, 510, 543, 556,
    //   575, 580, 582, 605, 620, 656, 670, 682, 685, 686, 702, 745, 748, 749, 776,
    //   784, 790, 795, 796, 821, 847, 856, 861, 866, 874, 879, 892, 898, 902, 905,
    //   907, 913, 917, 921, 926, 935, 954, 973, 983, 986, 987, 997, 1009, 1013,
    //   1017, 1022, 1034, 1047, 1052, 1058, 1066, 1072, 1077, 1083, 1087, 1107,
    //   1109, 1122, 1124, 1132, 1136, 1139, 1149, 1150, 1152, 1172, 1175, 1177,
    //   1180, 1187, 1196, 1197, 1220, 1233, 1237, 1240, 1259, 1263, 1270, 1274,
    //   1339, 1353, 1364, 1370, 1374, 1379, 1391, 1395, 1431, 1435, 1442, 1464,
    //   1465, 1468, 1484, 1495, 1502, 1506, 1508, 1510, 1534, 1541, 1567, 1568,
    //   1573, 1580, 1581, 1593, 1605, 1621, 1660, 1694, 1700, 1705, 1706, 1732,
    //   1738, 1742, 1746, 1757, 1772, 1781, 1784, 1787, 1802, 1829, 1871, 1882,
    //   1909, 1910, 1914, 1920, 1946, 1948, 1973, 1990, 2026, 2035, 2048, 2053,
    //   2068, 2078, 2080, 2085, 2092, 2093, 2100, 2131, 2143, 2144, 2149, 2162,
    //   2175, 2179, 2193, 2198,
    // ];

    // const group4 = [
    //   8, 15, 19, 32, 43, 60, 66, 68, 72, 83, 94, 108, 112, 119, 159, 165, 189,
    //   200, 211, 214, 220, 241, 242, 275, 281, 285, 295, 306, 309, 316, 327, 346,
    //   368, 394, 403, 405, 431, 455, 468, 503, 508, 512, 513, 516, 517, 519, 522,
    //   560, 584, 587, 614, 628, 633, 634, 639, 642, 650, 658, 661, 672, 674, 675,
    //   699, 705, 716, 718, 734, 742, 756, 762, 782, 788, 789, 791, 792, 793, 811,
    //   839, 841, 844, 854, 875, 876, 878, 880, 884, 885, 895, 927, 943, 967, 970,
    //   972, 981, 984, 990, 992, 1024, 1025, 1028, 1035, 1036, 1073, 1075, 1158,
    //   1159, 1179, 1198, 1201, 1266, 1271, 1282, 1326, 1330, 1358, 1362, 1387,
    //   1394, 1399, 1401, 1414, 1428, 1430, 1434, 1470, 1515, 1517, 1520, 1543,
    //   1558, 1570, 1585, 1589, 1600, 1602, 1623, 1627, 1638, 1643, 1659, 1679,
    //   1716, 1731, 1755, 1782, 1818, 1823, 1834, 1840, 1861, 1875, 1885, 1895,
    //   1911, 1912, 1915, 1950, 1951, 1964, 1971, 1974, 1997, 2010, 2016, 2041,
    //   2042, 2043, 2060, 2067, 2081, 2111, 2152, 2153, 2160, 2164, 2167, 2169,
    //   2177, 2178, 2199,
    // ];
    // const group5 = [
    //   20, 30, 39, 76, 84, 88, 90, 102, 105, 116, 127, 128, 152, 184, 192, 209,
    //   221, 225, 227, 231, 247, 257, 265, 269, 278, 293, 298, 299, 303, 329, 352,
    //   363, 390, 393, 398, 400, 417, 421, 428, 458, 498, 502, 515, 538, 545, 562,
    //   567, 590, 594, 601, 607, 623, 626, 631, 646, 657, 668, 673, 677, 679, 688,
    //   746, 759, 768, 779, 781, 819, 822, 823, 836, 838, 850, 853, 865, 867, 899,
    //   915, 929, 946, 950, 957, 994, 995, 996, 1010, 1027, 1050, 1055, 1060,
    //   1081, 1082, 1096, 1098, 1102, 1103, 1118, 1120, 1128, 1157, 1169, 1193,
    //   1213, 1215, 1219, 1230, 1239, 1249, 1276, 1286, 1295, 1298, 1299, 1304,
    //   1307, 1320, 1322, 1324, 1327, 1332, 1344, 1348, 1403, 1429, 1433, 1436,
    //   1438, 1444, 1454, 1459, 1467, 1488, 1501, 1509, 1528, 1530, 1535, 1545,
    //   1547, 1551, 1587, 1609, 1628, 1636, 1649, 1662, 1666, 1671, 1673, 1702,
    //   1725, 1733, 1734, 1737, 1747, 1771, 1815, 1836, 1839, 1845, 1849, 1860,
    //   1917, 1922, 1934, 1942, 1979, 1980, 1989, 1992, 1994, 2017, 2022, 2031,
    //   2046, 2061, 2074, 2090, 2134, 2154, 2155, 2158, 2161, 2170, 2196,
    // ];
    // updatedGroups.addGroup(
    //   exp?.trials.filter((t) => group1.includes(t.id)) ?? [],
    //   "Good1"
    // );
    // updatedGroups.addGroup(
    //   exp?.trials.filter((t) => group2.includes(t.id)) ?? [],
    //   "Good2"
    // );

    // updatedGroups.addGroup(
    //   exp?.trials.filter((t) => group3.includes(t.id)) ?? [],
    //   "random-path"
    // );

    // updatedGroups.addGroup(
    //   exp?.trials.filter((t) => group4.includes(t.id)) ?? [],
    //   "dfs"
    // );
    // updatedGroups.addGroup(
    //   exp?.trials.filter((t) => group5.includes(t.id)) ?? [],
    //   "bfs"
    // );

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
        <RadioGroup
          onChange={(e) => setHeatmapType(e as "union" | "difference")}
          value={heatmapType}
          pr={2}
        >
          <Radio value="difference" mr={2}>
            <Text fontSize="xs" color="gray.600">
              # of different parameters
            </Text>
          </Radio>
          <Radio value="union">
            <Text fontSize="xs" color="gray.600">
              Increase in accumulated CVRG
            </Text>
          </Radio>
        </RadioGroup>

        {/* <FormControl
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
            size={"sm"}
          />
        </FormControl> */}
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
