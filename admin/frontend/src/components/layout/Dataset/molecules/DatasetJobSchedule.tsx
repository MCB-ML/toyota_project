import { CircleX } from "lucide-react";
import { toast } from "sonner";
import FloatingSelectField from "../../../reusable/FloatingSelectField";

interface DatasetJobScheduleProps {
  state: any;
  dispatch: React.Dispatch<any>;
}

export const DatasetJobSchedule = ({ state, dispatch }: DatasetJobScheduleProps) => {
  const onScheduleDate = () => {
    if (state.jobMethod === 2) {
      if (!state.jobRunDate || !state.jobRunTime) {
        toast.error("Import schedule date cannot be empty");
        return;
      }

      const datetimeString = `${state.jobRunDate}T${state.jobRunTime}:00`;
      const dateObj = new Date(datetimeString);
      const isValid = !Number.isNaN(dateObj.getTime());

      if (!isValid) {
        toast.error("Import schedule date is not valid date");
      } else {
        dispatch({ type: "showJobSchedule", payload: false });
      }
    } else {
      dispatch({ type: "showJobSchedule", payload: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-md overflow-hidden h-0full">
      <div className="bg-white rounded-xl shadow-md p-4 space-y-4 border ">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Import Scheduling</h3>

          <CircleX onClick={onScheduleDate} />
        </div>
        <p className="text-sm text-gray-500 ">
          Configure how often and when this import process should run.
        </p>

        <FloatingSelectField
          id="setJobMethod"
          label="Run Process"
          value={state.jobMethod}
          onChange={(e) =>
            dispatch({
              type: "setJobMethod",
              payload: e,
            })
          }
          options={[
            { label: "One time", value: "1" },
            { label: "Recurring", value: "2" },
          ]}
          placeholder="  Choose how often this import process should run."
          error={false}
          errorMessage={""}
        />

        {state.jobMethod === "2" && (
          <div>
            <label className="block text-sm font-semibold mb-1">Schedule Date & Time:</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col w-full md:w-1/2">
                <input
                  type="date"
                  name="jobRunDate"
                  value={state.jobRunDate}
                  onChange={(e) =>
                    dispatch({
                      type: "setJobRunDate",
                      payload: e.target.value,
                    })
                  }
                  className={`border  rounded-lg w-full py-2 px-3 text-sm focus:outline-none `}
                />
              </div>
              <div className="flex flex-col w-full md:w-1/2">
                <input
                  type="time"
                  name="jobRunTime"
                  value={state.jobRunTime}
                  onChange={(e) =>
                    dispatch({
                      type: "setJobRunTime",
                      payload: e.target.value,
                    })
                  }
                  className={`border  rounded-lg w-full py-2 px-3 text-sm focus:outline-none `}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select the exact date and time for the import process.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
