import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RouteNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-gray-800">404</h1>

        <p className="mt-2 text-gray-500">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/*<button*/}
        {/*    onClick={() => navigate("/CompanyInfo")}*/}
        {/*    className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 transition"*/}
        {/*>*/}
        {/*    Go Back Home*/}
        {/*</button>*/}
      </div>
    </div>
  );
};

export default RouteNotFound;
