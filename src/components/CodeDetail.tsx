import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Text,
} from "@chakra-ui/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialOceanic } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useCustomStore } from "../store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConstDataStore } from "./store/constDataStore";
import { BranchInfo } from "../model/experiment";

import CodeFileTable from "./CodeFileTable";
import OverlappedCharts from "./OverlappedCharts";
import { formatting } from "../model/utils";
import SpeedometerGauge from "./SpeedMeterGauge";

function sliceAroundLine(
  content: string,
  targetLine: number,
  context: number = 3
): { content: string; startLine: number } {
  // 반환 타입 변경
  const lines = content.split("\n");
  if (context < 0) return { content: lines.join("\n"), startLine: 1 };

  const start = Math.max(0, targetLine - context - 1);
  const end = Math.min(lines.length, targetLine + context);

  return {
    content: lines.slice(start, end).join("\n"),
    startLine: start + 1, // 시작 라인 번호 반환
  };
}

function CodeDetail() {
  const [fileContent, setFileContent] = useState<string>("");
  const [numLine, setNumLine] = useState<number>(15);
  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);
  const setSelectBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );
  const experiment = useConstDataStore((state) => state.exp);

  const [branchInfo, setBranchInfo] = useState<BranchInfo | undefined>(
    undefined
  );

  useEffect(() => {
    if (selectedBranchId) {
      const branch = experiment.branchInfo.find(
        (b) => b.branch === selectedBranchId
      );
      console.log("Setting branch info:", branch);
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
          console.log("Attempting to fetch from:", url);

          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const content = await response.text();
          console.log("File content loaded successfully");
          console.log("Content length:", content.length);
          setFileContent(content);
        } catch (error) {
          console.error("Error reading file:", error);
          setFileContent("// Error loading file content");
        }
      }
    }

    loadFile();
  }, [branchInfo?.filePath]);

  const displayContent = useMemo(() => {
    if (!fileContent || !branchInfo?.line)
      return {
        content: "// There is no branch information.",
        startLine: 1,
      };
    return sliceAroundLine(fileContent, branchInfo.line, numLine);
  }, [fileContent, branchInfo, numLine]);

  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );

  const data = useMemo(() => {
    if (!currentSelectedGroup || !currentSelectedGroup2) {
      return [];
    }
    const group1 = currentSelectedGroup?.getOrignalBranches(
      experiment.branchInfo
    );

    const group2 = currentSelectedGroup2?.getOrignalBranches(
      experiment.branchInfo
    );

    return {
      group1: group1,
      group2: group2,
    };
  }, [currentSelectedGroup, currentSelectedGroup2, experiment.branchInfo]);

  const containerRef = useRef(null);

  // Position the yellow rectangle to align with the highlighted line
  const calculateYPosition = () => {
    if (!branchInfo) return 0;
    if (!containerRef.current) return 0;
    const lineHeight = 18; // 24px
    const lineOffset =
      (branchInfo.line - displayContent.startLine) * lineHeight + 15;
    return lineOffset;
  };

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
          alignItems={"space-between"}
          gap={2}
        >
          Code Detail View
        </Heading>
      </Box>
      <Box w={"100%"} p={1} height={`calc(100% - 35px)`}>
        <Box w={"100%"} height={`30px`} padding={1}>
          <OverlappedCharts
            trialGroup1={currentSelectedGroup}
            trialGroup2={currentSelectedGroup2}
          />
        </Box>
        <Box w={"100%"} h={"50px"}>
          <Box display={"flex"} justifyContent={"space-between"} pl={2} pr={2}>
            {/* <Text fontSize={"sm"}>{branchInfo.fileName}</Text> */}
            <FormControl
              display="flex"
              justifyContent="right"
              width={"35%"}
              alignItems={"center"}
              mr={1}
            >
              <FormLabel htmlFor="branch" mr={1} mb={0}>
                <Text fontSize="xs" color="gray.600">
                  Branch
                </Text>
              </FormLabel>
              <Input
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectBranchId(e.target.value);
                }}
                size={"xs"}
                width={"90%"}
                placeholder={"Branch ID"}
              />
            </FormControl>

            <FormControl
              display="flex"
              justifyContent="right"
              width={"30%"}
              alignItems={"center"}
              mr={1}
            >
              <FormLabel htmlFor="branch" mr={1} mb={0}>
                <Text fontSize="xs" color="gray.600">
                  # Lines
                </Text>
              </FormLabel>
              <Select
                cursor={"pointer"}
                size={"xs"}
                width={"60%"}
                onChange={(e) => {
                  console.log("Selected branch:", e.target.value);
                  setNumLine(
                    e.target.value === "All" ? -1 : parseInt(e.target.value)
                  );
                }}
                value={numLine}
              >
                {["10", "15", "20", "All"].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box
            pl={2}
            pr={2}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            {selectedBranchId && branchInfo && (
              <>
                <Text fontSize={"xs"}>
                  {currentSelectedGroup?.name} (
                  {Array.isArray(data)
                    ? "N/A"
                    : formatting(data.group1[selectedBranchId], "int")}
                  {", "}
                  {Array.isArray(data)
                    ? "N/A"
                    : formatting(
                        data.group1[selectedBranchId] /
                          currentSelectedGroup.getLength(),
                        "float",
                        2
                      )}
                  %)
                </Text>
                <SpeedometerGauge
                  group1Value={data.group1[selectedBranchId]}
                  group2Value={data.group2[selectedBranchId]}
                  size="25px"
                />
                <Text fontSize={"xs"}>
                  {currentSelectedGroup2?.name} (
                  {Array.isArray(data)
                    ? "N/A"
                    : formatting(data.group2[selectedBranchId], "int")}
                  {", "}
                  {Array.isArray(data)
                    ? "N/A"
                    : formatting(
                        data.group2[selectedBranchId] /
                          currentSelectedGroup2.getLength(),
                        "float",
                        2
                      )}
                  %)
                </Text>
              </>
            )}
          </Box>
        </Box>

        <Box
          w={"100%"}
          height={`calc(57.5% - 80px)`}
          position={"relative"}
          ref={containerRef}
        >
          <Box position="relative" width="100%" height="100%" overflow="auto">
            <div
              style={{ position: "relative", width: "100%", minHeight: "100%" }}
            >
              {selectedBranchId && (
                <Box
                  width="22px"
                  height="18px" // Set to line height
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    top: calculateYPosition(),
                    left: 0,
                    display: "flex",
                    justifyContent: "center",
                    backgroundColor: "white",
                  }}
                >
                  <SpeedometerGauge
                    group1Value={data.group1[selectedBranchId]}
                    group2Value={data.group2[selectedBranchId]}
                    size="18px"
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
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="100%"
                  fill="yellow"
                ></rect>
              </svg> */}

              <SyntaxHighlighter
                customStyle={{
                  fontSize: "12px",
                  width: "100%",
                  height: "100%",
                }}
                startingLineNumber={displayContent.startLine}
                language="c"
                style={materialOceanic}
                wrapLines={true}
                showLineNumbers={true}
                lineProps={(lineNumber) => {
                  let style = {
                    display: "block",
                    width: "100%",
                    minWidth: "100%",
                    boxSizing: "border-box",
                  };

                  if (lineNumber === branchInfo?.line) {
                    style.backgroundColor = "rgba(40, 200, 40, 0.2)";
                    style.borderLeft = "3px solid rgba(40, 200, 40, 0.8)";
                    style.width = "150%";
                    style.position = "relative";
                    style.left = 0;
                    style.right = 0;
                  }

                  return { style };
                }}
              >
                {displayContent.content}
              </SyntaxHighlighter>
            </div>
          </Box>

          {/* <Box
            position={"absolute"}
            width={"100%"}
            height={"100%"}
            overflow={"auto"}
          >
            <svg
              width="10%"
              height="100%"
              style={{ position: "absolute", zIndex: 1000 }}
            >
              <rect x="0" y="0" width="100" height="100" fill="yellow"></rect>
            </svg>
          </Box> */}

          {/* <SyntaxHighlighter
            customStyle={{
              fontSize: "12px",
              width: "100%",
              height: "100%",
            }}
            startingLineNumber={displayContent.startLine}
            language="c"
            style={materialOceanic}
            wrapLines={true}
            showLineNumbers={true}
            lineProps={(lineNumber) => {
              let style: React.CSSProperties = {
                display: "block",
                width: "100%", // 전체 너비 차지
                minWidth: "100%", // 최소 너비 설정
                boxSizing: "border-box", // 패딩과 보더를 포함한 너비 계산
              };

              if (lineNumber === branchInfo?.line) {
                style.backgroundColor = "rgba(40, 200, 40, 0.2)";
                style.borderLeft = "3px solid rgba(40, 200, 40, 0.8)";
                style.width = "150%";
                style.position = "relative"; // 상대 위치 설정
                style.left = 0; // 왼쪽 정렬
                style.right = 0; // 오른쪽 끝까지 확장
              }

              return { style };
            }}
          >
            {displayContent.content}
          </SyntaxHighlighter> */}
        </Box>

        <CodeFileTable />
      </Box>
    </div>
  );
}

export default CodeDetail;
