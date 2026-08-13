import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import envLoader from "../../../../utils/envLoader";

interface DatasetPreviewPDFProps {
  source: string;
  title?: string;
}

export const DatasetPreviewPDF = ({
  source,
  title = "Dataset Preview",
}: DatasetPreviewPDFProps) => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PREVIEW_PDF_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/previewPDF/${source}`;

  useEffect(() => {
    if (!source) return;

    let objectUrl: string;
    setLoading(true);
    setError(null);

    fetch(PREVIEW_PDF_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load PDF");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        setError("PDF preview is not available");
      })
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, PREVIEW_PDF_API_URL]);

  if (!source) return null;

  return (
    <div className="rounded-xl bg-white h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 truncate max-w-[300px]">{source}</p>
        </div>

        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              download={source}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border 
                   hover:bg-gray-50 text-gray-700"
            >
              <Download size={14} />
              Download
            </a>
          )}
        </div>
      </div>

      <div className="p-4 flex-1">
        {loading && (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading PDF preview
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center text-red-500 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && url && (
          <iframe title="PDF Preview" src={url} className="w-full h-full rounded-md border" />
        )}
      </div>
    </div>
  );
};
