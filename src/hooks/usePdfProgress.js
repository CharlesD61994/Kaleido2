import { useEffect, useRef, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../constants/colors";

export default function usePdfProgress({ project, onNavigateHub, onSaveProgress }) {
  const pdfParties = project?.pdfParties || [];
  const hasParties = pdfParties.length > 0;
  const total = project?.total || 0;
  const getPartieIndexForRang = (targetRang = 0) => {
    if (!hasParties || targetRang <= 0) return 0;
    let offset = 0;
    for (let i = 0; i < pdfParties.length; i++) {
      offset += Number(pdfParties[i]?.totalRangs) || 0;
      if (targetRang <= offset) return i;
    }
    return Math.max(0, pdfParties.length - 1);
  };
  const [currentPartieIdx, setCurrentPartieIdx] = useState(() => getPartieIndexForRang(project?.rang || 0));
  const [rang, setRang] = useState(project?.rang || 0);
  const rangRef = useRef(project?.rang || 0);
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
  const [showNextPartieModal, setShowNextPartieModal] = useState(false);
  const [showPrevPartieModal, setShowPrevPartieModal] = useState(false);
  const [showFinModal, setShowFinModal] = useState(false);

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
            onSaveProgress(rangRef.current, total, nextElapsed, { partieTimes: partieTimesRef.current });
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
  const totalPartieCourante = currentPartie?.totalRangs || 0;
  const rangDansPartie = hasParties ? (() => {
    let offset = 0;
    for (let i = 0; i < currentPartieIdx; i++) offset += pdfParties[i].totalRangs;
    const local = Math.max(0, rang - offset);
    return totalPartieCourante > 0 ? Math.min(local, totalPartieCourante) : local;
  })() : rang;
  const color = currentPartie
    ? KALEIDOSCOPE_COLORS[currentPartie.colorIdx % KALEIDOSCOPE_COLORS.length]
    : KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const pct = total > 0 ? Math.min(100, Math.round((rang / total) * 100)) : 0;

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
    if (typeof onSaveProgress === "function") {
      onSaveProgress(nextRang, nextTotal, elapsedTimeRef.current, { partieTimes: partieTimesRef.current, ...extra });
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
    if (liveRang <= 0) return;

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
    const nextRang = typeof next === "function" ? next(rangRef.current) : next;
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
    setCurrentPartieIdx: setCurrentPartieIdxWithTime,
    setRang: setRangWithProgress,
    setShowFinModal,
    setShowNextPartieModal,
    setShowPrevPartieModal,
    showFinModal,
    showNextPartieModal,
    showPrevPartieModal,
    toggleTimer,
    total,
    totalPartieCourante,
    updateCounter,
  };
}
