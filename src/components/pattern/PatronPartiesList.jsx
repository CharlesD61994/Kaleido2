import React from "react";
import { PartieSection } from "./PatternSections";

function getPartieRepeatMeta(parties, targetIndex) {
  for (let startIndex = 0; startIndex < parties.length; startIndex += 1) {
    const repeat = parties[startIndex]?.partieRepeat;
    if (!repeat?.endPartieId) continue;
    const endIndex = parties.findIndex((partie) => String(partie.id) === String(repeat.endPartieId));
    if (endIndex < startIndex) continue;
    if (targetIndex >= startIndex && targetIndex <= endIndex) {
      return {
        colorIdx: parties[startIndex]?.colorIdx,
        infinite: repeat.infinite === true,
        isEnd: targetIndex === endIndex,
        isStart: targetIndex === startIndex,
        passages: repeat.passages,
      };
    }
  }
  return null;
}

export default function PatronPartiesList({
  addPartie,
  addRang,
  deletePartie,
  deleteRang,
  duplicatePartie,
  duplicateRang,
  movePartie,
  moveRang,
  patron,
  updatePartie,
  updateRang,
}) {
  return (
    <div style={{ padding: "0 20px 100px" }}>
      {patron.parties.map((partie, index) => (
        <PartieSection key={partie.id} partie={partie}
          allParties={patron.parties}
          partieIndex={index}
          partieRepeatMeta={getPartieRepeatMeta(patron.parties, index)}
          onUpdate={updatePartie} onDelete={deletePartie} onDuplicate={duplicatePartie}
          onMoveUp={id => movePartie(id, "up")} onMoveDown={id => movePartie(id, "down")}
          isFirst={index === 0} isLast={index === patron.parties.length - 1}
          onAddRang={addRang} onUpdateRang={updateRang} onDeleteRang={deleteRang}
          onDuplicateRang={duplicateRang} onMoveRangUp={(partieId, rangId) => moveRang(partieId, rangId, "up")} onMoveRangDown={(partieId, rangId) => moveRang(partieId, rangId, "down")} />
      ))}
      <button onClick={addPartie} style={{ width: "100%", padding: "16px", borderRadius: 16, background: "none", border: "2px dashed #7C3AED44", color: "#7C3AED", fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        + Ajouter une partie
      </button>
    </div>
  );
}
