import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { useMemo, useState, useCallback } from "react";
import { AreaClosed } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { Group as TrialGroup } from "../model/group";
import { useCustomStore } from "../store";
import { useConstDataStore } from "./store/constDataStore";
import { Line } from "@visx/shape";
import { localPoint } from "@visx/event";
import { TooltipWithBounds, defaultStyles } from "@visx/tooltip";

interface AreaChartProps {
  trialGroup: TrialGroup;
}

interface TooltipData {
  x: number;
  y: number;
  branch: string;
}

const tooltipStyles = {
  ...defaultStyles,
  background: "rgba(0, 0, 0, 0.8)",
  color: "white",
  padding: "8px",
  borderRadius: "4px",
  zIndex: 1000,
};

const AreaChartBase = ({ trialGroup, width, height }) => {
  const { currentSelectedGroup } = useCustomStore();
  const { exp } = useConstDataStore();
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const setSelectedBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );

  // 툴팁 상태 관리
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);

  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);

  const selectedData = useMemo(() => {
    const branches = currentSelectedGroup.getBranches(exp.branchInfo);
    return branches.map((b, i) => ({
      x: i,
      y: b[1],
      branch: b[0],
    }));
  }, [currentSelectedGroup, exp.branchInfo]);

  const data = useMemo(() => {
    const branches = trialGroup.getBranches(exp.branchInfo);
    // console.log("Branches:", branches);
    return selectedData.map((d) => {
      if (branches.find((b) => b[0] === d.branch) === undefined) {
        return {
          x: d.x,
          y: 0,
          branch: d.branch,
        };
      } else {
        return {
          x: d.x,
          y: branches.find((b) => b[0] === d.branch)[1],
          branch: d.branch,
        };
      }
    });
  }, [trialGroup, exp.branchInfo, selectedData]);

  const xAccessor = (d: { x: number }) => d.x;
  const yAccessor = (d: { y: number }) => d.y;

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [margin.left, width - margin.right],
        domain: [0, data.length - 1],
      }),
    [data.length, margin.left, margin.right, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height - margin.bottom, margin.top],
        domain: [0, Math.max(...data.map(yAccessor))],
        nice: true,
      }),
    [data, height, margin.bottom, margin.top]
  );

  // 마우스 이벤트 핸들러
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = Math.round(x0);

      if (index >= 0 && index < data.length) {
        const d = data[index];
        setTooltipData(d);
        setTooltipLeft(xScale(d.x));
      }
    },
    [data, xScale]
  );

  const handleMouseLeave = () => {
    setTooltipData(null);
    setTooltipLeft(null);
  };
  const handleTooltipClick = useCallback(() => {
    if (tooltipData) {
      // console.log("Selected Branch ID:", tooltipData.branch);
      setSelectedBranchId(tooltipData.branch);
      // 여기에 브랜치 ID를 사용하는 추가 로직을 구현할 수 있습니다
      // 예: 상태 업데이트, 콜백 함수 호출 등
    }
  }, [tooltipData]);

  return (
    <>
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleTooltipClick}
      >
        <AreaClosed
          data={data}
          x={(d) => xScale(xAccessor(d))}
          y={(d) => yScale(yAccessor(d))}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={currentSelectedGroup.id === trialGroup.id ? "blue" : "red"}
          opacity={currentSelectedGroup.id === trialGroup.id ? 0.2 : 0.5}
        />
        {selectedBranchId && (
          <Line
            x1={xScale(
              xAccessor(selectedData.find((d) => d.branch === selectedBranchId))
            )}
            x2={xScale(
              xAccessor(selectedData.find((d) => d.branch === selectedBranchId))
            )}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="black"
            strokeWidth={1}
          />
        )}
        {tooltipLeft && (
          <Line
            from={{ x: tooltipLeft, y: 0 }}
            to={{ x: tooltipLeft, y: height }}
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth={1}
            strokeDasharray="3,3"
            pointerEvents="none"
          />
        )}
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={yScale(tooltipData.y)}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div
            style={{
              fontWeight: "bold",
              borderBottom: "1px solid white",
              paddingBottom: "4px",
              marginBottom: "4px",
            }}
          >
            ID: {tooltipData.branch}
          </div>
          <div>Value: {tooltipData.y.toFixed(2)}</div>
        </TooltipWithBounds>
      )}
    </>
  );
};

const AreaChart = ({ trialGroup }: AreaChartProps) => {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ParentSize>
        {({ width, height }) => (
          <AreaChartBase
            trialGroup={trialGroup}
            width={width}
            height={height}
          />
        )}
      </ParentSize>
    </div>
  );
};

export default AreaChart;
