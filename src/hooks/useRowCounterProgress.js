import { useEffect, useRef, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../constants/colors";

export default function useRowCounterProgress({ project, onNavigateHub, onSaveProgress }) {
  const patron = {
    nom: project?.name || "Projet",
    technique: project?.type || "crochet",
    outil: project?.outil || "",
    parties: project?.parties || [],
  };
  const hasParties = patron.parties.length > 0 && patron.parties.some(p => p.rangs.length > 0);
  const allRangs = patron.parties.flatMap((p, pi) => p.rangs.map((r, ri) => ({ ...r, partieId: p.id, globalId: `${pi}-${ri}` })));
  const allRangsForCount = allRangs.filter(r => !r.isNote);
  const totalRangsForCount = allRangsForCount.length;
  const savedCountableIndex = Math.max(0, Math.min((project?.rang || 1) - 1, Math.max(0, allRangsForCount.length - 1)));
  const savedGlobalId = allRangsForCount[savedCountableIndex]?.globalId || allRangs[0]?.globalId || null;
  const savedIndex = Math.max(0, allRangs.findIndex(r => r.globalId === savedGlobalId));
  const [currentRangId, setCurrentRangId] = useState(savedGlobalId);
  const currentRangIdRef = useRef(savedGlobalId);
  const currentIndexRef = useRef(savedIndex);
  const [startTime, setStartTime] = useState(Date.now() - (project?.elapsedTime || 0));
  const [elapsedTime, setElapsedTime] = useState(project?.elapsedTime || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const elapsedTimeRef = useRef(project?.elapsedTime || 0);
  const wasPausedByVisibilityRef = useRef(false);
  const lastPartieTickRef = useRef(Date.now());
  const currentPartieIdRef = useRef(null);
  const partieTimesRef = useRef(project?.partieTimes || {});
  const [counters, setCounters] = useState([]);
  const [instructionHighlights, setInstructionHighlights] = useState(project?.instructionHighlights || {});
  const [showNextPartieModal, setShowNextPartieModal] = useState(false);
  const [showPrevPartieModal, setShowPrevPartieModal] = useState(false);
  const [showFinModal, setShowFinModal] = useState(false);

  useEffect(() => {
    if (!isTimerRunning) return undefined;

    const interval = setInterval(() => {
      const now = Date.now();
      addPartieTime(now);
      const nextElapsed = now - startTime;
      elapsedTimeRef.current = nextElapsed;
      setElapsedTime(nextElapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) {
        if (isTimerRunning) {
          const now = Date.now();
          addPartieTime(now);
          const nextElapsed = now - startTime;
          elapsedTimeRef.current = nextElapsed;
          setElapsedTime(nextElapsed);
          if (typeof onSaveProgress === "function") {
            onSaveProgress(
              allRangs.slice(0, Math.max(0, currentIndexRef.current) + 1).filter(r => !r.isNote).length,
              totalRangsForCount,
              nextElapsed,
              { instructionHighlights, partieTimes: partieTimesRef.current }
            );
          }
          wasPausedByVisibilityRef.current = true;
        }
        setIsTimerRunning(false);
      } else {
        lastPartieTickRef.current = Date.now();
        if (wasPausedByVisibilityRef.current) {
          setStartTime(Date.now() - elapsedTimeRef.current);
          setIsTimerRunning(true);
          wasPausedByVisibilityRef.current = false;
        } else {
          setStartTime(Date.now() - elapsedTimeRef.current);
        }
      }
    };

    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("pagehide", pauseWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("pagehide", pauseWhenHidden);
    };
  }, [isTimerRunning, startTime]);

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      addPartieTime();
      elapsedTimeRef.current = Date.now() - startTime;
      setElapsedTime(elapsedTimeRef.current);
      setIsTimerRunning(false);
    } else {
      lastPartieTickRef.current = Date.now();
      setStartTime(Date.now() - elapsedTimeRef.current);
      setIsTimerRunning(true);
    }
  };

  const resetTimer = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    partieTimesRef.current = {};
    lastPartieTickRef.current = Date.now();
    setIsTimerRunning(true);
  };

  const currentIndex = allRangs.findIndex(r => r.globalId === currentRangId);

  useEffect(() => {
    currentRangIdRef.current = currentRangId;
    currentIndexRef.current = currentIndex;
  }, [currentRangId, currentIndex]);

  const currentRang = allRangs[currentIndex];
  const totalRangs = allRangsForCount.length;
  const currentCountIndex = currentRang?.isNote
    ? allRangs.slice(0, currentIndex).filter(r => !r.isNote).length - 1
    : allRangs.slice(0, currentIndex + 1).filter(r => !r.isNote).length - 1;
  const currentPartie = currentRang ? patron.parties.find(p => p.id === currentRang.partieId) : null;
  const partieRangsOnly = currentPartie ? currentPartie.rangs.filter(r => !r.isNote) : [];
  const currentPartieRangIndex = currentPartie ? (() => {
    if (!currentRang?.isNote) return partieRangsOnly.findIndex(r => r.id === currentRang?.id);
    const idxInAll = currentPartie.rangs.findIndex(r => r.id === currentRang?.id);
    const lastNormalBefore = currentPartie.rangs.slice(0, idxInAll).filter(r => !r.isNote);
    if (lastNormalBefore.length === 0) return -1;
    return partieRangsOnly.findIndex(r => r.id === lastNormalBefore[lastNormalBefore.length - 1].id);
  })() : 0;
  const currentPartieTotal = partieRangsOnly.length || 1;
  const currentPartieColor = currentPartie
    ? KALEIDOSCOPE_COLORS[currentPartie.colorIdx % KALEIDOSCOPE_COLORS.length]
    : KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];

  useEffect(() => {
    currentPartieIdRef.current = currentPartie?.id ? String(currentPartie.id) : "global";
  }, [currentPartie?.id]);

  const addPartieTime = (now = Date.now()) => {
    const partieId = currentPartieIdRef.current || "global";
    const delta = Math.max(0, now - lastPartieTickRef.current);
    if (delta > 0 && delta < 60000) {
      partieTimesRef.current = {
        ...partieTimesRef.current,
        [partieId]: Math.max(0, Number(partieTimesRef.current?.[partieId]) || 0) + delta,
      };
    }
    lastPartieTickRef.current = now;
    return partieTimesRef.current;
  };

  const getPartieFirstInstructionGlobalId = (partieId) => {
    if (!partieId) return null;
    const firstAny = allRangs.find(r => r.partieId === partieId);
    return firstAny?.globalId || null;
  };

  const saveProgressAtIndex = (index) => {
    if (typeof onSaveProgress === "function") {
      onSaveProgress(allRangs.slice(0, Math.max(0, index) + 1).filter(r => !r.isNote).length, totalRangsForCount, elapsedTimeRef.current, { instructionHighlights, partieTimes: partieTimesRef.current });
    }
  };

  const setHighlightedInstruction = (rangId, segmentIndex) => {
    if (!rangId) return;
    setInstructionHighlights((current) => {
      const next = { ...current };
      if (current?.[rangId] === segmentIndex) {
        delete next[rangId];
      } else {
        next[rangId] = segmentIndex;
      }
      if (typeof onSaveProgress === "function") {
        onSaveProgress(
          allRangs.slice(0, Math.max(0, currentIndexRef.current) + 1).filter(r => !r.isNote).length,
          totalRangsForCount,
          elapsedTimeRef.current,
          { instructionHighlights: next, partieTimes: partieTimesRef.current }
        );
      }
      return next;
    });
  };

  const handleBackToHub = () => {
    addPartieTime();
    saveProgressAtIndex(currentIndexRef.current);
    if (typeof onNavigateHub === "function") onNavigateHub();
  };

  const nextRang = () => {
    addPartieTime();
    const liveIndex = currentIndexRef.current;
    if (liveIndex >= allRangs.length - 1) {
      setShowFinModal(true);
      return;
    }
    const liveCurrent = allRangs[liveIndex];
    const liveNext = allRangs[liveIndex + 1];
    const liveIsLastOfPartie = !!liveCurrent && !!liveNext && liveNext.partieId !== liveCurrent.partieId;

    if (liveIsLastOfPartie) {
      setShowNextPartieModal(true);
    } else {
      currentRangIdRef.current = liveNext.globalId;
      currentIndexRef.current = liveIndex + 1;
      setCurrentRangId(liveNext.globalId);
      saveProgressAtIndex(liveIndex + 1);
      if (liveIndex + 1 >= allRangs.length - 1) {
        setShowFinModal(true);
      }
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const completeProject = () => {
    addPartieTime();
    if (typeof onSaveProgress === "function") {
      onSaveProgress(totalRangsForCount, totalRangsForCount, elapsedTimeRef.current, {
        instructionHighlights,
        partieTimes: partieTimesRef.current,
        status: "termine",
        completedAt: new Date().toISOString(),
      });
    }
    setShowFinModal(false);
    if (typeof onNavigateHub === "function") onNavigateHub();
  };

  const confirmNextPartie = () => {
    addPartieTime();
    const liveIndex = currentIndexRef.current;
    const nextPartieId = allRangs[liveIndex + 1]?.partieId;
    const targetGlobalId = getPartieFirstInstructionGlobalId(nextPartieId) || allRangs[liveIndex + 1]?.globalId || null;

    if (targetGlobalId) {
      currentRangIdRef.current = targetGlobalId;
      currentIndexRef.current = allRangs.findIndex(r => r.globalId === targetGlobalId);
      setCurrentRangId(targetGlobalId);
      saveProgressAtIndex(currentIndexRef.current);
    }

    setShowNextPartieModal(false);
    setCounters(prev => prev.map(c => ({ ...c, value: 1 })));
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const prevRang = () => {
    addPartieTime();
    const liveIndex = currentIndexRef.current;
    if (liveIndex <= 0) return;
    const liveCurrent = allRangs[liveIndex];
    const livePrev = allRangs[liveIndex - 1];
    const liveIsFirstOfPartie = !!liveCurrent && !!livePrev && livePrev.partieId !== liveCurrent.partieId;

    if (liveIsFirstOfPartie) {
      setShowPrevPartieModal(true);
    } else {
      currentRangIdRef.current = livePrev.globalId;
      currentIndexRef.current = liveIndex - 1;
      setCurrentRangId(livePrev.globalId);
      if (typeof onSaveProgress === "function") onSaveProgress(allRangs.slice(0, liveIndex).filter(r => !r.isNote).length, totalRangsForCount, elapsedTimeRef.current, { instructionHighlights, partieTimes: partieTimesRef.current });
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const confirmPrevPartie = () => {
    addPartieTime();
    const liveIndex = currentIndexRef.current;
    const target = allRangs[liveIndex - 1];

    if (target) {
      currentRangIdRef.current = target.globalId;
      currentIndexRef.current = liveIndex - 1;
      setCurrentRangId(target.globalId);
      if (typeof onSaveProgress === "function") onSaveProgress(allRangs.slice(0, liveIndex).filter(r => !r.isNote).length, totalRangsForCount, elapsedTimeRef.current, { instructionHighlights, partieTimes: partieTimesRef.current });
    }

    setShowPrevPartieModal(false);
    setCounters(prev => prev.map(c => ({ ...c, value: 1 })));
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const goToPartie = (partieId) => {
    addPartieTime();
    const targetGlobalId = getPartieFirstInstructionGlobalId(partieId);

    if (targetGlobalId) {
      currentRangIdRef.current = targetGlobalId;
      currentIndexRef.current = allRangs.findIndex(r => r.globalId === targetGlobalId);
      setCurrentRangId(targetGlobalId);
      saveProgressAtIndex(currentIndexRef.current);
    }

    setCounters(prev => prev.map(c => ({ ...c, value: 1 })));
  };

  const addCounter = () => setCounters(prev => [...prev, { id: Date.now(), name: `Compteur ${prev.length + 1}`, value: 1, maxRepeats: 4, syncWithGlobal: false, colorIdx: Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length) }]);
  const updateCounter = (id, updates) => setCounters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCounter = (id) => setCounters(prev => prev.filter(c => c.id !== id));

  return {
    addCounter,
    allRangs,
    confirmNextPartie,
    confirmPrevPartie,
    completeProject,
    counters,
    currentCountIndex,
    currentIndex,
    currentPartie,
    currentPartieColor,
    currentPartieRangIndex,
    currentPartieTotal,
    currentRang,
    deleteCounter,
    elapsedTime,
    formatTime,
    goToPartie,
    handleBackToHub,
    hasParties,
    isTimerRunning,
    instructionHighlights,
    nextRang,
    patron,
    prevRang,
    resetTimer,
    setShowNextPartieModal,
    setShowPrevPartieModal,
    setShowFinModal,
    setHighlightedInstruction,
    showNextPartieModal,
    showPrevPartieModal,
    showFinModal,
    toggleTimer,
    totalRangs,
    updateCounter,
  };
}
