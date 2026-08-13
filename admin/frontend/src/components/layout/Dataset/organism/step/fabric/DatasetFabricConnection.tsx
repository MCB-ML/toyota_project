import { Check, Cpu, Database, Edit } from "lucide-react";
import { toast } from "sonner";
import fabric from "@/assets/image/dataset/fabric.png";
import { useConnectFabric } from "../../../../../../services/api/dataset/fabric/connectFabric";
import type { DatasetFabricReducerState } from "../../../../../../types/datasetFabric.types";
import { getErrorMessage } from "../../../../../../utils/getErrorMessage";
import FloatingInputField from "../../../../../reusable/FloatingInputField";
import LoadingPage from "../../../../../reusable/loadingPage";
import type { DatasetFabricAction } from "../../../DatasetFabric.reducer";

interface DatasetFabricConnectionProps {
  state: DatasetFabricReducerState;
  dispatch: React.Dispatch<DatasetFabricAction>;
}

const DatasetFabricConnection = ({ state, dispatch }: DatasetFabricConnectionProps) => {
  const { mutate: connectFabric, isPending: isConnectingFabric } = useConnectFabric();

  const onConnectFabric = () => {
    if (!state.dbConnection.serverName || !state.dbConnection.dbName) {
      toast.error("Error Validation ", {
        description: "Field cannot be empty",
      });
      return;
    }

    connectFabric(state.dbConnection, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Dataset Fabric Connect", {
            description: res.message || "Connect successfully.",
          });

          dispatch({
            type: "onChangeDbConnection",
            field: "checked",
            value: true,
          });
          dispatch({ type: "fabricTableList", payload: res.result || [] });
        }
      },
      onError: (error) => {
        toast.error("Failed to connect  ", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  return (
    <div className="flex items-center justify-center  ">
      <div className="flex w-full h-[470px] bg-white shadow-lg rounded-lg overflow-hidden border">
        <div className="w-1/3 flex justify-center items-center bg-gray-100">
          <img src={fabric} className="w-24" alt="Fabric logo" />
        </div>

        <div className="w-2/3 border-l border-gray-300 px-6 py-8">
          <div className="flex flex-col gap-4 w-full">
            <fieldset disabled={isConnectingFabric || state.dbConnection.checked}>
              <h1 className="text-lg font-bold mb-2">Connection Settings</h1>
              <p className="text-sm text-gray-600 mb-4">
                Please provide your connection details to access the data lake. Ensure the
                credentials are correct and the database is reachable.
              </p>

              <div className="space-y-5">
                <FloatingInputField
                  id="serverName"
                  label="Connection"
                  value={state.dbConnection.serverName}
                  type="text"
                  onChange={(e) =>
                    dispatch({
                      type: "onChangeDbConnection",
                      field: "serverName",
                      value: e.target.value,
                    })
                  }
                  placeholder=" Enter the full connection string for your data source."
                  error={false}
                />

                <FloatingInputField
                  id="dbName"
                  label="Database Name"
                  value={state.dbConnection.dbName}
                  type="text"
                  onChange={(e) =>
                    dispatch({
                      type: "onChangeDbConnection",
                      field: "dbName",
                      value: e.target.value,
                    })
                  }
                  placeholder="Specify the database you want to connect to"
                  error={false}
                />
              </div>
            </fieldset>

            <div className="flex justify-between mt-4 items-center">
              <button
                onClick={() => {
                  dispatch({
                    type: "onChangeDbConnection",
                    field: "serverName",
                    value:
                      "mlldua3fhp2elecslmhy3fe76q-lwzl7s6jxg5u5b6ieyex4djmiy.datawarehouse.fabric.microsoft.com",
                  });
                  dispatch({ type: "onChangeDbConnection", field: "dbName", value: "CSDatalake" });
                }}
                type="button"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              >
                <Cpu className="w-4 h-4" />
                Demo
              </button>
              <div className="flex items-center">
                {isConnectingFabric ? (
                  <LoadingPage isLoading={isConnectingFabric} />
                ) : state.dbConnection.checked ? (
                  <Check className="size-5 text-green-600" />
                ) : (
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      onConnectFabric();
                    }}
                    className="bg-[#1557b0] text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                  >
                    <Database className="w-4 h-4" />
                    Check Connection
                  </button>
                )}
                {state.dbConnection.checked && (
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "onChangeDbConnection",
                        field: "checked",
                        value: false,
                      })
                    }
                    className="bg-[#1557b0] text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 ml-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetFabricConnection;
