import React from "react";
import { GLOBAL_MOTION_CSS } from "../../styles/motion";
import usePatronEditor from "../../hooks/usePatronEditor";
import PatronEditorHeader from "./PatronEditorHeader";
import PatronInfoCard from "./PatronInfoCard";
import PatronPartiesList from "./PatronPartiesList";

export default function PatronEditorView({ currentPatron, currentProject, updatePatron, updateProject, navigateToLibrary, navigateToHub }) {
const {
  addPartie,
  addRang,
  deletePartie,
  deleteRang,
  duplicatePartie,
  duplicateRang,
  handleSave,
  handleSaveNom,
  isEditingNom,
  isPatronMode,
  movePartie,
  moveRang,
  patron,
  setIsEditingNom,
  setTempNom,
  tempNom,
  totalRangsPatron,
  updatePartie,
  updatePatronInfo,
  updateRang,
} = usePatronEditor({
  currentPatron,
  currentProject,
  navigateToHub,
  navigateToLibrary,
  updatePatron,
  updateProject,
});
return (
  <div style={{ background: "#0D0D1A", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap'); ${GLOBAL_MOTION_CSS} ::-webkit-scrollbar{width:0} *{-webkit-tap-highlight-color:transparent} input,textarea,select{font-size:16px!important}`}</style>
    <PatronEditorHeader
      isEditingNom={isEditingNom}
      isPatronMode={isPatronMode}
      navigateToHub={navigateToHub}
      navigateToLibrary={navigateToLibrary}
      onSave={handleSave}
      onSaveNom={handleSaveNom}
      patron={patron}
      setIsEditingNom={setIsEditingNom}
      setTempNom={setTempNom}
      tempNom={tempNom}
      totalRangsPatron={totalRangsPatron}
    />
    <PatronInfoCard patron={patron} updatePatronInfo={updatePatronInfo} />
    <PatronPartiesList
      addPartie={addPartie}
      addRang={addRang}
      deletePartie={deletePartie}
      deleteRang={deleteRang}
      duplicatePartie={duplicatePartie}
      duplicateRang={duplicateRang}
      movePartie={movePartie}
      moveRang={moveRang}
      patron={patron}
      updatePartie={updatePartie}
      updateRang={updateRang}
    />
  </div>
);

}
