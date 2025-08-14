
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/xml": [".xml"],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-10 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out cursor-pointer
        ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50"
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 text-center">
        <FileText className="w-12 h-12 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg text-primary">Suelta el archivo aquí...</p>
        ) : (
          <>
            <p className="text-lg">
              Arrastra y suelta tu archivo XML aquí, o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              Solo se aceptan archivos XML
            </p>
          </>
        )}
      </div>
    </div>
  );
};
