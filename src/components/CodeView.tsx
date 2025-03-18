import { Box, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCustomStore } from "../store";
import { useConstDataStore } from "./store/constDataStore";
import { BranchInfo } from "../model/experiment";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import * as d3 from "d3";
interface CodeViewProps {
  item: any;
}
const CodeView: React.FC<CodeViewProps> = ({ item }) => {
  const [branchInfo, setBranchInfo] = useState<BranchInfo | undefined>(
    undefined
  );

  const viewType = useCustomStore((state) => state.viewType);

  const [fileContent, setFileContent] = useState<string>("");

  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);

  const experiment = useConstDataStore((state) => state.exp);

  const setTotalLines = useCustomStore((state) => state.setTotalLines);

  useEffect(() => {
    if (selectedBranchId) {
      const branch = experiment.branchInfo.find(
        (b) => b.branch === selectedBranchId
      );
      setBranchInfo(branch);
    }
  }, [selectedBranchId, experiment.branchInfo]);

  useEffect(() => {
    async function loadFile() {
      if (branchInfo?.filePath) {
        try {
          // base path를 고려한 URL 구성
          const basePath = "/Symetra/"; // vite.config.ts의 base 설정값
          const url = `${basePath}${branchInfo.filePath}`;

          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const content = await response.text();
          setFileContent(content);
          setTotalLines(content.split("\n").length);
        } catch (error) {
          console.error("Error reading file:", error);
          setFileContent("// Error loading file content");
        }
      }
    }

    loadFile();
  }, [branchInfo?.filePath, setTotalLines]);

  useEffect(() => {
    if (viewType === "line") {
      handleScrollToLine(branchInfo?.line);
    }
  }, [branchInfo?.line, viewType]);

  const displayContent = useMemo(() => {
    return { content: fileContent, startLine: 1 };
  }, [fileContent]);

  const linesRefs = useRef<any>({}); // 각 라인에 대한 ref 저장

  const handleScrollToLine = (lineNumber: number) => {
    if (linesRefs.current[lineNumber]) {
      linesRefs.current[lineNumber].scrollIntoView({
        behavior: "smooth",
        block: "center", // 라인을 화면 중앙에 위치시킴
      });
    }
  };

  const lines = useMemo(() => {
    // if (viewType === "line") return [branchInfo?.line];
    if (!item || item?.children.length === 0) return [];
    if (item && item.children) return item.children.map((c) => c.line);
  }, [item]);

  if (item === undefined) {
    return (
      <Box
        width="100%"
        height="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="md">Please select a branch</Text>
      </Box>
    );
  }

  return (
    <Box w={"100%"} height={`calc(100% - 45px)`} overflow={"hidden"}>
      <SyntaxHighlighter
        customStyle={{
          fontSize: "12px",
          width: "100%",
          height: "100%",
          backgroundColor: "white",
          overflow: "auto",
          margin: 0,
          padding: 0,
        }}
        startingLineNumber={displayContent.startLine}
        language="c"
        wrapLines={true}
        showLineNumbers={true}
        lineProps={(lineNumber) => {
          const style: React.CSSProperties = {
            display: "block",
            width: "100%",
            minWidth: "100%",
            boxSizing: "border-box",
          };
          // Line highlight logic
          if (lines.includes(lineNumber)) {
            const lineItem = item.children.find((c) => c.line === lineNumber);
            const diff = lineItem.group1 - lineItem.group2;
            // const colorIntensity = Math.abs(diff) / 100;
            const colorIntensityBlue = d3.scaleSequential(
              [0, 100],
              d3.interpolateRgb("rgba(0, 0, 255, 0.2)", "rgba(0, 0, 255, 0.8)")
            );
            const colorIntensityRed = d3.scaleSequential(
              [0, 100],
              d3.interpolateRgb("rgba(255, 0, 0, 0.2)", "rgba(255, 0, 0, 0.8)")
            );
            style.backgroundColor =
              lineItem.group1 > lineItem.group2
                ? colorIntensityBlue(Math.abs(diff))
                : colorIntensityRed(Math.abs(diff));
            style.borderLeft =
              lineItem.group1 > lineItem.group2
                ? "3px solid rgba(0, 0, 255, 0.8)"
                : "3px solid rgba(255, 0, 0, 0.8)";
            style.width = "150%";
            style.position = "relative";
            style.left = 0;
            style.right = 0;
            style.color = Math.abs(diff) / 100 > 0.5 ? "white" : "black";
            style.border =
              viewType === "line" && branchInfo?.line === lineNumber
                ? "1px solid rgba(0, 0, 0, 1)"
                : "none";
          }
          return {
            style,
            ref: (el: any) => (linesRefs.current[lineNumber] = el),
          }; // Save ref for each line
        }}
      >
        {displayContent.content}
      </SyntaxHighlighter>
    </Box>
  );
};

export default CodeView;
