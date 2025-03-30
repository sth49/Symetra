import { Box, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCustomStore } from "../store";
import { useConstDataStore } from "./store/constDataStore";
import { BranchInfo } from "../model/experiment";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import * as d3 from "d3";
import { AiFillStar } from "react-icons/ai";
import { getTextColor } from "../model/utils";
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
  const setViewType = useCustomStore((state) => state.setViewType);

  useEffect(() => {
    if (selectedBranchId) {
      const branch = experiment.branchInfo.find(
        (b) => b.branch === selectedBranchId
      );
      setBranchInfo(branch);

      if (viewType === "line") {
        handleScrollToLine(branch?.line);
      } else if (viewType === "file") {
        handleScrollToLine(1);
      }
    }
  }, [selectedBranchId, experiment.branchInfo, viewType]);

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

  // useEffect(() => {
  //   if (viewType === "line") {
  //     handleScrollToLine(branchInfo?.line);
  //   } else if (viewType === "file") {
  //     handleScrollToLine(1);
  //   }
  // }, [branchInfo?.line, viewType, selectedBranchId]);

  const displayContent = useMemo(() => {
    return { content: fileContent, startLine: 1 };
  }, [fileContent]);

  const linesRefs = useRef<any>({}); // 각 라인에 대한 ref 저장

  const handleScrollToLine = (lineNumber: number) => {
    if (!lineNumber) return;

    console.log("Attempting to scroll to line:", lineNumber);

    // DOM에 요소가 없으면 약간 기다린 후 다시 시도
    if (!linesRefs.current[lineNumber]) {
      console.log("Line ref not found, retrying in 100ms...");
      setTimeout(() => handleScrollToLine(lineNumber), 100);
      return;
    }

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
  const containerRef = useRef(null);

  const calculateYPosition = () => {
    if (!branchInfo?.line) return 0;
    // Get line height by approximation (you can measure it more precisely if needed)
    const lineHeight = 18; // Estimated line height in pixels
    // Calculate position based on line number (0-indexed within the component)
    return (branchInfo.line - displayContent.startLine) * lineHeight;
  };
  const setLineNumberClicked = useCustomStore(
    (state) => state.setLineNumberClicked
  );
  const setSelectBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
  }

  const colorIntensityBlue = d3.scaleSequential(
    [0, 100],
    d3.interpolateRgb("rgba(0, 0, 255, 0.2)", "rgba(0, 0, 255, 0.8)")
  );
  const colorIntensityRed = d3.scaleSequential(
    [0, 100],
    d3.interpolateRgb("rgba(255, 0, 0, 0.2)", "rgba(255, 0, 0, 0.8)")
  );

  const bInfo = item.children.find((c) => c.line === branchInfo?.line);

  return (
    <Box
      w={"100%"}
      height={`calc(100% - 45px)`}
      overflow={"hidden"}
      // position = "relative"
      ref={containerRef}
    >
      <Box position="relative" width="100%" height="100%" overflow="auto">
        {/* Container for both SVG and code */}
        <div style={{ position: "relative", width: "100%", minHeight: "100%" }}>
          {/* SVG overlay positioned at the same scroll position */}
          {viewType === "line" && bInfo && (
            <Box
              width="18px"
              height="20px" // Set to line height
              style={{
                position: "absolute",
                zIndex: 1000,
                top: calculateYPosition(),
                left: 0,
              }}
            >
              <Icon
                as={AiFillStar}
                color={getTextColor(
                  bInfo?.group1Count - bInfo?.group1Count > 0
                    ? colorIntensityBlue(
                        Math.abs(bInfo?.group1Count - bInfo?.group1Count)
                      )
                    : colorIntensityRed(
                        Math.abs(bInfo?.group1Count - bInfo?.group1Count)
                      )
                )}
              />
            </Box>
          )}

          {/* <svg
            width="10%"
            height="18px" // Set to line height
            style={{
              position: "absolute",
              zIndex: 1000,
              top: calculateYPosition(),
              left: 0,
            }}
          >
            <rect x="0" y="0" width="100" height="100%" fill="yellow"></rect> */}

          <SyntaxHighlighter
            customStyle={{
              fontSize: "12px",
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              overflow: "auto",
              margin: 0,
              padding: 0,
              // paddingLeft: "10px",
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
                textShadow: "none",
              };
              // Line highlight logic
              if (lines.includes(lineNumber)) {
                const lineItem = item.children.find(
                  (c) => c.line === lineNumber
                );
                // console.log("lineItem", lineItem);
                const diff = lineItem.group1Count - lineItem.group2Count;
                // const colorIntensity = Math.abs(diff) / 100;

                style.backgroundColor =
                  lineItem.group1Count > lineItem.group2Count
                    ? colorIntensityBlue(Math.abs(diff))
                    : lineItem.group1Count === lineItem.group2Count
                    ? "rgba(0,0,0, 0.2)"
                    : colorIntensityRed(Math.abs(diff));
                style.width = "180%";
                style.position = "relative";
                style.left = 0;
                style.right = 0;
                style.color = Math.abs(diff) / 100 > 0.5 ? "white" : "black";
                style.border =
                  viewType === "line" && branchInfo?.line === lineNumber
                    ? "1px solid rgba(0, 0, 0, 1)"
                    : "none";

                style.cursor = "pointer";
              }
              return {
                style,
                ref: (el: any) => (linesRefs.current[lineNumber] = el),
                onClick: () => {
                  if (lines.includes(lineNumber)) {
                    setLineNumberClicked({
                      filePath: branchInfo?.filePath,
                      lineNumber: lineNumber,
                    });
                    setViewType("line");

                    setSelectBranchId(
                      experiment.branchInfo.find(
                        (b) =>
                          b.filePath === branchInfo?.filePath &&
                          b.line === lineNumber
                      )?.branch
                    );
                  }
                  // console.log("Clicked line:", lineNumber);
                },
              }; // Save ref for each line
            }}
          >
            {displayContent.content}
          </SyntaxHighlighter>
        </div>
      </Box>
    </Box>
  );
};

export default CodeView;
