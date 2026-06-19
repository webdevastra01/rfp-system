"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  FileIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FileGalleryProps = {
  documents: string[];
  orderNumber?: string;
};

export default function FileGallery({
  documents,
  orderNumber,
}: FileGalleryProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageRef = useRef<HTMLDivElement>(null);

  const isImageFile = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url.split("?")[0]);
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 5));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {documents.map((url, index) => {
          const isImg = isImageFile(url);
          const fileName =
            url.split("/").pop()?.split("?")[0] || `File ${index + 1}`;

          return (
            <div
              key={index}
              onClick={() => {
                setPreviewUrl(url);
                setIsImage(isImg);
                setZoomLevel(1); // Reset zoom when opening new image
              }}
              className="group relative aspect-square border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-[#2B3A9F] hover:shadow-md transition-all duration-200 bg-white"
            >
              {isImg ? (
                <Image
                  src={url}
                  alt={fileName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                  <FileIcon className="w-10 h-10 text-slate-400 mb-2" />
                  <span className="text-[10px] text-slate-500 font-mono text-center px-2 truncate w-full">
                    {fileName}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Dialog with Zoom */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={() => {
          setPreviewUrl(null);
          setZoomLevel(1);
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-6 overflow-hidden">
          <DialogTitle className="sr-only">Document Preview</DialogTitle>

          {previewUrl && (
            <div className="flex flex-col h-full">
              {/* Zoom Controls */}
              {isImage && (
                <div className="flex justify-center gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="px-4 py-1.5 bg-white border rounded-md text-sm font-mono min-w-[80px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  <Button variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetZoom}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Image Container */}
              {isImage ? (
                <div
                  ref={imageRef}
                  className="relative flex-1 w-full bg-slate-950/5 rounded-2xl overflow-auto border"
                  onWheel={handleWheel}
                  style={{ cursor: zoomLevel > 1 ? "grab" : "default" }}
                >
                  <div
                    className="relative w-full h-full flex items-center justify-center p-4 transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={1600}
                      height={1200}
                      className="max-h-[80vh] w-auto rounded-lg shadow-2xl"
                      style={{ objectFit: "contain" }}
                      unoptimized
                      priority
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 w-full py-20 rounded-xl flex flex-col items-center justify-center border border-dashed border-slate-300">
                  <FileIcon className="w-20 h-20 text-slate-400 mb-6" />
                  <p className="text-slate-600 font-medium mb-2">
                    Document Preview Not Available
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    This appears to be a PDF or other document
                  </p>

                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white px-8 py-3 rounded-xl font-medium transition-colors"
                  >
                    Open Full Document <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
