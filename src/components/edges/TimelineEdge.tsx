import { BaseEdge, getStraightPath, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

function getStrokeDash(data: EdgeProps["data"]): string | undefined {
  const targetStatus = (data as Record<string, unknown> | undefined)?.targetStatus as string | undefined;
  if (targetStatus === "deployed" || targetStatus === "experimental") return undefined;
  return "4 6";
}

export function TimelineDottedEdge(props: EdgeProps) {
  const [edgePath] = getStraightPath(props);
  const dash = getStrokeDash(props.data);
  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: "#F7931A",
        strokeWidth: 2,
        strokeDasharray: dash,
        opacity: 0.35,
        ...props.style,
      }}
    />
  );
}

export function BranchEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({ ...props, borderRadius: 16 });
  const dash = getStrokeDash(props.data);
  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: "#3B82F6",
        strokeWidth: 1.5,
        strokeDasharray: dash,
        opacity: 0.3,
        ...props.style,
      }}
    />
  );
}

export function ProposedEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({ ...props, borderRadius: 16 });
  const dash = getStrokeDash(props.data);
  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: "#6B7280",
        strokeWidth: 1.5,
        strokeDasharray: dash,
        opacity: 0.3,
        ...props.style,
      }}
    />
  );
}
