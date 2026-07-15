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
  const savedExplicitGlobalId = project?.currentRangGlobalId
    && allRangs.some((rang) => rang.globalId === project.currentRangGlobalId)
    ? project.currentRangGlobalId
    : null;
  const savedGlobalId = savedExplicitGlobalId || allRangsForCount[savedCountableIndex]?.globalId || allRangs[0]?.globalId || null;
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
  const partieCurrentRangGlobalIdsRef = useRef(project?.partieCurrentRangGlobalIds || {});
  const [counters, setCounters] = useState([]);
  const [instructionHighlights, setInstructionHighlights] = useState(project?.instructionHighlights || {});
  const [rangRepeatState, setRangRepeatState] = useState(project?.rangRepeatState || {});
  const rangRepeatStateRef = useRef(project?.rangRepeatState || {});
  const [partieRepeatState, setPartieRepeatState] = useState(project?.partieRepeatState || {});
  const partieRepeatStateRef = useRef(project?.partieRepeatState || {});
  const [showNextPartieModal, setShowNextPartieModal] = useState(false);
  const [showPrevPartieModal, setShowPrevPartieModal] = useState(false);
  const [showFinModal, setShowFinModal] = useState(false);
  const [showFinishRepeatModal, setShowFinishRepeatModal] = useState(false);

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
              getVirtualCountAtIndex(currentIndexRef.current),
              getVirtualTotal(),
              nextElapsed,
              {
                currentRangGlobalId: allRangs[Math.max(0, currentIndexRef.current)]?.globalId || null,
                partieCurrentRangGlobalIds: partieCurrentRangGlobalIdsRef.current,
                instructionHighlights,
                partieTimes: partieTimesRef.current,
                rangRepeatState: rangRepeatStateRef.current,
                partieRepeatState: partieRepeatStateRef.current,
              }
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
  const getRepeatDefinitions = () => allRangs
    .map((rang, startIndex) => {
      const repeat = rang?.repeat;
      if (!repeat || rang?.isNote) return null;
      const endIndex = allRangs.findIndex((item) => item.partieId === rang.partieId && item.id === repeat.endRangId);
      if (endIndex < startIndex) return null;
      const length = allRangs.slice(startIndex, endIndex + 1).filter((item) => !item.isNote).length;
      if (length <= 0) return null;
      return {
        key: repeat.id || `repeat-${rang.globalId}`,
        startIndex,
        endIndex,
        startGlobalId: rang.globalId,
        passages: Math.max(2, Number(repeat.passages) || 2),
        infinite: repeat.infinite === true,
        length,
      };
    })
    .filter(Boolean);
  const repeatDefinitions = getRepeatDefinitions();
  const getRepeatPassage = (repeat) => Math.max(1, Number(rangRepeatStateRef.current?.[repeat.key]?.passage) || 1);
  const getActiveRepeat = (index) => repeatDefinitions.find((repeat) => index >= repeat.startIndex && index <= repeat.endIndex) || null;
  const partieRepeatDefinitions = patron.parties
    .map((partie, startPartieIndex) => {
      const repeat = partie?.partieRepeat;
      if (!repeat?.endPartieId) return null;
      const endPartieIndex = patron.parties.findIndex((item) => String(item.id) === String(repeat.endPartieId));
      if (endPartieIndex < startPartieIndex) return null;
      const startIndex = allRangs.findIndex((rang) => rang.partieId === partie.id);
      const endIndex = (() => {
        for (let index = allRangs.length - 1; index >= 0; index -= 1) {
          if (allRangs[index].partieId === patron.parties[endPartieIndex]?.id) return index;
        }
        return -1;
      })();
      if (startIndex < 0 || endIndex < startIndex) return null;
      return {
        key: repeat.id || `partie-repeat-${partie.id}`,
        label: repeat.label || "",
        startIndex,
        endIndex,
        startPartieIndex,
        endPartieIndex,
        passages: Math.max(2, Number(repeat.passages) || 2),
        infinite: repeat.infinite === true,
      };
    })
    .filter(Boolean);
  const getPartieRepeatPassage = (repeat) => Math.max(1, Number(partieRepeatStateRef.current?.[repeat.key]?.passage) || 1);
  const getActivePartieRepeat = (partieIndex) => partieRepeatDefinitions.find((repeat) => partieIndex >= repeat.startPartieIndex && partieIndex <= repeat.endPartieIndex) || null;
  const getVirtualTotal = () => totalRangsForCount;
  const getVirtualCountAtIndex = (index) => {
    const safeIndex = Math.max(0, index);
    return Math.max(1, allRangs.slice(0, safeIndex + 1).filter(r => !r.isNote).length);
  };

  useEffect(() => {
    currentRangIdRef.current = currentRangId;
    currentIndexRef.current = currentIndex;
  }, [currentRangId, currentIndex]);

  const currentRang = allRangs[currentIndex];
  const totalRangs = totalRangsForCount;
  const currentCountIndex = currentRang?.isNote
    ? allRangs.slice(0, currentIndex).filter(r => !r.isNote).length - 1
    : getVirtualCountAtIndex(currentIndex) - 1;
  const currentPartie = currentRang ? patron.parties.find(p => p.id === currentRang.partieId) : null;
  const currentPartieIndex = currentPartie ? patron.parties.findIndex(p => p.id === currentPartie.id) : -1;
  const partieRangsOnly = currentPartie ? currentPartie.rangs.filter(r => !r.isNote) : [];
  const currentPartieRangIndex = currentPartie ? (() => {
    if (!currentRang?.isNote) return partieRangsOnly.findIndex(r => r.id === currentRang?.id);
    const idxInAll = currentPartie.rangs.findIndex(r => r.id === currentRang?.id);
    const lastNormalBefore = currentPartie.rangs.slice(0, idxInAll).filter(r => !r.isNote);
    if (lastNormalBefore.length === 0) return -1;
    return partieRangsOnly.findIndex(r => r.id === lastNormalBefore[lastNormalBefore.length - 1].id);
  })() : 0;
  const getCountableRangsInPartie = (partie) => (partie?.rangs || []).filter(r => !r.isNote).length;
  const currentPartieSegment = currentPartie ? (() => {
    let start = Math.max(0, currentPartieIndex);
    while (start > 0 && patron.parties[start]?.continuesFromPrevious === true) {
      start -= 1;
    }

    let end = Math.max(0, currentPartieIndex);
    while (end + 1 < patron.parties.length && patron.parties[end + 1]?.continuesFromPrevious === true) {
      end += 1;
    }

    let offset = 0;
    for (let i = start; i < currentPartieIndex; i += 1) {
      offset += getCountableRangsInPartie(patron.parties[i]);
    }

    let total = 0;
    for (let i = start; i <= end; i += 1) {
      total += getCountableRangsInPartie(patron.parties[i]);
    }

    return {
      rangIndex: Math.max(0, offset + currentPartieRangIndex),
      total: Math.max(1, total),
    };
  })() : { rangIndex: currentPartieRangIndex, total: partieRangsOnly.length || 1 };
  const currentPartieTotal = currentPartieSegment.total;
  const currentPartieDisplayRangIndex = currentPartieSegment.rangIndex;
  const currentPartieColor = currentPartie
    ? KALEIDOSCOPE_COLORS[currentPartie.colorIdx % KALEIDOSCOPE_COLORS.length]
    : KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const activePartieRepeat = getActivePartieRepeat(currentPartieIndex);

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
    const safeIndex = Math.max(0, index);
    const targetRang = allRangs[safeIndex];
    if (targetRang?.partieId) {
      partieCurrentRangGlobalIdsRef.current = {
        ...partieCurrentRangGlobalIdsRef.current,
        [targetRang.partieId]: targetRang.globalId,
      };
    }
    if (typeof onSaveProgress === "function") {
      onSaveProgress(getVirtualCountAtIndex(safeIndex), getVirtualTotal(), elapsedTimeRef.current, {
        currentRangGlobalId: targetRang?.globalId || null,
        partieCurrentRangGlobalIds: partieCurrentRangGlobalIdsRef.current,
        instructionHighlights,
        partieTimes: partieTimesRef.current,
        rangRepeatState: rangRepeatStateRef.current,
        partieRepeatState: partieRepeatStateRef.current,
      });
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
          getVirtualCountAtIndex(currentIndexRef.current),
          getVirtualTotal(),
          elapsedTimeRef.current,
          {
            currentRangGlobalId: allRangs[Math.max(0, currentIndexRef.current)]?.globalId || null,
            partieCurrentRangGlobalIds: partieCurrentRangGlobalIdsRef.current,
            instructionHighlights: next,
            partieTimes: partieTimesRef.current,
            rangRepeatState: rangRepeatStateRef.current,
            partieRepeatState: partieRepeatStateRef.current,
          }
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

  const tryLoopPartieRepeatAtIndex = (liveIndex) => {
    const liveCurrent = allRangs[liveIndex];
    if (!liveCurrent) return false;
    const livePartieIndex = patron.parties.findIndex((partie) => partie.id === liveCurrent.partieId);
    const livePartieRepeat = getActivePartieRepeat(livePartieIndex);
    if (!livePartieRepeat || livePartieRepeat.endPartieIndex !== livePartieIndex || livePartieRepeat.endIndex !== liveIndex) return false;
    const passage = getPartieRepeatPassage(livePartieRepeat);
    const shouldLoop = livePartieRepeat.infinite || passage < livePartieRepeat.passages;
    if (!shouldLoop) return false;
    const nextState = {
      ...partieRepeatStateRef.current,
      [livePartieRepeat.key]: { passage: passage + 1 },
    };
    partieRepeatStateRef.current = nextState;
    setPartieRepeatState(nextState);
    const target = allRangs[livePartieRepeat.startIndex];
    currentRangIdRef.current = target.globalId;
    currentIndexRef.current = livePartieRepeat.startIndex;
    setCurrentRangId(target.globalId);
    saveProgressAtIndex(livePartieRepeat.startIndex);
    if (navigator.vibrate) navigator.vibrate(15);
    return true;
  };

  const nextRang = () => {
    addPartieTime();
    const liveIndex = currentIndexRef.current;
    if (liveIndex >= allRangs.length - 1) {
      if (tryLoopPartieRepeatAtIndex(liveIndex)) return;
      setShowFinModal(true);
      return;
    }
    const activeRepeat = getActiveRepeat(liveIndex);
    if (activeRepeat && liveIndex === activeRepeat.endIndex) {
      const passage = getRepeatPassage(activeRepeat);
      const shouldLoop = activeRepeat.infinite || passage < activeRepeat.passages;
      if (shouldLoop) {
        const nextState = {
          ...rangRepeatStateRef.current,
          [activeRepeat.key]: { passage: passage + 1 },
        };
        rangRepeatStateRef.current = nextState;
        setRangRepeatState(nextState);
        const target = allRangs[activeRepeat.startIndex];
        currentRangIdRef.current = target.globalId;
        currentIndexRef.current = activeRepeat.startIndex;
        setCurrentRangId(target.globalId);
        saveProgressAtIndex(activeRepeat.startIndex);
        if (navigator.vibrate) navigator.vibrate(15);
        return;
      }
    }
    const liveCurrent = allRangs[liveIndex];
    const liveNext = allRangs[liveIndex + 1];
    const liveIsLastOfPartie = !!liveCurrent && !!liveNext && liveNext.partieId !== liveCurrent.partieId;

    if (liveIsLastOfPartie) {
      if (tryLoopPartieRepeatAtIndex(liveIndex)) return;
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
      onSaveProgress(getVirtualTotal(), getVirtualTotal(), elapsedTimeRef.current, {
        currentRangGlobalId: allRangs[Math.max(0, allRangs.length - 1)]?.globalId || null,
        partieCurrentRangGlobalIds: partieCurrentRangGlobalIdsRef.current,
        instructionHighlights,
        partieTimes: partieTimesRef.current,
        rangRepeatState: rangRepeatStateRef.current,
        partieRepeatState: partieRepeatStateRef.current,
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
      saveProgressAtIndex(liveIndex - 1);
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
      saveProgressAtIndex(liveIndex - 1);
    }

    setShowPrevPartieModal(false);
    setCounters(prev => prev.map(c => ({ ...c, value: 1 })));
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const finishActiveInfiniteRepeat = () => {
    const activeRepeat = getActiveRepeat(currentIndexRef.current);
    if (!activeRepeat?.infinite) return;
    setShowFinishRepeatModal(true);
  };

  const confirmFinishActiveInfiniteRepeat = () => {
    const activeRepeat = getActiveRepeat(currentIndexRef.current);
    if (!activeRepeat?.infinite) return;
    const targetIndex = activeRepeat.endIndex + 1;
    if (targetIndex >= allRangs.length) {
      setShowFinishRepeatModal(false);
      setShowFinModal(true);
      return;
    }
    const liveCurrent = allRangs[activeRepeat.endIndex];
    const liveNext = allRangs[targetIndex];
    if (liveCurrent && liveNext && liveNext.partieId !== liveCurrent.partieId) {
      currentIndexRef.current = activeRepeat.endIndex;
      currentRangIdRef.current = liveCurrent.globalId;
      setCurrentRangId(liveCurrent.globalId);
      setShowFinishRepeatModal(false);
      setShowNextPartieModal(true);
      return;
    }
    currentIndexRef.current = targetIndex;
    currentRangIdRef.current = liveNext.globalId;
    setCurrentRangId(liveNext.globalId);
    saveProgressAtIndex(targetIndex);
    setShowFinishRepeatModal(false);
  };

  const goToPartie = (partieId) => {
    addPartieTime();
    saveProgressAtIndex(currentIndexRef.current);
    const savedGlobalId = partieCurrentRangGlobalIdsRef.current?.[partieId];
    const savedRang = allRangs.find(r => r.globalId === savedGlobalId && r.partieId === partieId);
    const targetGlobalId = savedRang?.globalId || getPartieFirstInstructionGlobalId(partieId);

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
  const activeRepeat = getActiveRepeat(currentIndex);
  const activePartieRepeatPassage = activePartieRepeat ? getPartieRepeatPassage(activePartieRepeat) : 1;
  const repeatBadge = activeRepeat ? {
    label: `↻ ${getRepeatPassage(activeRepeat)}/${activeRepeat.infinite ? "∞" : activeRepeat.passages}`,
    onClick: activeRepeat.infinite ? finishActiveInfiniteRepeat : undefined,
  } : null;
  const partieRepeatBadge = activePartieRepeat ? {
    label: `${(activePartieRepeat.label || "Répétition").trim()} ${activePartieRepeatPassage}/${activePartieRepeat.infinite ? "∞" : activePartieRepeat.passages}`,
  } : null;

  return {
    addCounter,
    allRangs,
    confirmFinishActiveInfiniteRepeat,
    confirmNextPartie,
    confirmPrevPartie,
    completeProject,
    counters,
    currentCountIndex,
    currentIndex,
    currentPartie,
    currentPartieColor,
    currentPartieRangIndex: currentPartieDisplayRangIndex,
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
    repeatBadge,
    partieRepeatBadge,
    setShowNextPartieModal,
    setShowPrevPartieModal,
    setShowFinModal,
    setShowFinishRepeatModal,
    setHighlightedInstruction,
    showFinishRepeatModal,
    showNextPartieModal,
    showPrevPartieModal,
    showFinModal,
    toggleTimer,
    totalRangs,
    updateCounter,
  };
}
