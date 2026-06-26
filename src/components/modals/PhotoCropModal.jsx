import { useEffect, useRef, useState } from "react";
import { getCachedImage, loadImage } from "../../services/mediaStore";
import IconBadge from "../ui/IconBadge";

export default function PhotoCropModal({ onClose, onConfirm, existingImage }) {
  const [imgSrc, setImgSrc] = useState(existingImage?.src || existingImage?.preview || (typeof existingImage === "string" ? existingImage : null));
  const [pos, setPos] = useState(existingImage?.pos || { x: 0, y: 0 });
  const [scale, setScale] = useState(existingImage?.scale || 1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouch = useRef(null);
  const lastDist = useRef(null);
  const lastScale = useRef(1);
  const lastPos = useRef({ x: 0, y: 0 });
  const CROP_SIZE = 260;

  useEffect(() => {
    let cancelled = false;
    const previewImage = existingImage?.preview || null;
    const directOriginal = existingImage?.src || (typeof existingImage === "string" ? existingImage : null);

    setPos(existingImage?.pos || { x: 0, y: 0 });
    setScale(existingImage?.scale || 1);
    setNaturalSize({ width: 0, height: 0 });

    if (directOriginal) {
      setImgSrc(directOriginal);
      return () => { cancelled = true; };
    }

    const previewId = existingImage?.previewId;
    const imageId = existingImage?.imageId;
    if (previewImage) setImgSrc(previewImage);

    const cachedPreview = getCachedImage(previewId);
    if (cachedPreview) setImgSrc(cachedPreview);
    else if (previewId) {
      loadImage(previewId).then((data) => {
        if (!cancelled && data) setImgSrc(data);
      });
    }

    const cachedImage = getCachedImage(imageId);
    if (cachedImage) {
      setImgSrc(cachedImage);
      return () => { cancelled = true; };
    }

    if (!imageId) {
      setImgSrc(null);
      return () => { cancelled = true; };
    }

    loadImage(imageId).then((data) => {
      if (!cancelled) setImgSrc(data || null);
    });

    return () => { cancelled = true; };
  }, [existingImage]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target.result);
      setPos({ x: 0, y: 0 });
      setScale(1);
      setNaturalSize({ width: 0, height: 0 });
    };
    reader.readAsDataURL(file);
  };

  const getDist = (t1, t2) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPos.current = pos;
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      lastDist.current = getDist(e.touches[0], e.touches[1]);
      lastScale.current = scale;
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setPos({ x: lastPos.current.x + dx, y: lastPos.current.y + dy });
    } else if (e.touches.length === 2 && lastDist.current) {
      const dist = getDist(e.touches[0], e.touches[1]);
      const newScale = Math.min(5, Math.max(0.2, lastScale.current * (dist / lastDist.current)));
      setScale(newScale);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    lastTouch.current = null;
  };

  const previewBaseScale = naturalSize.width && naturalSize.height
    ? Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height)
    : 1;

  const handleConfirm = () => {
    if (!imgSrc) return;
    const img = new Image();
    img.onload = () => {
      const OUT = 160;
      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");

      const baseScale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);
      const finalScale = baseScale * scale;
      const w = img.width * finalScale * (OUT / CROP_SIZE);
      const h = img.height * finalScale * (OUT / CROP_SIZE);

      ctx.drawImage(
        img,
        (OUT - w) / 2 + pos.x * (OUT / CROP_SIZE),
        (OUT - h) / 2 + pos.y * (OUT / CROP_SIZE),
        w,
        h,
      );

      onConfirm({
        src: imgSrc,
        pos,
        scale,
        preview: canvas.toDataURL("image/jpeg", 0.82),
      });
    };
    img.src = imgSrc;
  };

  return (
    <div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      {!imgSrc ? (
        <div data-kaleido-modal-card="true" style={{ textAlign: "center", padding: 32, background: "#1A1A2E", borderRadius: 18, width: "calc(100% - 40px)", maxWidth: 340 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><IconBadge name="camera" tone="pink" size={28} badgeSize={64} /></div>
          <h3 style={{ color: "#F1F0EE", fontSize: 20, fontFamily: "'Syne', sans-serif", margin: "0 0 8px" }}>Ajouter une photo</h3>
          <p style={{ color: "#6B6A7A", fontSize: 14, margin: "0 0 28px" }}>Choisis une photo depuis ta galerie</p>
          <label style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", borderRadius: 16, padding: "14px 32px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "inline-block" }}>
            Choisir une photo
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>
          <div style={{ marginTop: 20 }}>
            <button onClick={onClose} style={{ background: "#1E1E32", border: "1px solid #555", borderRadius: 12, padding: "10px 24px", color: "#F1F0EE", fontSize: 14, cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100vh", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 2, marginTop: 60, marginBottom: 20 }}>
            <p style={{ color: "#fff", fontSize: 14, margin: 0, textAlign: "center" }}>Déplace et zoome pour recadrer</p>
          </div>
          <div
            style={{ position: "relative", zIndex: 2, width: CROP_SIZE, height: CROP_SIZE, borderRadius: "50%", overflow: "hidden", border: "3px solid #A78BFA", cursor: "grab", touchAction: "none", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.18), 0 18px 56px rgba(0,0,0,0.42)" }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={imgSrc}
              alt="crop"
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth && naturalHeight && (naturalWidth !== naturalSize.width || naturalHeight !== naturalSize.height)) {
                  setNaturalSize({ width: naturalWidth, height: naturalHeight });
                }
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: naturalSize.width ? `${naturalSize.width * previewBaseScale}px` : "auto",
                height: naturalSize.height ? `${naturalSize.height * previewBaseScale}px` : "auto",
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
                transformOrigin: "center",
                userSelect: "none",
                pointerEvents: "none",
              }}
              draggable={false}
            />
          </div>
          <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 14, marginTop: 36 }}>
            <button onClick={onClose} style={{ padding: "14px 30px", borderRadius: 14, border: "2px solid #555", background: "#2A2A3E", color: "#F1F0EE", fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Annuler</button>
            <button onClick={handleConfirm} style={{ padding: "14px 30px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7C3AED, #EC4899)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Confirmer ✓</button>
          </div>
          <div style={{ position: "relative", zIndex: 2, marginTop: 16 }}>
            <label style={{ color: "#ccc", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>
              Changer de photo
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
