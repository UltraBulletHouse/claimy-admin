import Image from "next/image";
import { useState } from "react";

interface Props {
  productUrl?: string;
  receiptUrl?: string;
}

export default function CaseImages({ productUrl, receiptUrl }: Props) {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const images = [
    { label: "Product", url: productUrl },
    { label: "Receipt", url: receiptUrl }
  ].filter((item) => Boolean(item.url));

  if (!images.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No images uploaded for this case.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {images.map((image) => (
          <div
            key={image.label}
            className="cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            onClick={() => image.url && setModalImage(image.url)}
          >
            {image.url ? (
              <Image
                src={image.url}
                alt={image.label}
                width={600}
                height={600}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                Missing {image.label} image
              </div>
            )}
            <div className="border-t border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              {image.label}
            </div>
          </div>
        ))}
      </div>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
          onClick={() => setModalImage(null)}
        >
          <div className="relative h-[70vh] w-full max-w-4xl">
            <Image
              src={modalImage}
              alt="Zoomed"
              fill
              className="rounded-lg object-contain shadow-2xl"
              sizes="(min-width: 1024px) 1024px, 100vw"
            />
            <button
              className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow"
              onClick={(event) => {
                event.stopPropagation();
                setModalImage(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
