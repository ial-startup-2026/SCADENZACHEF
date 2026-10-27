/** Dimensioni finali di un'immagine ridotta a `latoMax` sul lato lungo, senza mai ingrandirla. */
export function calcolaDimensioni(larghezza: number, altezza: number, latoMax: number) {
  const scala = Math.min(1, latoMax / Math.max(larghezza, altezza));
  return {
    larghezza: Math.max(1, Math.round(larghezza * scala)),
    altezza: Math.max(1, Math.round(altezza * scala)),
  };
}

type Opzioni = { latoMax: number; qualita?: number; quadrata?: boolean };

/** Ridimensiona e comprime nel browser (JPEG) prima di caricare o inviare un'immagine. */
export async function ridimensionaImmagine(file: Blob, { latoMax, qualita = 0.8, quadrata }: Opzioni): Promise<Blob> {
  // imageOrientation: rispetta la rotazione EXIF delle foto scattate con il telefono.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    let sx = 0;
    let sy = 0;
    let sl = bitmap.width;
    let sa = bitmap.height;
    if (quadrata) {
      const lato = Math.min(bitmap.width, bitmap.height);
      sx = (bitmap.width - lato) / 2;
      sy = (bitmap.height - lato) / 2;
      sl = sa = lato;
    }
    const { larghezza, altezza } = calcolaDimensioni(sl, sa, latoMax);
    const canvas = document.createElement("canvas");
    canvas.width = larghezza;
    canvas.height = altezza;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_non_disponibile");
    ctx.drawImage(bitmap, sx, sy, sl, sa, 0, 0, larghezza, altezza);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compressione_fallita"))), "image/jpeg", qualita),
    );
  } finally {
    bitmap.close();
  }
}
