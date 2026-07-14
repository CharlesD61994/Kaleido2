import { useEffect, useRef, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../constants/colors";

export default function usePdfProgress({ project, onNavigateHub, onSaveProgress }) {
  const pdfParties = project?.pdfParties || [];
  const hasParties = pdfParties.length > 0;
  const total = project?.total || 0;
  const pdfRepetitions = project?.pdfRepetitions || [];
  const initialRang = Math.max(1, Number(project?.pdfCurrentRang) || Number(project?.rang) || 1);
  const getPartieIndexForRang = (targetRang = 1) => {
    if (!hasParties || targetRang <= 1) return 0;
    let offset = 0;
    for (let i = 0; i < pdfParties.length; i++) {
      offset += Number(pdfParties[i]?.totalRangs) || 0;
      if (targetRang <= offset) return i;
    }
    return Math.max(0, pdfParties.length - 1);
  };
  const [currentPartieIdx, setCurrentPartieIdx] = useState(() => getPartieIndexForRang(initialRang));
  const [rang, setRang] = useState(initialRang);
  const rangRef = useRef(initialRang);
  const [counters, setCounters] = useState([]);
  const countersRef = useRef([]);
  const [startTime, setStartTime] = useState(Date.now() - (project?.elapsedTime || 0));
  const [elapsedTime, setElapsedTime] = useState(project?.elapsedTime || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const elapsedTimeRef = useRef(project?.elapsedTime || 0);
  const wasPausedByVisibilityRef = useRef(false);
  const lastPartieTickRef = useRef(Date.now());
  const currentPartieIdRef = useRef("global");
  const partieTimesRef = useRef(project?.partieTimes || {});
  const pdfPartieRangsRef = useRef(project?.pdfPartieRangs || {});
  const [showNextPartieModal, setShowNextPartieModal] = useState(false);
  const [showPrevPartieModal, setShowPrevPartieModal] = useState(false);
  const [showFinModal, setShowFinModal] = useState(false);
  const [pdfRepeatState, setPdfRepeatState] = useState(project?.pdfRepeatState || {});
  const pdfRepeatStateRef = useRef(project?.pdfRepeatState || {});

  const getRepeatDefinitions = () => pdfRepetitions
    .map((repeat, index) => {
      const startRang = Math.max(1, Number(repeat.startRang) || 1);
      const endRang = Math.max(startRang, Number(repeat.endRang) || startRang);
      const length = Math.max(1, endRang - startRang + 1);
      return {
        key: repeat.id || `pdf-repeat-${index}`,
        startRang,
        endRang,
        length,
        passages: Math.max(2, Number(repeat.passages) || 2),
        infinite: repeat.infinite === true,
      };
    })
    .filter((repeat) => repeat.startRang <= total && repeat.endRang <= total);
  const repeatDefinitions = getRepeatDefinitions();
  const getRepeatPassage = (repeat) => Math.max(1, Number(pdfRepeatStateRef.current?.[repeat.key]?.passage) || 1);
  const getActiveRepeat = (targetRang) => repeatDefinitions.find((repeat) => targetRang >= repeat.startRang && targetRang <= repeat.endRang) || null;
  const getVirtualTotal = () => total + repeatDefinitions.reduce((sum, repeat) => (
    repeat.infinite ? sum : sum + repeat.length * (repeat.passages - 1)
  ), 0);
  const getVirtualRang = (targetRang) => {
    let count = Math.max(1, Number(targetRang) || 1);
    repeatDefinitions.forEach((repeat) => {
      if (repeat.infinite) return;
      if (targetRang > repeat.endRang) {
        count += repeat.length * (repeat.passages - 1);
      } else if (targetRang >= repeat.startRang && targetRang <= repeat.endRang) {
        count += repeat.length * (getRepeatPassage(repeat) - 1);
      }
    });
    return Math.max(1, count);
  };

  useEffect(() => {
    rangRef.current = rang;
  }, [rang]);

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
            onSaveProgress(rangRef.current, total, nextElapsed, {
              partieTimes: partieTimesRef.current,
              pdfPartieRangs: pdfPartieRangsRef.current,
            });
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

  const currentPartie = hasParties ? pdfParties[currentPartieIdx] : null;
  const actualTotalPartieCourante = currentPartie?.totalRangs || 0;
  const actualRangDansPartie = hasParties ? (() => {
    let offset = 0;
    for (let i = 0; i < currentPartieIdx; i++) offset += pdfParties[i].totalRangs;
    const local = Math.max(0, rang - offset);
    return actualTotalPartieCourante > 0 ? Math.min(local, actualTotalPartieCourante) : local;
  })() : rang;
  const currentPartieSegment = hasParties ? (() => {
    let start = currentPartieIdx;
    while (start > 0 && pdfParties[start]?.continuesFromPrevious === true) {
      start -= 1;
    }

    let end = currentPartieIdx;
    while (end + 1 < pdfParties.length && pdfParties[end + 1]?.continuesFromPrevious === true) {
      end += 1;
    }

    let offset = 0;
    for (let i = start; i < currentPartieIdx; i += 1) {
      offset += Number(pdfParties[i]?.totalRangs) || 0;
    }

    let total = 0;
    for (let i = start; i <= end; i += 1) {
      total += Number(pdfParties[i]?.totalRangs) || 0;
    }

    return {
      rang: Math.max(0, offset + actualRangDansPartie),
      total: Math.max(1, total),
    };
  })() : { rang: rang, total: total || 1 };
  const totalPartieCourante = currentPartieSegment.total;
  const rangDansPartie = currentPartieSegment.rang;
  const color = currentPartie
    ? KALEIDOSCOPE_COLORS[currentPartie.colorIdx % KALEIDOSCOPE_COLORS.length]
    : KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const virtualTotal = getVirtualTotal();
  const virtualRang = getVirtualRang(rang);
  const pct = virtualTotal > 0 ? Math.min(100, Math.round((virtualRang / virtualTotal) * 100)) : 0;

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

  const saveProgress = (nextRang = rangRef.current, nextTotal = total, extra = {}) => {
    if (hasParties) {
      const partieIndex = getPartieIndexForRang(nextRang);
      const partieId = pdfParties[partieIndex]?.id || `partie-${partieIndex}`;
      pdfPartieRangsRef.current = {
        ...pdfPartieRangsRef.current,
        [partieId]: nextRang,
      };
    }
    if (typeof onSaveProgress === "function") {
      onSaveProgress(getVirtualRang(nextRang), getVirtualTotal(), elapsedTimeRef.current, {
        partieTimes: partieTimesRef.current,
        pdfPartieRangs: pdfPartieRangsRef.current,
        pdfCurrentRang: nextRang,
        pdfRepeatState: pdfRepeatStateRef.current,
        ...extra,
      });
    }
  };

  const addCounter = () => {
    const newCounter = {
      id: Date.now(),
      name: `Compteur ${countersRef.current.length + 1}`,
      value: 1,
      maxRepeats: 4,
      syncWithGlobal: false,
      colorIdx: Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length),
    };

    countersRef.current = [...countersRef.current, newCounter];
    setCounters([...countersRef.current]);
  };

  const updateCounter = (id, updates) => {
    countersRef.current = countersRef.current.map(c => c.id === id ? { ...c, ...updates } : c);
    setCounters([...countersRef.current]);
  };

  const deleteCounter = (id) => {
    countersRef.current = countersRef.current.filter(c => c.id !== id);
    setCounters([...countersRef.current]);
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

  const incrementRang = () => {
    addPartieTime();
    const liveRang = rangRef.current;
    if (total > 0 && liveRang >= total) return;
    const activeRepeat = getActiveRepeat(liveRang);
    if (activeRepeat && liveRang === activeRepeat.endRang) {
      const passage = getRepeatPassage(activeRepeat);
      const shouldLoop = activeRepeat.infinite || passage < activeRepeat.passages;
      if (shouldLoop) {
        const nextState = {
          ...pdfRepeatStateRef.current,
          [activeRepeat.key]: { passage: passage + 1 },
        };
        pdfRepeatStateRef.current = nextState;
        setPdfRepeatState(nextState);
        rangRef.current = activeRepeat.startRang;
        if (hasParties) setCurrentPartieIdx(getPartieIndexForRang(activeRepeat.startRang));
        setRang(activeRepeat.startRang);
        saveProgress(activeRepeat.startRang, total);
        return;
      }
    }

    if (hasParties && currentPartie) {
      let offset = 0;
      for (let i = 0; i < currentPartieIdx; i++) offset += pdfParties[i].totalRangs;
      const rangLocal = liveRang - offset;
      if (rangLocal >= currentPartie.totalRangs) {
        if (currentPartieIdx < pdfParties.length - 1) {
          setShowNextPartieModal(true);
        } else if (total > 0 && liveRang >= total) {
          setShowFinModal(true);
        }
        return;
      }
    }

    const newRang = liveRang + 1;
    rangRef.current = newRang;
    setRang(newRang);

    saveProgress(newRang, total);

    if (hasParties && currentPartie) {
      let offset = 0;
      for (let i = 0; i < currentPartieIdx; i++) offset += pdfParties[i].totalRangs;
      const rangLocal = newRang - offset;

      if (rangLocal >= currentPartie.totalRangs) {
        if (currentPartieIdx < pdfParties.length - 1) {
          setShowNextPartieModal(true);
        } else if (total > 0 && newRang >= total) {
          setShowFinModal(true);
        }
      }
    } else if (total > 0 && newRang >= total) {
      setShowFinModal(true);
    }
  };

  const decrementRang = () => {
    addPartieTime();
    const liveRang = rangRef.current;
    if (liveRang <= 1) return;

    const newRang = liveRang - 1;

    if (hasParties && currentPartieIdx > 0) {
      let offset = 0;
      for (let i = 0; i < currentPartieIdx; i++) offset += pdfParties[i].totalRangs;
      if (newRang <= offset) {
        setShowPrevPartieModal(true);
        return;
      }
    }

    if (hasParties) setCurrentPartieIdx(getPartieIndexForRang(newRang));
    setRang(newRang);
    saveProgress(newRang, total);
  };

  const handleBack = () => {
    addPartieTime();
    saveProgress(rangRef.current, project?.total || 0);
    onNavigateHub();
  };

  const completeProject = () => {
    addPartieTime();
    saveProgress(total || rangRef.current, total || rangRef.current, {
      status: "termine",
      completedAt: new Date().toISOString(),
    });
    setShowFinModal(false);
    onNavigateHub();
  };

  const setCurrentPartieIdxWithTime = (next) => {
    addPartieTime();
    setCurrentPartieIdx((current) => {
      const value = typeof next === "function" ? next(current) : next;
      return Math.max(0, Math.min(value, Math.max(0, pdfParties.length - 1)));
    });
  };

  const setRangWithProgress = (next) => {
    const rawNextRang = typeof next === "function" ? next(rangRef.current) : next;
    const nextRang = Math.max(1, Number(rawNextRang) || 1);
    rangRef.current = nextRang;
    if (hasParties) setCurrentPartieIdx(getPartieIndexForRang(nextRang));
    setRang(nextRang);
    saveProgress(nextRang, total);
  };

  const goToPartieIndex = (partieIndex) => {
    addPartieTime();
    saveProgress(rangRef.current, total);
    const safeIndex = Math.max(0, Math.min(Number(partieIndex) || 0, Math.max(0, pdfParties.length - 1)));
    let offset = 0;
    for (let i = 0; i < safeIndex; i += 1) {
      offset += Number(pdfParties[i]?.totalRangs) || 0;
    }
    const partieTotal = Math.max(1, Number(pdfParties[safeIndex]?.totalRangs) || 1);
    const partieId = pdfParties[safeIndex]?.id || `partie-${safeIndex}`;
    const savedRang = Number(pdfPartieRangsRef.current?.[partieId]) || 0;
    const minRang = offset + 1;
    const maxRang = offset + partieTotal;
    const nextRang = savedRang >= minRang && savedRang <= maxRang ? savedRang : minRang;

    setCurrentPartieIdx(safeIndex);
    rangRef.current = nextRang;
    setRang(nextRang);
    saveProgress(nextRang, total);
  };

  const finishActiveInfiniteRepeat = () => {
    const activeRepeat = getActiveRepeat(rangRef.current);
    if (!activeRepeat?.infinite) return;
    const ok = typeof window === "undefined"
      ? true
      : window.confirm("Terminer cette répétition et passer au rang suivant?");
    if (!ok) return;
    const nextRang = activeRepeat.endRang + 1;
    if (total > 0 && nextRang > total) {
      setShowFinModal(true);
      return;
    }
    rangRef.current = nextRang;
    if (hasParties) setCurrentPartieIdx(getPartieIndexForRang(nextRang));
    setRang(nextRang);
    saveProgress(nextRang, total);
  };

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  const activeRepeat = getActiveRepeat(rang);
  const repeatBadge = activeRepeat ? {
    label: `↻ ${getRepeatPassage(activeRepeat)}/${activeRepeat.infinite ? "∞" : activeRepeat.passages}`,
    onClick: activeRepeat.infinite ? finishActiveInfiniteRepeat : undefined,
  } : null;

  return {
    addCounter,
    color,
    completeProject,
    counters,
    currentPartie,
    currentPartieIdx,
    decrementRang,
    deleteCounter,
    elapsedTime,
    formatTime,
    handleBack,
    incrementRang,
    isTimerRunning,
    pct,
    pdfParties,
    rang,
    rangDansPartie,
    resetTimer,
    repeatBadge,
    repeatStateKey: JSON.stringify(pdfRepeatState),
    goToPartieIndex,
    setCurrentPartieIdx: setCurrentPartieIdxWithTime,
    setRang: setRangWithProgress,
    setShowFinModal,
    setShowNextPartieModal,
    setShowPrevPartieModal,
    showFinModal,
    showNextPartieModal,
    showPrevPartieModal,
    toggleTimer,
    total: virtualTotal,
    totalPartieCourante,
    updateCounter,
  };
}
