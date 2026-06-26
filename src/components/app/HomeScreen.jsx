import React from "react";
import HomeView from "../home/HomeView";

export default function HomeScreen({
  auth,
  creation,
  currentView,
  database,
  home,
  keepHubMounted,
  mode,
  navigation,
  photo,
  previewHubStyle,
  projects,
  records,
  setters,
  modals,
}) {
  if (!keepHubMounted) return null;

  return (
    <div style={previewHubStyle} aria-hidden={currentView !== "hub"}>
      <HomeView
        creation={creation}
        auth={auth}
        database={database}
        home={home}
        mode={mode}
        modals={modals}
        navigation={navigation}
        photo={photo}
        projects={projects}
        records={records}
        setters={setters}
      />
    </div>
  );
}
