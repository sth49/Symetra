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
  trialGroup1: TrialGroup;
  trialGroup2: TrialGroup;
}

interface TooltipData {
  x: number;
  y1: number;
  y2: number;
  branch: string;
}

const tooltipStyles = {
  ...defaultStyles,
  background: "rgba(0, 0, 0, 1)",
  color: "white",
  padding: "8px",
  borderRadius: "4px",
  cursor: "pointer",
  zIndex: 1000,
};

const AreaChartBase = ({ trialGroup1, trialGroup2, width, height }) => {
  const { currentSelectedGroup } = useCustomStore();
  const { exp } = useConstDataStore();
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };

  const setSelectedBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );

  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);

  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);

  const setIsBranchClicked = useCustomStore(
    (state) => state.setIsBranchClicked
  );

  const selectedData = useMemo(() => {
    if (!currentSelectedGroup) {
      return [];
    }
    const branches = currentSelectedGroup.getBranches(exp.branchInfo);
    return branches.map((b, i) => ({
      x: i,
      y: b[1],
      branch: b[0],
    }));
  }, [currentSelectedGroup, exp.branchInfo]);

  const data1 = useMemo(() => {
    if (!trialGroup1) {
      return [];
    }
    const branches = trialGroup1.getBranches(exp.branchInfo);
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
  }, [trialGroup1, exp.branchInfo, selectedData]);

  const data2 = useMemo(() => {
    if (!trialGroup2) {
      return [];
    }
    const branches = trialGroup2.getBranches(exp.branchInfo);
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
  }, [trialGroup2, exp.branchInfo, selectedData]);

  const xAccessor = (d: { x: number }) => d.x;
  const yAccessor = (d: { y: number }) => d.y;

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [margin.left, width - margin.right],
        domain: [0, data1.length - 1],
      }),
    [data1.length, margin.left, margin.right, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height - margin.bottom, margin.top],
        domain: [0, Math.max(...data1.map(yAccessor), ...data2.map(yAccessor))],
        nice: true,
      }),
    [data1, data2, height, margin.bottom, margin.top]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = Math.round(x0);

      if (index >= 0 && index < data1.length) {
        const d1 = data1[index];
        const d2 = data2[index];
        setTooltipData({
          x: index,
          y1: d1.y,
          y2: d2.y,
          branch: d1.branch,
        });
        setTooltipLeft(xScale(index));
      }
    },
    [data1, data2, xScale]
  );

  const handleMouseLeave = () => {
    setTooltipData(null);
    setTooltipLeft(null);
  };

  const setViewType = useCustomStore((state) => state.setViewType);

  const handleTooltipClick = useCallback(() => {
    if (tooltipData) {
      setSelectedBranchId(tooltipData.branch);
      setViewType("line");
      setIsBranchClicked(true);
    }
  }, [setIsBranchClicked, setSelectedBranchId, setViewType, tooltipData]);

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
          data={data1}
          x={(d) => xScale(xAccessor(d))}
          y={(d) => yScale(yAccessor(d))}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={currentSelectedGroup.id === trialGroup1.id ? "blue" : "red"}
          opacity={currentSelectedGroup.id === trialGroup1.id ? 0.2 : 0.5}
        />
        <AreaClosed
          data={data2}
          x={(d) => xScale(xAccessor(d))}
          y={(d) => yScale(yAccessor(d))}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={currentSelectedGroup.id === trialGroup2.id ? "blue" : "red"}
          opacity={currentSelectedGroup.id === trialGroup2.id ? 0.2 : 0.5}
        />

        {selectedBranchId && (
          <>
            <Line
              x1={xScale(
                xAccessor(
                  selectedData.find((d) => d.branch === selectedBranchId)
                )
              )}
              x2={xScale(
                xAccessor(
                  selectedData.find((d) => d.branch === selectedBranchId)
                )
              )}
              y1={margin.top}
              y2={height - margin.bottom}
              stroke="black"
              strokeWidth={1}
            />
          </>
        )}
        {tooltipLeft !== null && (
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
          top={yScale((tooltipData.y1 + tooltipData.y2) / 2)}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
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
            <div>
              {trialGroup1.name}: {tooltipData.y1.toFixed(2)}
            </div>
            <div>
              {trialGroup2.name}: {tooltipData.y2.toFixed(2)}
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};

const OverlappedCharts = ({ trialGroup1, trialGroup2 }: AreaChartProps) => {
  if (!trialGroup1 || !trialGroup2) {
    return null;
  }
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ParentSize>
        {({ width, height }) => (
          <AreaChartBase
            trialGroup1={trialGroup1}
            trialGroup2={trialGroup2}
            width={width}
            height={height}
          />
        )}
      </ParentSize>
    </div>
  );
};

export default OverlappedCharts;
