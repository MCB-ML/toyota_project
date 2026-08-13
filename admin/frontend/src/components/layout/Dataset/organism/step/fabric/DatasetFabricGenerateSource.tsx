import type { Edge, Node, OnNodesChange } from "reactflow";
import type { DatasetReducerState } from "../../../../../../types/dataset.types";
import {
  type DatasetFabricReducerState,
  TABS_FABRIC,
} from "../../../../../../types/datasetFabric.types";
import type { DatasetAction } from "../../../Dataset.reducer";
import type { DatasetFabricAction } from "../../../DatasetFabric.reducer";
import { DatasetFabricCanvas } from "../../../molecules/fabric/DatasetFabricCanvas";
import { DatasetFabricTableList } from "../../../molecules/fabric/DatasetFabricTableList";
import { DatasetFabricTableSearch } from "../../../molecules/fabric/DatasetFabricTableSearch";
import { DatasetFabricTabs } from "../../../molecules/fabric/DatasetFabricTabs";
import DatasetFabricPreviewData from "./DatasetFabricPreviewData";
import DatasetFabricPrompt from "./DatasetFabricPrompt";

interface DatasetFabricGenerateSourceProps {
  state: DatasetFabricReducerState;
  dispatch: React.Dispatch<DatasetFabricAction>;
  dispatchState: React.Dispatch<DatasetAction>;
  companyId: string;
  stateDataset: DatasetReducerState;
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange;
  onExecuteQuery: (val: string) => void;
  generatingRelation: () => void;
  isGeneratingRelation: boolean;
  isFetchingSampleData: boolean;
}

const DatasetFabricGenerateSource = ({
  state,
  dispatch,
  dispatchState,
  companyId,
  stateDataset,
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onExecuteQuery,
  generatingRelation,
  isGeneratingRelation,
  isFetchingSampleData,
}: DatasetFabricGenerateSourceProps) => {
  return (
    <div className=" text-black  h-full">
      {state.fabricMode === "C" && (
        <DatasetFabricTabs selectedTab={state.selectedTab} dispatch={dispatch} />
      )}

      <div className={`h-[440px] px-1  transition-all duration-300 ease-in-out`}>
        {state.selectedTab === TABS_FABRIC.RELATION_TABLE && (
          <div className={`${state.fabricMode === "E" ? "flex" : "h-full"}`}>
            {state.fabricMode === "E" && (
              <div className={` overflow-auto rounded w-1/3 px-3`}>
                <DatasetFabricTableSearch dispatch={dispatch} />

                <DatasetFabricTableList fabricTableList={state.fabricTableList} />
              </div>
            )}
            <div className={`${state.fabricMode === "E" ? "w-2/3 " : "h-full"}`}>
              {state.fabricMode === "E" && (
                <div className="flex flex-col text-sm pb-3">
                  <h3 className="font-bold">Relationship Canvas</h3>
                  <p className="text-sm">
                    Modify tables and adjust column relationships to shape your dataset.
                  </p>
                </div>
              )}

              <DatasetFabricCanvas
                companyId={companyId}
                stateDataset={stateDataset}
                state={state}
                dispatch={dispatch}
                nodes={nodes}
                edges={edges}
                setNodes={setNodes}
                setEdges={setEdges}
                onNodesChange={onNodesChange}
                generatingRelation={generatingRelation}
                dispatchState={dispatchState}
                isGeneratingRelation={isGeneratingRelation}
              />
            </div>
          </div>
        )}

        {state.selectedTab === TABS_FABRIC.GENERATE_SQL && (
          <DatasetFabricPrompt
            state={state}
            dispatch={dispatch}
            nodes={nodes}
            onExecuteQuery={onExecuteQuery}
            stateDataset={stateDataset}
            companyId={companyId}
          />
        )}
        {state.selectedTab === TABS_FABRIC.PREVIEW && (
          <DatasetFabricPreviewData
            queryResultData={state.previewData.data}
            isFetchingSampleData={isFetchingSampleData}
          />
        )}
      </div>
    </div>
  );
};

export default DatasetFabricGenerateSource;
