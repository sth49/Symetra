import { Box, Heading } from "@chakra-ui/react";
import { useEffect } from "react";
import TrialGroupGraph from "./TrialGroupGraph";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import GroupDetailView from "./GroupDetailView";
import { Groups } from "../model/group";

const TrialGroupView = () => {
  // const [visible, setVisible] = useState(true);
  const { exp } = useConstDataStore();
  const setGroups = useCustomStore((state) => state.setGroups);
  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  useEffect(() => {
    console.log("TrialGroupView initialized");
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

    if (exp.name === "grep_2200") {
      console.log("setting for figure");
      // const group1 = [
      //   358, 1068, 921, 1272, 1159, 492, 776, 1743, 869, 969, 1448, 1838, 1137,
      //   1635, 819, 1050, 646, 732, 1494, 1209, 1355, 1154, 1269, 1896, 2148,
      //   603, 943, 1278, 1780, 1045, 1242, 997, 1537, 878, 965, 1036, 472, 1484,
      //   918, 1174, 2010, 706, 1247, 915, 1303, 1634, 1066, 1702, 450, 1958,
      //   1001, 1570, 1802, 1971, 567, 1607, 1252, 730, 1522, 1589, 572, 861,
      //   1584, 2177, 2001, 800, 1505, 816, 1752, 1520, 1526, 1390, 1983, 485,
      //   607, 1633, 1707, 1402, 1327, 902, 1070, 1994, 2145, 2158, 1145, 1213,
      //   957, 474, 893, 933, 2054, 2172, 1324, 1035, 629, 617, 1809, 615, 1266,
      //   1816, 886, 1611, 897, 1074, 1992, 1939, 1995, 1493, 1348, 2018, 503,
      //   434, 604, 938, 1025, 1206, 1723, 654, 523, 2194, 1007, 1791, 1335, 1744,
      //   1432, 647, 1832, 1827, 771, 1844, 1263, 1419, 1814, 1713, 1231, 1819,
      //   1495, 851, 1259, 1807, 1211, 1065, 814, 1017, 2125, 1867, 1677, 2045,
      //   1663, 1341, 1175, 1228, 475, 755, 774,
      // ];

      // const group2 = [
      //   726, 1771, 686, 1781, 937, 697, 447, 1467, 583, 2165, 531, 1825, 651,
      //   703, 1225, 1854, 848, 853, 1264, 1747, 1826, 2063, 684, 1184, 483, 2015,
      //   2114, 930, 1346, 622, 1245, 1486, 1063, 945, 541, 780, 1978, 1911, 2168,
      //   731, 738, 2188, 1117, 590, 866, 723, 954, 2061, 366, 2016, 1727, 581,
      //   1320, 1055, 1433, 880, 926, 1891, 1786, 1656, 2021, 993, 753, 1955,
      //   1851, 1575, 1527, 1967, 1442, 1554, 1846, 1127, 1280, 1401, 1322, 2050,
      //   2135, 1881, 595, 452, 837, 1447, 1240, 1232, 1836, 1921, 793, 2012,
      // ];

      const group1 = [1827, 2049, 1070, 2188, 1084, 1470, 406, 2006, 951, 1384];

      const group2 = [
        7, 11, 14, 31, 63, 93, 116, 122, 149, 152, 158, 204, 208, 211, 224, 233,
        235, 259, 264, 307, 310, 315, 324, 328, 341, 342, 345, 347, 350, 352,
        384, 388, 408, 412, 413, 1642, 1739, 2190,
      ];
      // updatedGroups.addGroup(
      //   exp?.trials.filter((t) => group1.includes(t.id)) ?? [],
      //   "First Top"
      // );

      updatedGroups.addGroup(
        exp?.trials.filter((t) => group1.includes(t.id)) ?? [],
        "Few Trials"
      );
      updatedGroups.addGroup(
        exp?.trials.filter((t) => group2.includes(t.id)) ?? [],
        "Zero CVRG"
      );
    }
    setGroups(updatedGroups);

    setCurrnetSelectedGroup(updatedGroups.groups[0]);
  }, [exp]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial Group View
        </Heading>
      </Box>
      <Box height={`calc(100% - 35px - 65px)`}>
        <TrialGroupGraph />
      </Box>
      <GroupDetailView />
    </div>
  );
};

export default TrialGroupView;
