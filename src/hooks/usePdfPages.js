import { useEffect, useState } from "react";
import { loadPdf } from "../services/mediaStore";

export default function usePdfPages(pdfId) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState("Le fichier n'a pas pu être chargé");

  useEffect(() => {
    let cancelled = false;

    setPages([]);
    setLoading(true);
    setLoadError(false);
    setLoadErrorMessage("Le fichier n'a pas pu être chargé");

    if (!pdfId) {
      setLoadErrorMessage("Aucun PDF n'est associé à ce projet.");
      setLoadError(true);
      setLoading(false);
      return undefined;
    }

    loadPdf(pdfId).then(async (data) => {
      if (!data) {
        setLoadErrorMessage("Le PDF est manquant ou illisible.");
        setLoadError(true);
        setLoading(false);
        return;
      }

      try {
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }

        const base64 = data.includes(",") ? data.split(",")[1] : data;
        const chunkSize = 32768;
        const chunks = [];

        for (let i = 0; i < base64.length; i += chunkSize) {
          const chunk = atob(base64.slice(i, i + chunkSize));
          const bytes = new Uint8Array(chunk.length);
          for (let j = 0; j < chunk.length; j++) bytes[j] = chunk.charCodeAt(j);
          chunks.push(bytes);
        }

        const totalLen = chunks.reduce((s, c) => s + c.length, 0);
        const arr = new Uint8Array(totalLen);
        let offset = 0;

        for (const chunk of chunks) {
          arr.set(chunk, offset);
          offset += chunk.length;
        }

        const pdf = await window.pdfjsLib.getDocument({ data: arr }).promise;
        if (cancelled) return;

        setLoading(false);

        const dpr = window.devicePixelRatio || 2;
        const scale = pdf.numPages > 30 ? 1.5 : pdf.numPages > 15 ? dpr * 1.5 : dpr * 2;

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;

          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");
            await page.render({ canvasContext: ctx, viewport }).promise;
            const imgData = canvas.toDataURL("image/jpeg", 0.85);

            canvas.width = 0;
            canvas.height = 0;

            if (!cancelled) {
              setPages(prev => [...prev, imgData]);
            }
          } catch (pageErr) {
            console.warn(`Page ${i} échouée:`, pageErr);
          }
        }
      } catch (e) {
        console.error("PDF error:", e);
        if (!cancelled) {
          setLoadErrorMessage("Le rendu du PDF a échoué.");
          setLoadError(true);
          setLoading(false);
        }
      }
    }).catch((e) => {
      console.error("PDF load error:", e);
      if (!cancelled) {
        setLoadErrorMessage("Le chargement du PDF a échoué.");
        setLoadError(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfId]);

  return {
    pages,
    loading,
    loadError,
    loadErrorMessage,
  };
}
