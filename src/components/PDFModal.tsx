import React, { useEffect } from "react";
import { X, ExternalLink, FileText } from "lucide-react";

export interface PDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title?: string;
}

export const PDFModal: React.FC<PDFModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  title = "Document Viewer",
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !fileUrl) return null;

  const viewerSrc = `/pdfjs/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] md:h-[94vh] bg-surface rounded-2xl shadow-2xl border border-border/60 overflow-hidden flex flex-col text-foreground transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/50 bg-card/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <FileText className="h-5 w-5 text-[#ff2273] shrink-0" />
            <h3
              id="pdf-modal-title"
              className="text-sm sm:text-base font-semibold truncate tracking-tight text-foreground"
            >
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition-colors"
              title="Open direct file link or download"
            >
              <span className="hidden sm:inline">Direct Link</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
              title="Close viewer"
              aria-label="Close viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Viewer iframe Container */}
        <div className="flex-1 w-full h-full bg-black/50 relative overflow-hidden">
          <iframe
            src={viewerSrc}
            className="w-full h-full border-none"
            allow="fullscreen"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFModal;
