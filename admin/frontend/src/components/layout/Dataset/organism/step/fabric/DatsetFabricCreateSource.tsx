import { type Edge, type Node, type OnNodesChange, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { useRef } from "react";
import type { DatasetReducerState } from "../../../../../../types/dataset.types";
import type { DatasetFabricReducerState } from "../../../../../../types/datasetFabric.types";
import type { DatasetAction } from "../../../Dataset.reducer";
import type { DatasetFabricAction } from "../../../DatasetFabric.reducer";
import { DatasetFabricCanvas } from "../../../molecules/fabric/DatasetFabricCanvas";
import { DatasetFabricTableList } from "../../../molecules/fabric/DatasetFabricTableList";
import { DatasetFabricTableSearch } from "../../../molecules/fabric/DatasetFabricTableSearch";

interface DatsetFabricCreateSourceProps {
  companyId: string;
  stateDataset: DatasetReducerState;
  state: DatasetFabricReducerState;
  nodes: any;
  edges: any;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange;
  dispatch: React.Dispatch<DatasetFabricAction>;
  dispatchState: React.Dispatch<DatasetAction>;
  generatingRelation: () => void;
  isGeneratingRelation: boolean;
}

const DatsetFabricCreateSource = ({
  companyId,
  stateDataset,
  state,
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  dispatch,
  dispatchState,
  generatingRelation,
  isGeneratingRelation,
}: DatsetFabricCreateSourceProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <ReactFlowProvider>
      <div className=" text-black flex  h-full">
        <div className={` overflow-auto rounded w-1/3 px-3`}>
          <DatasetFabricTableSearch dispatch={dispatch} />

          <DatasetFabricTableList fabricTableList={state.fabricTableList} />
        </div>

        <div
          className={`w-2/3 h-full px-1  transition-all duration-300 ease-in-out  ${state.fabricMode === "C" ? "w-[100%]  " : "w-[100%] px-2 "}`}
          ref={canvasRef}
        >
          <div
            className={`flex items-start mb-6 ${state.fabricMode === "C" ? " h-[5%]" : "h-[12%]"}`}
          >
            <div className="flex flex-col text-sm">
              <h3 className="font-bold">Relationship Canvas</h3>

              <p className="text-sm">
                Drag tables here and connect columns to define relationships
              </p>
            </div>
          </div>

          <DatasetFabricCanvas
            state={state}
            dispatch={dispatch}
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            onNodesChange={onNodesChange}
            companyId={companyId}
            stateDataset={stateDataset}
            generatingRelation={generatingRelation}
            dispatchState={dispatchState}
            isGeneratingRelation={isGeneratingRelation}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default DatsetFabricCreateSource;
