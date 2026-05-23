interface FileAttachmentUploaderProps {
  attachments: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export default function FileAttachmentUploader({
  attachments,
  onFileChange,
  onRemoveFile,
}: FileAttachmentUploaderProps) {
  return (
    <div>
      <label htmlFor="attachments" className="block text-sm font-medium text-foreground mb-2">
        Attachments (Optional)
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Upload supporting documents (Word, PDF, JPEG, PNG) to help AI analyze your problem
      </p>
      
      <input
        type="file"
        id="attachments"
        multiple
        accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
        onChange={onFileChange}
        className="hidden"
      />
      <label
        htmlFor="attachments"
        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all"
      >
        <svg
          className="w-5 h-5 mr-2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span className="text-sm text-muted-foreground">
          {attachments.length > 0 
            ? `${attachments.length} file(s) selected` 
            : "Click to upload files"}
        </span>
      </label>
      
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
