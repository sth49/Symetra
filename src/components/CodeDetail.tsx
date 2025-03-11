import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Text,
} from "@chakra-ui/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useCustomStore } from "../store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConstDataStore } from "./store/constDataStore";
import { BranchInfo } from "../model/experiment";

import CodeFileTable from "./CodeFileTable";
import SelectIcon from "./SelectIcon";

function CodeDetail() {
  const setSelectBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );
  const experiment = useConstDataStore((state) => state.exp);

  useEffect(() => {
    setSelectBranchId(experiment.branchInfo[0].branch);
  }, [experiment, setSelectBranchId]);

  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  // const data = useMemo(() => {
  //   const branchCount = {};
  //   experiment.branchInfo.forEach((branch) => {
  //     if (branchCount[branch.filePath]) {
  //       branchCount[branch.filePath]++;
  //     } else {
  //       branchCount[branch.filePath] = 1;
  //     }
  //   });

  //   if (!currentSelectedGroup || !currentSelectedGroup2) {
  //     return [];
  //   }
  //   const group1 = currentSelectedGroup?.getOrignalBranches(
  //     experiment.branchInfo
  //   );

  //   const length1 = currentSelectedGroup.getLength();
  //   const group2 = currentSelectedGroup2?.getOrignalBranches(
  //     experiment.branchInfo
  //   );
  //   const length2 = currentSelectedGroup2.getLength();

  //   const temp = Object.keys(branchCount).map((filePath, i) => {
  //     const children = experiment.branchInfo
  //       .filter((b) => b.filePath === filePath)
  //       .map((b) => {
  //         const g1 = group1[b.branch] ? group1[b.branch] : 0;
  //         const g2 = group2[b.branch] ? group2[b.branch] : 0;
  //         return {
  //           id: b.branch,
  //           line: b.line,
  //           group1: (g1 / length1) * 100,
  //           group2: (g2 / length2) * 100,
  //         };
  //       });
  //     return children;
  //   });

  //   const groupByLine = {};
  //   const item = temp.flat();

  //   item.forEach((child) => {
  //     if (!groupByLine[child.line]) {
  //       groupByLine[child.line] = {
  //         line: child.line,
  //         ids: [child.id],
  //         group1: child.group1,
  //         group2: child.group2,
  //       };
  //     } else if (!groupByLine[child.line].ids.includes(child.id)) {
  //       groupByLine[child.line].ids.push(child. );
  //       groupByLine[child.line].group1 += child.group1;
  //       groupByLine[child.line].group2 += child.group2;
  //     }
  //   });

  //   const value = Object.values(groupByLine).map((group: any) => ({
  //     ...group,
  //     group1: group.group1 / group.ids.length,
  //     group2: group.group2 / group.ids.length,
  //   }));

  //   return value;
  // }, [currentSelectedGroup, currentSelectedGroup2, experiment.branchInfo]);

  // const currentLine = useMemo(() => {
  //   if (branchInfo?.line) {
  //     return data.filter((d) => d.line === branchInfo.line);
  //   }
  //   return [];
  // }, [branchInfo, data]);

  return (
    <div style={{ height: "100%", width: "100%", userSelect: "none" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"center"}
        >
          Code Detail View
          {" ("}
          <SelectIcon type="g1" /> {currentSelectedGroup?.name}
          {" )"}
        </Heading>
      </Box>
      <CodeFileTable />
    </div>
  );
}

export default CodeDetail;
