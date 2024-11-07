import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { useMemo } from "react";
import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import { Group as TrialGroup } from "../model/group";
import { useCustomStore } from "../store";
interface AreaChartProps {
  trialGroup: TrialGroup;
}

const AreaChartBase = ({ trialGroup, width, height }) => {
  const { currentSelectedGroup } = useCustomStore();
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };

  const selectedData = useMemo(() => {
    const branches = currentSelectedGroup.getBranches();
    return branches.map((b, i) => {
      return {
        x: i,
        y: b[1],
        branch: b[0],
      };
    });
  }, [currentSelectedGroup]);
  const data = useMemo(() => {
    const branches = trialGroup.getBranches();

    return selectedData.map((d) => {
      return {
        x: d.x,
        y: branches.find((b) => b[0] === d.branch)[1],
        branch: d.branch,
      };
    });
  }, [trialGroup, selectedData]);

  const xAccessor = (d: { x: number }) => d.x;
  const yAccessor = (d: { y: number }) => d.y;

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [margin.left, width - margin.right],
        domain: [0, data.length],
      }),
    [data, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height - margin.bottom, margin.top],
        domain: [0, Math.max(...data.map(yAccessor))],
        nice: true,
      }),
    [data, height]
  );

  return (
    <svg width={width} height={height}>
      <AreaClosed
        data={data}
        x={(d) => xScale(xAccessor(d))}
        y={(d) => yScale(yAccessor(d))}
        yScale={yScale}
        curve={curveMonotoneX}
        fill={currentSelectedGroup.id === trialGroup.id ? "blue" : "red"}
        opacity={currentSelectedGroup.id === trialGroup.id ? 0.2 : 0.5}
      />
    </svg>
  );
};

const AreaChart = ({ trialGroup }: AreaChartProps) => {
  return (
    <div style={{ width: "100%", height: "100%" }}>
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
