import { Check, CircleX, SquarePen } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getBezierPath,
  Handle,
  type Node,
  type OnNodesChange,
  Position,
  ReactFlow,
} from "reactflow";
import { toast } from "sonner";
import type { ColumnList, DatasetReducerState } from "../../../../../types/dataset.types";
import type {
  DatasetFabricReducerState,
  ERDNodeData,
  FabricTableList,
} from "../../../../../types/datasetFabric.types";
import { getErrorMessage } from "../../../../../utils/getErrorMessage";
import LoadingPage from "../../../../reusable/loadingPage";
import { getUUID } from "../../../DataAgent/DataAgent.reducer";
import type { DatasetAction } from "../../Dataset.reducer";
import type { DatasetFabricAction } from "../../DatasetFabric.reducer";

interface DatasetFabricCanvasProps {
  companyId: string;
  stateDataset: DatasetReducerState;
  state: DatasetFabricReducerState;
  dispatch: React.Dispatch<DatasetFabricAction>;
  dispatchState: React.Dispatch<DatasetAction>;
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange;
  generatingRelation: () => void;
  isGeneratingRelation: boolean;
}

export const DatasetFabricCanvas = ({
  companyId,
  stateDataset,
  state,
  dispatch,
  dispatchState,
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  generatingRelation,
  isGeneratingRelation,
}: DatasetFabricCanvasProps) => {
  const ERDNode = ({ data }: any) => {
    return (
      <div className={`bg-[#eff6ff] border  rounded-lg shadow-md  w-[180px] hover:border-black`}>
        <div
          className={`flex justify-between items-center  bg-[#155dfc] text-white px-2 py-1  pl-4 text-sm rounded-t-md `}
        >
          <span>{data.table} </span>
          {data.fabricMode === "E" && (
            <button className="text-white" onClick={data.onRemove}>
              ✕
            </button>
          )}
        </div>

        <div>
          {data.columns.map((col: ColumnList, i: number) => (
            <div key={i} className="relative py-1 px-2 text-xs flex justify-between items-center">
              <span>{col.columnName}</span>

              <span className="pr-2">
                <i>{col.dataType}</i>
              </span>

              <Handle
                id={`${data.table},${col.columnName},source`}
                type="source"
                position={Position.Left}
                isConnectable={!!(data.step === 4 && data.fabricMode === "E")}
                style={{
                  position: "absolute",
                  left: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#347298",
                  zIndex: 10,
                }}
              />
              <Handle
                id={`${data.table},${col.columnName},target`}
                type="target"
                position={Position.Right}
                isConnectable={!!(data.step === 4 && data.fabricMode === "E")}
                style={{
                  position: "absolute",
                  right: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#347298",
                  zIndex: 10,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const deleteEdgeById = (id: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
  };

  const nodeTypes = useMemo(() => ({ erd: ERDNode }), []);

  const DeleteEdge = ({ id, sourceX, sourceY, targetX, targetY, markerEnd, data }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            stroke: "#347298",
            strokeWidth: 2,
            pointerEvents: "none",
          }}
        />

        <foreignObject
          width={30}
          height={30}
          x={labelX - 15}
          y={labelY - 15}
          style={{
            overflow: "visible",
            pointerEvents: "all",
          }}
        >
          <button
            onClick={() => data.onDelete(id)}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              color: "white",
              border: "2px solid white",
              background: "red",
              cursor: "pointer",
              fontSize: "12px",
              lineHeight: "18px",
              textAlign: "center",
            }}
          >
            ✕
          </button>
        </foreignObject>
      </>
    );
  };

  const edgeTypes = {
    deletable: DeleteEdge,
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData("table");
      if (!raw) return;

      const table: FabricTableList = JSON.parse(raw);

      const nextX = nodes.length === 0 ? 20 : nodes[nodes.length - 1].position.x + 270;

      const position = {
        x: nextX,
        y: 20,
      };

      const id = `${Date.now()}`;

      const newNode: Node<ERDNodeData> = {
        id,
        type: "erd",
        position,

        data: {
          table: table.tableName,
          columns: table.columnList,
          onRemove: () => removeNode(id),
          isConnectable: true,
          fabricMode: "E",
          step: stateDataset.datasetStep,
        },
      };

      const isExist = nodes.some((node) => node.data.table === table.tableName);

      if (!isExist) {
        setNodes((nds) => [...nds, newNode]);
      } else {
        toast.error("Failed", {
          description: getErrorMessage("Table already exist in canvas!"),
        });
      }
    },
    [nodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const removeNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div
      className={` relative transition-all duration-300 ease-in-out border-[2px] border-dashed border rounded ${state.fabricMode === "C" ? "mt-3 h-[92%] " : " h-[88%] "}`}
    >
      <LoadingPage isLoading={isGeneratingRelation} />
      <div className="ml-auto flex items-center z-50 modify_button absolute right-5 top-5">
        {stateDataset.datasetStep === 4 && state.fabricMode === "C" ? (
          <button
            onClick={() => {
              dispatch({ type: "editErdFabric", payload: "E" });
              dispatch({ type: "saveNode", tableNode: nodes, relationNode: edges });
              // dispatchState({ type: "datasetStep",payload:3 })
            }}
            title="Edit"
            className="flex justify-center items-center m-auto cursor-pointer border rounded-full p-1 bg-gray-100 shadow h-8 w-8 hover:bg-white transition-colors duration-200"
          >
            <SquarePen />
          </button>
        ) : null}

        {state.fabricMode === "E" ? (
          <div className="flex gap-3">
            <button
              onClick={() => {
                generatingRelation();
              }}
              title="Save"
              className="flex justify-center items-center m-auto cursor-pointer border rounded-full p-1 bg-gray-100 shadow h-8 w-8 hover:bg-white transition-colors duration-200"
            >
              <Check />
            </button>
            <button
              onClick={() => {
                setNodes(state.tableNode);
                setEdges(state.relationNode);
                dispatch({ type: "editErdFabric", payload: "C" });
              }}
              title="Cancel"
              className="flex justify-center items-center m-auto cursor-pointer border rounded-full p-1 bg-gray-100 shadow h-8 w-8 hover:bg-white transition-colors duration-200"
            >
              <CircleX />
            </button>
          </div>
        ) : null}
      </div>

      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        edgeTypes={state.fabricMode === "E" ? edgeTypes : {}}
        onEdgeClick={(e) => e.stopPropagation()}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        deleteKeyCode={null}
        elementsSelectable={!(stateDataset.datasetStep === 4 && state.fabricMode === "C")}
        onConnect={(params: any) => {
          if (state.fabricMode !== "E") return;

          const { source, sourceHandle, target, targetHandle } = params;

          var getColumnSource = sourceHandle.split(",")[1];
          var getTargetSource = targetHandle.split(",")[1];

          const sourceNode = nodes.find((n: any) => n.id === source);
          const targetNode = nodes.find((n: any) => n.id === target);
          const getColSource = sourceNode?.data.columns.find(
            (n: ColumnList) => n.columnName === getColumnSource,
          );
          const getColTarget = targetNode?.data.columns.find(
            (n: ColumnList) => n.columnName === getTargetSource,
          );

          if (getColSource.dataType !== getColTarget.dataType) {
            toast.error("Failed", {
              description: getErrorMessage("Cannot connect columns with different data types!"),
            });

            return;
          }

          const edgeId = `edge-${getUUID()}`;

          setEdges((eds) => [
            ...eds,
            {
              id: edgeId,
              ...params,
              type: "deletable",
              data: { onDelete: deleteEdgeById },
              style: {
                stroke: "#347298",
                strokeWidth: 2,
              },
            },
          ]);
        }}
        nodesDraggable={true}
        nodesConnectable={true}
        nodesFocusable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
      />
    </div>
  );
};
