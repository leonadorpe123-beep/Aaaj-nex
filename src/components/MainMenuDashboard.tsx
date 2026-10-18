/**
 * MainMenuDashboard.tsx
 * Ultra-Modern 2026 Esports Racing Operations Dashboard for Apex GT.
 * Inspired by Gran Turismo 7 & Formula 1 luxury motorsport editorial design.
 * 
 * Features:
 * - Screen 2 (Root View): 2x3 Panoramic Cards with zero scroll (Career, Garage, Free, School, Multiplayer, Grand Prix)
 * - Screen 3 (Paddock & Preparation Command Center):
 *   - Custom user-uploaded background image (/images/screen3_bg.png) with dark vignette
 *   - Zero-scroll layout (h-screen max-h-screen overflow-hidden flex flex-col justify-between)
 *   - 6 Custom Image Selector Buttons styled like GT7 cards (Circuits, Tires, Laps, AI Difficulty, Livery/Team, Assists/Setup)
 *   - High-fidelity superimposed modal overlays for selecting each configuration element seamlessly
 *   - Master Launch CTA button with audio feedback
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Timer,
  Users,
  Flag,
  Play,
  ArrowLeft,
  Check,
  Copy,
  Zap,
  Compass,
  HelpCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Palette,
  Shield,
  Maximize2,
  Minimize2,
  Eye,
  Activity,
  Flame,
  Wind,
  Thermometer,
  Gauge,
  CircleDot,
  Radio,
  Layers,
  ChevronDown,
  GraduationCap,
  Globe,
  Car,
  Coins,
  X,
  Settings,
  Disc,
  Clock,
  Swords,
  User,
} from 'lucide-react';
import { CameraDistanceMode, CameraViewMode } from '../game/RacingGameEngine';
import { MultiplayerRoomState } from '../game/multiplayer/MultiplayerClient';
import { RaceDifficulty, RaceLapOption, CustomLiverySettings, CareerSeasonState, saveLivery } from '../game/career/CareerTypes';
import { TireCompoundType } from '../game/physics/TireCompound';
import { playUiClick, playUiHover, playModeSelectChime } from '../utils/uiAudio';
import { CircuitId } from '../game/circuits/ICircuit';
import { AVAILABLE_CIRCUITS } from '../game/circuits/CircuitRegistry';

export interface MainMenuDashboardProps {
  onStartSolo: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  onStartCareerMode?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  onOpenLiveryStudio?: () => void;
  customLivery?: CustomLiverySettings;
  careerSeason?: CareerSeasonState;
  onResetCareerSeason?: () => void;
  onStartFreePractice?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  selectedCircuit?: CircuitId;
  onSelectCircuit?: (circuitId: CircuitId) => void;
  onCreateRoom: (options: {
    playerName: string;
    laps: number;
    car1Name: string;
    car2Name: string;
    crewName: string;
    cameraDistance: CameraDistanceMode;
    cameraMode: CameraViewMode;
  }) => Promise<void>;
  onJoinRoom: (code: string, playerName: string, cameraDistance: CameraDistanceMode, cameraMode: CameraViewMode) => Promise<void>;
  onStartMultiplayerRace: () => void;
  onSetReady: (isReady: boolean) => void;
  onLeaveRoom: () => void;
  onBackToTitle: () => void;
  roomState: MultiplayerRoomState | null;
  playerId: 'p1' | 'p2' | null;
  isConnecting: boolean;
  errorMessage: string | null;
  onStartFreeCamera?: (circuitId?: CircuitId) => void;
  // Deprecated stubs
  onOpenModelUpload?: (target: 'car1' | 'car2' | 'crew') => void;
  car1Name?: string;
  car2Name?: string;
  crewName?: string;
}

export type MenuDedicatedScreen = 'root' | 'career' | 'free' | 'multiplayer' | 'grand_prix';
export type Screen3Overlay = 'none' | 'tires' | 'circuit' | 'laps' | 'difficulty' | 'setup' | 'livery' | 'multiplayer_modal';

export const MainMenuDashboard: React.FC<MainMenuDashboardProps> = ({
  onStartSolo,
  onStartCareerMode,
  onOpenLiveryStudio,
  customLivery,
  careerSeason,
  onStartFreePractice,
  selectedCircuit: initialCircuit,
  onSelectCircuit,
  onCreateRoom,
  onJoinRoom,
  onStartMultiplayerRace,
  onSetReady,
  onLeaveRoom,
  onBackToTitle,
  roomState,
  playerId,
  isConnecting,
  errorMessage,
  onStartFreeCamera,
}) => {
  // Navigation State: 'root' (Screen 2 Mode Selection) or dedicated mode screen (Screen 3)
  const [activeScreen, setActiveScreen] = useState<MenuDedicatedScreen>('root');

  // Selected Circuit
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitId>(initialCircuit || 'square_apex');

  // Racing Parameters
  const [laps, setLaps] = useState<RaceLapOption>(9);
  const [difficulty, setDifficulty] = useState<RaceDifficulty>('medium');
  const [startingCompound, setStartingCompound] = useState<TireCompoundType>('soft');

  // Camera Settings
  const [cameraDistance, setCameraDistance] = useState<CameraDistanceMode>('medium');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Driving Assists
  const [tractionControl, setTractionControl] = useState<boolean>(true);
  const [absEnabled, setAbsEnabled] = useState<boolean>(true);
  const [racingLine, setRacingLine] = useState<boolean>(true);

  // Multiplayer Form State
  const [mpTab, setMpTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>(customLivery?.driverName || 'PILOTO APEX');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [mpLaps, setMpLaps] = useState<number>(3);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Controls Guide Modal
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);

  // GT7 Style Active Card Index on Screen 2
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);

  // Screen 3: Superimposed Modal Overlays
  const [activeOverlay, setActiveOverlay] = useState<Screen3Overlay>('none');
  const [teamName, setTeamName] = useState<string>(customLivery?.teamName || 'Oracle Red Bull Racing');
  const [carNumber, setCarNumber] = useState<string>(customLivery?.driverNumber || '1');
  const [driverDisplayName, setDriverDisplayName] = useState<string>(customLivery?.driverName || 'M. Verstappen');
  const [driverCode, setDriverCode] = useState<string>(customLivery?.driverCode || 'VER');
  const [primaryColor, setPrimaryColor] = useState<string>(customLivery?.primaryColor || '#040814');
  const [secondaryColor, setSecondaryColor] = useState<string>(customLivery?.secondaryColor || '#cc0022');
  const [accentColor, setAccentColor] = useState<string>(customLivery?.accentColor || '#fec008');

  // Live Digital Clock & Date
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => {
    const d = new Date();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      setCurrentDateStr(`${d.getDate()} ${months[d.getMonth()]}`);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape' && activeOverlay !== 'none') {
        setActiveOverlay('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeOverlay]);

  const toggleFullscreen = () => {
    playUiClick(750);
    try {
      if (!document.fullscreenElement) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          root.requestFullscreen().catch(() => {});
        } else if ((root as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
          (root as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
          (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
        }
      }
    } catch {}
  };

  const handleSelectCircuitLocal = (id: CircuitId) => {
    playUiClick(650);
    setSelectedCircuit(id);
    onSelectCircuit?.(id);
  };

  const handleNavigateToScreen = (screen: MenuDedicatedScreen) => {
    playModeSelectChime();
    setActiveScreen(screen);
  };

  const handleBackToGrid = () => {
    playUiClick(700);
    setActiveScreen('root');
    setActiveOverlay('none');
  };

  // Launch handlers for each dedicated screen
  const handleLaunchCareer = () => {
    playUiClick(950);
    if (onStartCareerMode) {
      onStartCareerMode(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
    } else {
      onStartSolo(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
    }
  };

  const handleLaunchFreePractice = () => {
    playUiClick(950);
    if (onStartFreePractice) {
      onStartFreePractice(cameraDistance, cameraMode, startingCompound, selectedCircuit);
    } else {
      onStartSolo(cameraDistance, cameraMode, 9, 'easy', startingCompound, selectedCircuit);
    }
  };

  const handleLaunchGrandPrix = () => {
    playUiClick(950);
    onStartSolo(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
  };

  const handleLaunchFreeCamera = () => {
    playUiClick(750);
    if (onStartFreeCamera) {
      onStartFreeCamera(selectedCircuit);
    } else if (onStartFreePractice) {
      onStartFreePractice(cameraDistance, cameraMode, startingCompound, selectedCircuit);
    }
  };

  const handleCreateRoomAction = async () => {
    playUiClick(850);
    await onCreateRoom({
      playerName: playerName.trim() || 'Piloto Anfitrión',
      laps: mpLaps,
      car1Name: 'F1 Turbo GP (Host)',
      car2Name: 'F1 Turbo GP (Rival)',
      crewName: 'Pit Crew Scuderia',
      cameraDistance,
      cameraMode,
    });
  };

  const handleJoinRoomAction = async () => {
    if (!joinCodeInput.trim()) return;
    playUiClick(850);
    await onJoinRoom(
      joinCodeInput.trim().toUpperCase(),
      playerName.trim() || 'Piloto Invitado',
      cameraDistance,
      cameraMode
    );
  };

  const handleToggleReady = () => {
    playUiClick(800);
    const next = !isReady;
    setIsReady(next);
    onSetReady(next);
  };

  const copyRoomCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setIsCopied(true);
    playUiClick(900);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentCircuit = AVAILABLE_CIRCUITS.find((c) => c.id === selectedCircuit) || AVAILABLE_CIRCUITS[0];

  // Career stats calculation
  const playerStanding = careerSeason?.standings?.find((s) => s.isPlayer);
  const playerPoints = playerStanding?.points ?? 0;

  // Estimated race duration calculation
  const calculateEstimatedTime = (totalLaps: number) => {
    const lapTime = currentCircuit.expectedLapTimeSec || 35;
    const totalSecs = lapTime * totalLaps;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.round(totalSecs % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Gran Turismo 7 Cards Configuration for Screen 2 (Root View: 4 Core Modes)
  const gt7Cards = [
    {
      id: 'career',
      title: 'MODO CARRERA',
      desc: 'Compite, gana y avanza en tu carrera como piloto profesional.',
      bg: '/images/cards/card_career.jpg',
      icon: Trophy,
      action: () => handleNavigateToScreen('career'),
    },
    {
      id: 'free',
      title: 'CONDUCCIÓN LIBRE',
      desc: 'Explora libremente los circuitos y disfruta de la conducción.',
      bg: '/images/cards/card_free.jpg',
      icon: Timer,
      action: () => handleNavigateToScreen('free'),
    },
    {
      id: 'multiplayer',
      title: 'MULTIJUGADOR',
      desc: 'Compite en línea con jugadores de todo el mundo en 1v1.',
      bg: '/images/cards/card_multiplayer.jpg',
      icon: Globe,
      action: () => handleNavigateToScreen('multiplayer'),
    },
    {
      id: 'grand_prix',
      title: 'GRAN PREMIO',
      desc: 'Parrilla oficial FIA de 5 monoplazas con semáforo y paradas en boxes.',
      bg: '/images/cards/card_grandprix.jpg',
      icon: Flag,
      action: () => handleNavigateToScreen('grand_prix'),
    },
  ];

  // Screen 3 Selectors Configuration (Cards with custom background images)
  const screen3Selectors = [
    {
      id: 'circuit',
      category: 'CIRCUITO FIA',
      title: currentCircuit.name,
      subtitle: `${(currentCircuit.totalLength / 1000).toFixed(2)} KM · ${currentCircuit.cornersCount} Curvas`,
      tag: currentCircuit.flagEmoji || '🏁',
      bg: '/images/cards/btn_circuit.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('circuit');
      },
    },
    {
      id: 'tires',
      category: 'NEUMÁTICOS',
      title:
        startingCompound === 'soft'
          ? 'BLANDO C4 (ROJO)'
          : startingCompound === 'medium'
          ? 'MEDIO C3 (AMARILLO)'
          : 'DURO C2 (BLANCO)',
      subtitle:
        startingCompound === 'soft'
          ? 'Agarre 100% · 8-10 Vueltas'
          : startingCompound === 'medium'
          ? 'Agarre 92% · 18-22 Vueltas'
          : 'Agarre 84% · 35+ Vueltas',
      tag:
        startingCompound === 'soft' ? '🔴 PIRELLI' : startingCompound === 'medium' ? '🟡 PIRELLI' : '⚪ PIRELLI',
      bg: '/images/cards/btn_tire.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('tires');
      },
    },
    {
      id: 'laps',
      category: 'DURACIÓN & VUELTAS',
      title: `${laps} VUELTAS`,
      subtitle: `${calculateEstimatedTime(laps)} · ${
        laps === 9 ? 'Sprint Relámpago' : laps === 20 ? 'Gran Premio Estándar' : 'Resistencia Completa'
      }`,
      tag: '🏁 DISTANCIA',
      bg: '/images/cards/btn_laps.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('laps');
      },
    },
    {
      id: 'difficulty',
      category: activeScreen === 'multiplayer' ? 'SALA MULTIJUGADOR' : 'DIFICULTAD RIVALES',
      title:
        activeScreen === 'multiplayer'
          ? roomState
            ? `SALA: ${roomState.code}`
            : 'DUELO 1V1 EN LÍNEA'
          : difficulty === 'easy'
          ? 'NOVATO'
          : difficulty === 'medium'
          ? 'INTERMEDIO'
          : 'LEYENDA FIA',
      subtitle:
        activeScreen === 'multiplayer'
          ? roomState
            ? `Jugadores: ${roomState.players.p1 ? 1 : 0} + ${roomState.players.p2 ? 1 : 0}/2`
            : 'Crear sala privada o unirse con código'
          : difficulty === 'easy'
          ? 'Ritmo accesible y permisivo'
          : difficulty === 'medium'
          ? 'Competitivo y equilibrado'
          : 'Máxima agresividad de parrilla',
      tag: activeScreen === 'multiplayer' ? '🌐 WEBSOCKET' : '⚡ IA DINÁMICA',
      bg: '/images/cards/card_grandprix.jpg',
      action: () => {
        playUiClick(750);
        if (activeScreen === 'multiplayer') {
          setActiveOverlay('multiplayer_modal');
        } else {
          setActiveOverlay('difficulty');
        }
      },
    },
    {
      id: 'livery',
      category: 'ESCUDERÍA & PILOTO',
      title: teamName,
      subtitle: `#${carNumber} · ${driverDisplayName} (${driverCode})`,
      tag: '🏎️ MONOPLAZA',
      bg: '/images/cards/btn_livery.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('livery');
      },
    },
    {
      id: 'setup',
      category: 'REGLAJES & ASISTENCIAS',
      title: `TC: ${tractionControl ? 'ON' : 'OFF'} · ABS: ${absEnabled ? 'ON' : 'OFF'}`,
      subtitle: `Trazada: ${racingLine ? 'ON' : 'OFF'} · Cámara: ${
        cameraMode === 'chase' ? 'Exterior' : cameraMode === 'bumper' ? 'Morro/Asfalto' : cameraMode === 'hood' ? 'Capó' : 'Órbita'
      }`,
      tag: '🛠️ TELEMETRÍA',
      bg: '/images/cards/btn_helmet.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('setup');
      },
    },
  ];

  // Arrow key navigation for 2x2 cards in root menu
  useEffect(() => {
    if (activeScreen !== 'root' || showControlsModal || activeOverlay !== 'none') return;
    const handleMenuNav = (e: KeyboardEvent) => {
      const total = gt7Cards.length;
      if (total === 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev + 1) % total);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev - 1 + total) % total);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev + 2) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev - 2 + total) % total);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const c = gt7Cards[selectedCardIndex];
        if (c) c.action();
      }
    };
    window.addEventListener('keydown', handleMenuNav);
    return () => window.removeEventListener('keydown', handleMenuNav);
  }, [activeScreen, selectedCardIndex, showControlsModal, activeOverlay, gt7Cards]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between h-screen max-h-screen overflow-hidden select-none text-white font-sans bg-neutral-950">
      {/* ========================================================================= */}
      {/* BACKGROUND IMAGE: Root GT7 vs Screen 3 User Uploaded Background Image    */}
      {/* ========================================================================= */}
      <img
        src={activeScreen === 'root' ? '/images/dashboard_bg.webp' : '/images/screen3_bg.png'}
        alt="Racing Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-95 select-none z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/75 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/20 to-neutral-950/60 pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      {activeScreen === 'root' ? (
        /* GT7 Top Header Bar for Root View (Screen 2) */
        <header className="relative z-20 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl px-3 sm:px-6 py-2 flex items-center justify-between flex-shrink-0 shadow-lg">
          {/* Left: GT7 Logo & Real Driving Simulator + Stats Badges */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
            <div
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
              onClick={() => {
                playUiClick(750);
                onBackToTitle();
              }}
              title="Pantalla de título"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white italic text-base shadow-md border border-red-400/40 font-mono">
                GT
              </div>
              <div className="leading-tight hidden min-[420px]:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-widest text-white uppercase font-sans">Apex GT</span>
                  <span className="text-[10px] font-bold text-red-500 font-mono">7</span>
                </div>
                <div className="text-[8px] sm:text-[9px] text-neutral-400 tracking-[0.16em] uppercase font-mono font-medium">
                  THE REAL DRIVING SIMULATOR
                </div>
              </div>
            </div>

            {/* Badges: Credits & Car Spec */}
            <div className="hidden sm:flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-white/15 text-xs font-semibold backdrop-blur-md">
                <div className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[10px] font-black shadow-sm font-mono">
                  Cr
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] text-neutral-400 uppercase tracking-wider font-mono">Créditos</span>
                  <span className="text-[11px] font-mono font-bold text-amber-200">
                    {playerPoints > 0 ? (playerPoints * 12500).toLocaleString() : '1 234 567'}
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-white/15 text-xs font-semibold backdrop-blur-md">
                <div className="w-6 h-4 rounded bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold text-white truncate max-w-[130px] font-sans">
                    Apex F1 Turbo GP '26
                  </span>
                  <span className="text-[8px] text-neutral-400 font-mono">
                    1050 CV / 798 kg / MR / T
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-white/10 text-neutral-300 font-mono">
                  Gr. 1
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Fullscreen, Clock */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Live Digital Clock & Date */}
            <div className="hidden sm:flex flex-col items-end leading-none px-2 py-0.5 border-l border-white/15">
              <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wider">{currentTime}</span>
              <span className="text-[9px] text-neutral-400 font-mono mt-0.5">{currentDateStr}</span>
            </div>

            <button
              onClick={handleLaunchFreeCamera}
              onMouseEnter={playUiHover}
              title="Cámara Libre"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white text-xs font-medium transition-all shadow-sm cursor-pointer backdrop-blur-md flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">Cámara</span>
            </button>

            <button
              onClick={() => {
                playUiClick(800);
                setShowControlsModal(true);
              }}
              onMouseEnter={playUiHover}
              title="Guía de Controles"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white text-xs transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Controles</span>
            </button>

            <button
              onClick={toggleFullscreen}
              onMouseEnter={playUiHover}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>
      ) : (
        /* Screen 3 Top Header matching the luxury motorsport styling */
        /* Screen 3 Top Header matching the luxury motorsport styling */
        <header className="relative z-20 w-full border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl px-2.5 sm:px-6 py-1 sm:py-1.5 flex items-center justify-between flex-shrink-0 shadow-lg">
          {/* Left: Mode Title & F1 Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="px-1.5 sm:px-2 py-0.5 rounded bg-red-600 text-white font-black italic tracking-tighter text-xs sm:text-sm font-mono shadow-md border border-red-400/40">
                F1
              </div>
            </div>

            <div className="leading-tight truncate">
              <h2 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-sans flex items-center gap-1.5 truncate">
                <span className="truncate">
                  {activeScreen === 'career' && 'MODO CARRERA 2026'}
                  {activeScreen === 'free' && 'ENTRENAMIENTO & TIME ATTACK'}
                  {activeScreen === 'multiplayer' && 'PADDOCK MULTIJUGADOR 1V1'}
                  {activeScreen === 'grand_prix' && 'GRAN PREMIO OFICIAL FIA'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-mono font-bold uppercase bg-white/10 border border-white/15 text-cyan-300 hidden min-[480px]:inline">
                  CONFIGURACIÓN
                </span>
              </h2>
            </div>
          </div>

          {/* Right: Driver Badge, Credits, Fullscreen & Back Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Driver Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-neutral-900/90 border border-white/10 text-xs">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600/40 border border-red-500/60 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-black font-mono">
                {carNumber}
              </div>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[9px] sm:text-[10px] font-bold text-white truncate max-w-[85px] sm:max-w-[110px]">{driverDisplayName}</span>
                <span className="text-[7px] text-neutral-400 font-mono truncate max-w-[85px] sm:max-w-[110px] hidden min-[360px]:inline">{teamName}</span>
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              onMouseEnter={playUiHover}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Back Button to return to Screen 2 */}
            <button
              onClick={handleBackToGrid}
              onMouseEnter={playUiHover}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-100 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-md"
              title="Volver a selección de modalidades"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MODOS</span>
            </button>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT VIEWPORT: ZERO-SCROLL FOR BOTH SCREENS                    */}
      {/* ========================================================================= */}
      {activeScreen === 'root' ? (
        /* SCREEN 2: 2x2 Mode Selection Grid (70% Button Opacity & Zero Scroll) */
        <main className="relative z-10 flex-1 flex flex-col justify-between px-3 sm:px-6 md:px-8 py-2 sm:py-3.5 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          {/* Top Title Banner */}
          <div className="flex-shrink-0 mb-1 sm:mb-2 text-left">
            <h1 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wide text-white drop-shadow font-sans">
              UN MUNDO DE AUTOMOVILISMO
            </h1>
            <p className="text-[10px] sm:text-xs text-neutral-300 font-normal">
              Elige tu forma de disfrutar Apex GT.
            </p>
          </div>

          {/* 4 Cards Grid in 2x2 with 70% opacity background images */}
          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-3.5 md:gap-4 w-full items-stretch my-auto">
            {gt7Cards.map((card, idx) => {
              const Icon = card.icon;
              const isSelected = selectedCardIndex === idx;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCardIndex(idx);
                    playUiClick(800);
                    card.action();
                  }}
                  onMouseEnter={() => {
                    setSelectedCardIndex(idx);
                    playUiHover();
                  }}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-end p-2.5 sm:p-3 md:p-4 select-none ${
                    isSelected
                      ? 'border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.65),inset_0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-300 scale-[1.01]'
                      : 'border border-white/20 hover:border-cyan-400/80 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                  }`}
                >
                  {/* Background Image with 70% opacity */}
                  <img
                    src={card.bg}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-500 ease-out group-hover:scale-108"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />
                  )}

                  <div className="relative z-10 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                      <div className="p-1 sm:p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-cyan-300 group-hover:text-cyan-200">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white drop-shadow font-sans">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[11px] md:text-xs text-neutral-300 line-clamp-1 sm:line-clamp-2 mt-0.5 font-normal leading-tight">
                      {card.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      ) : (
        /* SCREEN 3: Custom Background + 6 Selector Buttons (60% Opacity) + Zero-Scroll Responsive Layout */
        <main className="relative z-10 flex-1 flex flex-col px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          
          {/* ========================================================================= */}
          {/* LAYOUT A: LANDSCAPE VIEWPORT (Horizontal Phone/Desktop: Left Minimalist Panel + 3x2 Grid) */}
          {/* ========================================================================= */}
          <div className="hidden landscape:flex flex-row gap-2 sm:gap-3 flex-1 min-h-0 items-stretch">
            {/* Left Minimalist Sidebar (GT7 / Reference Motorsport Style) */}
            <aside className="w-48 sm:w-52 md:w-56 flex-shrink-0 flex flex-col justify-between rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/15 p-2 shadow-xl min-h-0">
              {/* Header */}
              <div className="flex-shrink-0 border-b border-white/10 pb-1 mb-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-white font-mono">
                      FICHA TÉCNICA
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[7px] font-mono text-cyan-300 font-bold uppercase">
                    FIA
                  </span>
                </div>
              </div>

              {/* 6 Minimalist Telemetry Rows */}
              <div className="flex-1 min-h-0 space-y-1 overflow-hidden flex flex-col justify-around py-0.5">
                {/* 1. Circuito */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('circuit'); }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
                    <span>🏁 CIRCUITO</span>
                    <span className="text-cyan-400">EDIT</span>
                  </div>
                  <div className="text-[9px] font-bold text-white truncate">{currentCircuit.name}</div>
                  <div className="text-[7px] font-mono text-neutral-400 truncate">{(currentCircuit.totalLength / 1000).toFixed(1)} km · {currentCircuit.cornersCount} Curvas</div>
                </div>

                {/* 2. Neumático */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('tires'); }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
                    <span>🛞 NEUMÁTICO</span>
                    <span className="text-cyan-400">EDIT</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white uppercase truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        startingCompound === 'soft'
                          ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                          : startingCompound === 'medium'
                          ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]'
                          : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                      }`}
                    />
                    <span className="truncate">
                      {startingCompound === 'soft' ? 'Blando C4 (Rojo)' : startingCompound === 'medium' ? 'Medio C3 (Amarillo)' : 'Duro C2 (Blanco)'}
                    </span>
                  </div>
                </div>

                {/* 3. Vueltas */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('laps'); }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
                    <span>⏱️ DISTANCIA</span>
                    <span className="text-amber-300 font-bold">~{calculateEstimatedTime(laps)}</span>
                  </div>
                  <div className="text-[9px] font-bold text-white font-mono">{laps} VUELTAS</div>
                </div>

                {/* 4. Dificultad / Sala */}
                <div
                  onClick={() => { playUiClick(700); if (activeScreen === 'multiplayer') setActiveOverlay('multiplayer_modal'); else setActiveOverlay('difficulty'); }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
                    <span>{activeScreen === 'multiplayer' ? '🌐 SALA' : '⚡ DIFICULTAD IA'}</span>
                  </div>
                  <div className="text-[9px] font-bold text-white uppercase truncate">
                    {activeScreen === 'multiplayer' ? (roomState ? `Sala ${roomState.code}` : '1v1 Online') : difficulty === 'easy' ? 'Novato' : difficulty === 'medium' ? 'Intermedio' : 'Leyenda FIA'}
                  </div>
                </div>

                {/* 5. Monoplaza & Piloto */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('livery'); }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
                    <span>🏎️ PILOTO & ESCUDERÍA</span>
                  </div>
                  <div className="text-[9px] font-bold text-white truncate">#{carNumber} · {driverDisplayName}</div>
                </div>

                {/* 6. Asistencias */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('setup'); }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
                    <span>🛠️ ASISTENCIAS</span>
                  </div>
                  <div className="text-[7.5px] font-mono text-neutral-300">
                    TC:{tractionControl ? 'ON' : 'OFF'} · ABS:{absEnabled ? 'ON' : 'OFF'} · Línea:{racingLine ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>

              {/* Start Button at Bottom of Sidebar */}
              <div className="flex-shrink-0 pt-1 border-t border-white/10 mt-0.5">
                {activeScreen === 'career' && (
                  <button
                    onClick={handleLaunchCareer}
                    onMouseEnter={playUiHover}
                    className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-[9.5px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>INICIAR</span>
                  </button>
                )}
                {activeScreen === 'free' && (
                  <button
                    onClick={handleLaunchFreePractice}
                    onMouseEnter={playUiHover}
                    className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-neutral-950 font-black text-[9.5px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>A PISTA</span>
                  </button>
                )}
                {activeScreen === 'multiplayer' && (
                  <button
                    onClick={() => { playUiClick(850); setActiveOverlay('multiplayer_modal'); }}
                    onMouseEnter={playUiHover}
                    className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-neutral-950 font-black text-[9.5px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{roomState ? 'GESTIONAR' : 'UNIRSE'}</span>
                  </button>
                )}
                {activeScreen === 'grand_prix' && (
                  <button
                    onClick={handleLaunchGrandPrix}
                    onMouseEnter={playUiHover}
                    className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-500 hover:to-rose-400 text-white font-black text-[9.5px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>INICIAR GP</span>
                  </button>
                )}
              </div>
            </aside>

            {/* Right: 6 Selector Buttons (3 cols x 2 rows, 60% opacity) */}
            <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-1.5 items-stretch h-full">
              {screen3Selectors.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={playUiHover}
                  className="group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-between p-1.5 sm:p-2 select-none border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] hover:scale-[1.01]"
                >
                  {/* Background Image: exactly 60% opacity */}
                  <img
                    src={btn.bg}
                    alt={btn.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {/* Top Badge */}
                  <div className="relative z-10 flex items-center justify-between w-full gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[6.5px] sm:text-[7.5px] font-mono font-black uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/20 text-neutral-200 truncate">
                      {btn.category}
                    </span>
                    <span className="text-[6.5px] sm:text-[7.5px] font-mono font-bold text-red-300 bg-red-950/70 px-1 py-0.5 rounded border border-red-500/30 shrink-0">
                      {btn.tag}
                    </span>
                  </div>

                  {/* Bottom Title & Subtitle */}
                  <div className="relative z-10 flex flex-col justify-end mt-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9.5px] sm:text-[10.5px] md:text-xs font-black uppercase tracking-wide text-white drop-shadow truncate">
                        {btn.title}
                      </span>
                      <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-red-400 transition-colors shrink-0" />
                    </div>
                    <p className="text-[7px] sm:text-[8px] text-neutral-300 font-mono mt-0.5 truncate leading-tight">
                      {btn.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LAYOUT B: PORTRAIT VIEWPORT (Vertical Phone: Minimalist Top Bar + 2x3 Grid) */}
          {/* ========================================================================= */}
          <div className="flex landscape:hidden flex-col gap-1.5 flex-1 min-h-0">
            {/* Top Minimalist Summary Bar (arriba) */}
            <div className="flex-shrink-0 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/15 p-1.5 shadow-lg">
              {/* Row 1: Title + Action Button */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-white font-mono">
                    RESUMEN TÉCNICO FIA
                  </span>
                </div>
                <div className="w-32">
                  {activeScreen === 'career' && (
                    <button
                      onClick={handleLaunchCareer}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>INICIAR</span>
                    </button>
                  )}
                  {activeScreen === 'free' && (
                    <button
                      onClick={handleLaunchFreePractice}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>A PISTA</span>
                    </button>
                  )}
                  {activeScreen === 'multiplayer' && (
                    <button
                      onClick={() => { playUiClick(850); setActiveOverlay('multiplayer_modal'); }}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>{roomState ? 'GESTIONAR' : 'UNIRSE'}</span>
                    </button>
                  )}
                  {activeScreen === 'grand_prix' && (
                    <button
                      onClick={handleLaunchGrandPrix}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-500 hover:to-rose-400 text-white font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>INICIAR GP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: 6 Quick Horizontal Summary Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[8px] font-mono">
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('circuit'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🏁 </span>
                  <span className="text-white font-bold truncate">{currentCircuit.name}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('tires'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer flex items-center justify-center gap-1"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      startingCompound === 'soft' ? 'bg-red-500' : startingCompound === 'medium' ? 'bg-yellow-400' : 'bg-white'
                    }`}
                  />
                  <span className="text-white font-bold truncate">{startingCompound.toUpperCase()}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('laps'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">⏱️ </span>
                  <span className="text-amber-300 font-bold">{laps}V</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); if (activeScreen === 'multiplayer') setActiveOverlay('multiplayer_modal'); else setActiveOverlay('difficulty'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">⚡ </span>
                  <span className="text-white font-bold truncate">{difficulty.toUpperCase()}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('livery'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🏎️ </span>
                  <span className="text-white font-bold truncate">#{carNumber} {driverCode}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('setup'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🛠️ </span>
                  <span className="text-emerald-400 font-bold">TC:{tractionControl ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>

            {/* 6 Selector Buttons Grid (2 cols x 3 rows, 60% opacity) */}
            <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-1.5 items-stretch">
              {screen3Selectors.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={playUiHover}
                  className="group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-between p-2 select-none border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] hover:scale-[1.01]"
                >
                  {/* Background Image: exactly 60% opacity */}
                  <img
                    src={btn.bg}
                    alt={btn.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {/* Top Badge */}
                  <div className="relative z-10 flex items-center justify-between w-full gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/20 text-neutral-200 truncate">
                      {btn.category}
                    </span>
                    <span className="text-[7px] font-mono font-bold text-red-300 bg-red-950/70 px-1 py-0.5 rounded border border-red-500/30 shrink-0">
                      {btn.tag}
                    </span>
                  </div>

                  {/* Bottom Title & Subtitle */}
                  <div className="relative z-10 flex flex-col justify-end mt-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-white drop-shadow truncate">
                        {btn.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors shrink-0" />
                    </div>
                    <p className="text-[7.5px] sm:text-[8.5px] text-neutral-300 font-mono mt-0.5 truncate leading-tight">
                      {btn.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. FOOTER BAR (Only on Root View - Eliminated on Screen 3 per request)    */}
      {/* ========================================================================= */}
      {activeScreen === 'root' && (
        <footer className="relative z-20 w-full border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl px-3 sm:px-6 md:px-8 py-2 flex items-center justify-between text-[10px] sm:text-xs text-neutral-400 font-medium flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 text-neutral-200">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">✕</span>
              <span>Confirmar</span>
            </div>
            <button
              onClick={() => {
                playUiClick(750);
                onBackToTitle();
              }}
              className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">○</span>
              <span>Atrás</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">☰</span>
              <span>Menú principal</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-400 tracking-[0.18em] uppercase font-bold text-[9px] sm:text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>THE REAL DRIVING SIMULATOR</span>
          </div>
        </footer>
      )}

      {/* ========================================================================= */}
      {/* 4. SUPERIMPOSED OVERLAYS (PANTALLAS SUPERPUESTAS)                         */}
      {/* ========================================================================= */}

      {/* OVERLAY 1: TIRES SELECTION MODAL */}
      {activeOverlay === 'tires' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Disc className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    COMPUESTO DE NEUMÁTICOS PIRELLI
                  </h3>
                  <p className="text-[10px] text-neutral-400">Elige la estrategia de salida y agarre</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'soft' as TireCompoundType,
                  name: 'BLANDO C4 (ROJO)',
                  desc: 'Máximo agarre instantáneo y tracción en curva. Rango óptimo 8-10 vueltas.',
                  grip: '100% Agarre',
                  degrad: 'Alta degradación térmica',
                  color: 'bg-red-600',
                  border: 'border-red-500',
                },
                {
                  id: 'medium' as TireCompoundType,
                  name: 'MEDIO C3 (AMARILLO)',
                  desc: 'Compuesto equilibrado ideal para tandas medias y estrategias estándar. 18-22 vueltas.',
                  grip: '92% Agarre',
                  degrad: 'Degradación media lineal',
                  color: 'bg-yellow-500',
                  border: 'border-yellow-400',
                },
                {
                  id: 'hard' as TireCompoundType,
                  name: 'DURO C2 (BLANCO)',
                  desc: 'Baja degradación y resistencia extrema para stint largo o stint único. 35+ vueltas.',
                  grip: '84% Agarre',
                  degrad: 'Mínima degradación',
                  color: 'bg-neutral-100',
                  border: 'border-neutral-200',
                },
              ].map((tire) => {
                const isSelected = startingCompound === tire.id;
                return (
                  <button
                    key={tire.id}
                    onClick={() => {
                      playUiClick(750);
                      setStartingCompound(tire.id);
                    }}
                    onMouseEnter={playUiHover}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `bg-white/15 ${tire.border} text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]`
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${tire.color} shadow-md flex items-center justify-center shrink-0 border-2 border-black/50`}>
                        <Disc className="w-5 h-5 text-black/70" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">{tire.name}</div>
                        <div className="text-[11px] text-neutral-300 mt-0.5">{tire.desc}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-neutral-400">
                          <span className="text-emerald-400">{tire.grip}</span>
                          <span>·</span>
                          <span>{tire.degrad}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              CONFIRMAR NEUMÁTICOS
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 2: CIRCUIT SELECTION MODAL */}
      {activeOverlay === 'circuit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    SELECCIÓN DE CIRCUITO FIA
                  </h3>
                  <p className="text-[10px] text-neutral-400">Elige el trazado de competición</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AVAILABLE_CIRCUITS.map((c) => {
                const isSelected = selectedCircuit === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCircuitLocal(c.id)}
                    onMouseEnter={playUiHover}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-600/25 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white'
                        : 'bg-white/5 border-white/10 hover:border-white/30 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{c.flagEmoji || '🏁'}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-black uppercase tracking-wide">{c.name}</div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                        {(c.totalLength / 1000).toFixed(2)} KM · {c.cornersCount} Curvas
                      </div>
                      <div className="text-[9px] text-amber-400 mt-0.5 font-mono">
                        V. Máx: {c.topSpeedKmh} km/h
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-5 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              CONFIRMAR CIRCUITO
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 3: LAPS & DISTANCE MODAL */}
      {activeOverlay === 'laps' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    DURACIÓN DEL GRAN PREMIO
                  </h3>
                  <p className="text-[10px] text-neutral-400">Selecciona el número de vueltas de la carrera</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              {[
                { val: 9 as RaceLapOption, label: '9 VUELTAS', sub: 'Sprint Rápido', desc: 'Carrera corta de alta intensidad sin obligatoriedad de repostaje.' },
                { val: 20 as RaceLapOption, label: '20 VUELTAS', sub: 'Gran Premio Estándar', desc: 'Estrategia completa con gestión de neumáticos y ventana de pit stop.' },
                { val: 50 as RaceLapOption, label: '50 VUELTAS', sub: 'Resistencia Completa', desc: 'Duración oficial FIA. Degradación de neumáticos severa y múltiples paradas.' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    playUiClick(700);
                    setLaps(item.val);
                  }}
                  onMouseEnter={playUiHover}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    laps === item.val
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="text-sm font-black">{item.label}</div>
                    <div className="text-xs text-amber-300 mt-0.5">{item.sub}</div>
                    <div className="text-[10px] text-neutral-400 mt-1">{item.desc}</div>
                    <div className="text-[10px] text-cyan-300 mt-1">Tiempo estimado: {calculateEstimatedTime(item.val)}</div>
                  </div>
                  {laps === item.val && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              CONFIRMAR DURACIÓN
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 4: AI DIFFICULTY MODAL */}
      {activeOverlay === 'difficulty' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Swords className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    NIVEL DE COMPETITIVIDAD (IA)
                  </h3>
                  <p className="text-[10px] text-neutral-400">Ajusta la agresividad y ritmo de los pilotos rivales</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              {[
                { id: 'easy' as RaceDifficulty, name: 'NOVATO', desc: 'Ritmo accesible y permisivo. Frenadas anticipadas y trazadas suaves.' },
                { id: 'medium' as RaceDifficulty, name: 'INTERMEDIO', desc: 'Competitivo equilibrado. Ritmo consistente y adelantamientos calculados.' },
                { id: 'hard' as RaceDifficulty, name: 'LEYENDA FIA', desc: 'Máxima agresividad. Frenadas al límite, defensa férrea y ritmo récord.' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => {
                    playUiClick(700);
                    setDifficulty(diff.id);
                  }}
                  onMouseEnter={playUiHover}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    difficulty === diff.id
                      ? 'bg-red-600/25 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="text-sm font-black">{diff.name}</div>
                    <div className="text-[11px] text-neutral-300 mt-1">{diff.desc}</div>
                  </div>
                  {difficulty === diff.id && <CheckCircle2 className="w-5 h-5 text-red-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              CONFIRMAR DIFICULTAD
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 5: LIVERY & DRIVER IDENTITY MODAL */}
      {activeOverlay === 'livery' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    IDENTIDAD DE ESCUDERÍA Y PILOTO
                  </h3>
                  <p className="text-[10px] text-neutral-400">Personaliza nombre, dorsal y colores del monoplaza</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-neutral-400 block mb-1 uppercase">Nombre del Piloto</label>
                  <input
                    type="text"
                    value={driverDisplayName}
                    onChange={(e) => setDriverDisplayName(e.target.value)}
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-400 block mb-1 uppercase">Dorsal (#)</label>
                  <input
                    type="text"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                    maxLength={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1 uppercase">Nombre de Escudería</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={25}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Quick Preset Colors */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1.5 uppercase">Paletas de Colores de Competición</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Red Bull Racing', p: '#040814', s: '#cc0022', a: '#fec008' },
                    { name: 'Ferrari Corsa', p: '#dc2626', s: '#facc15', a: '#ffffff' },
                    { name: 'Mercedes Silver', p: '#94a3b8', s: '#06b6d4', a: '#10b981' },
                    { name: 'McLaren Papaya', p: '#f97316', s: '#0284c7', a: '#ffffff' },
                    { name: 'Aston Emerald', p: '#064e3b', s: '#10b981', a: '#fbbf24' },
                    { name: 'Stealth Carbon', p: '#18181b', s: '#d97706', a: '#fbbf24' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        playUiClick(700);
                        setPrimaryColor(preset.p);
                        setSecondaryColor(preset.s);
                        setAccentColor(preset.a);
                        setTeamName(preset.name);
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-left transition-all cursor-pointer"
                    >
                      <div className="flex gap-1.5 mb-1">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.p }} />
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.s }} />
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.a }} />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-300 block truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {onOpenLiveryStudio && (
                <button
                  onClick={() => {
                    playUiClick(750);
                    setActiveOverlay('none');
                    onOpenLiveryStudio();
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  <span>ABRIR ESTUDIO COMPLETO DE LIBREAS Y PATROCINADORES</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              GUARDAR Y CONFIRMAR
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 6: ASSISTS & SETUP MODAL */}
      {activeOverlay === 'setup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    AYUDAS DE CONDUCCIÓN Y CÁMARA
                  </h3>
                  <p className="text-[10px] text-neutral-400">Calibra las asistencias electrónicas de tu monoplaza</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* TC */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Control de Tracción (TC)</div>
                  <div className="text-[10px] text-neutral-400">Evita el derrape en aceleración saliendo de curvas lentas</div>
                </div>
                <button
                  onClick={() => {
                    playUiClick(700);
                    setTractionControl(!tractionControl);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                    tractionControl ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {tractionControl ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              {/* ABS */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Sistema Antibloqueo (ABS)</div>
                  <div className="text-[10px] text-neutral-400">Impide que los frenos bloqueen las ruedas en frenadas fuertes</div>
                </div>
                <button
                  onClick={() => {
                    playUiClick(700);
                    setAbsEnabled(!absEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                    absEnabled ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {absEnabled ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              {/* Racing Line */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Trazada Dinámica FIA</div>
                  <div className="text-[10px] text-neutral-400">Guía visual de trayectoria y puntos de frenada óptimos</div>
                </div>
                <button
                  onClick={() => {
                    playUiClick(700);
                    setRacingLine(!racingLine);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                    racingLine ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {racingLine ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              {/* Camera Mode */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-bold text-white mb-2">Perspectiva de Cámara Principal</div>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  {[
                    { id: 'chase' as CameraViewMode, name: 'TERCERA' },
                    { id: 'bumper' as CameraViewMode, name: 'MORRO' },
                    { id: 'hood' as CameraViewMode, name: 'CAPÓ' },
                    { id: 'orbit' as CameraViewMode, name: 'ÓRBITA' },
                  ].map((cm) => (
                    <button
                      key={cm.id}
                      onClick={() => {
                        playUiClick(700);
                        setCameraMode(cm.id);
                      }}
                      className={`py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                        cameraMode === cm.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-white'
                          : 'bg-white/5 border-white/10 text-neutral-400'
                      }`}
                    >
                      {cm.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              CONFIRMAR REGLAJES
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 7: MULTIPLAYER LOBBY MODAL */}
      {activeOverlay === 'multiplayer_modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    LOBBY MULTIJUGADOR 1V1
                  </h3>
                  <p className="text-[10px] text-neutral-400">Servidor en tiempo real con WebSocket dedicado</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 mb-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!roomState ? (
              <div className="space-y-4">
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 font-mono text-xs">
                  <button
                    onClick={() => setMpTab('create')}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                      mpTab === 'create' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
                    }`}
                  >
                    CREAR SALA
                  </button>
                  <button
                    onClick={() => setMpTab('join')}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                      mpTab === 'join' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
                    }`}
                  >
                    UNIRSE CON CÓDIGO
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-neutral-400 block mb-1 uppercase">Tu Alias de Piloto</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={16}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {mpTab === 'create' ? (
                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 block mb-1 uppercase">Vueltas del Duelo</label>
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                      {[3, 5, 10].map((v) => (
                        <button
                          key={v}
                          onClick={() => setMpLaps(v)}
                          className={`py-2 rounded-xl border font-bold transition-all ${
                            mpLaps === v
                              ? 'bg-emerald-500/30 border-emerald-400 text-white'
                              : 'bg-white/5 border-white/10 text-neutral-400'
                          }`}
                        >
                          {v} VUELTAS
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 block mb-1 uppercase">Código de Sala (4 Letras)</label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="Ej. ABCD"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-sm font-black font-mono tracking-widest text-center focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {mpTab === 'create' ? (
                  <button
                    onClick={handleCreateRoomAction}
                    disabled={isConnecting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-mono shadow-lg"
                  >
                    {isConnecting ? 'CONECTANDO...' : 'CREAR SALA Y ESPERAR RIVAL'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinRoomAction}
                    disabled={isConnecting || !joinCodeInput.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-mono shadow-lg"
                  >
                    {isConnecting ? 'CONECTANDO...' : 'UNIRSE A LA SALA'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {/* Active Room Code Card */}
                <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">Código de Invitación</span>
                  <div className="text-2xl font-black text-emerald-400 tracking-widest mt-1">{roomState.code}</div>
                  <button
                    onClick={copyRoomCode}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? '¡COPIADO!' : 'COPIAR CÓDIGO'}</span>
                  </button>
                </div>

                {/* Slot P1 & P2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[9px] text-neutral-400 block">PILOTO 1 (ANFITRIÓN)</span>
                    <span className="font-bold text-white truncate block">{roomState.players.p1?.name || 'Esperando...'}</span>
                    <span className={`text-[10px] font-bold ${roomState.players.p1?.isReady ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {roomState.players.p1?.isReady ? '✓ LISTO' : 'NO PREPARADO'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[9px] text-neutral-400 block">PILOTO 2 (RIVAL)</span>
                    <span className="font-bold text-white truncate block">{roomState.players.p2?.name || 'Esperando rival...'}</span>
                    <span className={`text-[10px] font-bold ${roomState.players.p2?.isReady ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {roomState.players.p2?.isReady ? '✓ LISTO' : 'NO PREPARADO'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                      isReady ? 'bg-emerald-500 text-black' : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {isReady ? '✓ LISTO' : 'MARCAR LISTO'}
                  </button>
                  <button
                    onClick={onLeaveRoom}
                    className="px-4 py-3 rounded-xl bg-red-600/30 border border-red-500/40 text-red-300 hover:bg-red-600/50 font-bold cursor-pointer transition-colors"
                  >
                    SALIR
                  </button>
                </div>

                {playerId === 'p1' && (
                  <button
                    onClick={() => {
                      playUiClick(950);
                      onStartMultiplayerRace();
                    }}
                    disabled={!roomState.players.p1?.isReady || !roomState.players.p2?.isReady}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 disabled:opacity-40 text-black font-black uppercase tracking-wider cursor-pointer shadow-lg"
                  >
                    INICIAR DUELO (AMBOS LISTOS)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY 8: CONTROLS GUIDE MODAL */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">GUÍA DE CONTROLES</h3>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setShowControlsModal(false);
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Acelerar / Freno</span>
                <span className="font-mono text-amber-400 bg-white/10 px-2 py-0.5 rounded">W / S o Flechas ↑ / ↓</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Girar Dirección</span>
                <span className="font-mono text-amber-400 bg-white/10 px-2 py-0.5 rounded">A / D o Flechas ← / →</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Freno de Mano / Derrape</span>
                <span className="font-mono text-amber-400 bg-white/10 px-2 py-0.5 rounded">Espacio (Space)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Cambiar Cámara</span>
                <span className="font-mono text-cyan-400 bg-white/10 px-2 py-0.5 rounded">Tecla C</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Pausa / Menú de Carrera</span>
                <span className="font-mono text-red-400 bg-white/10 px-2 py-0.5 rounded">Escape (ESC)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Pantalla Completa</span>
                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">Tecla F</span>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setShowControlsModal(false);
              }}
              className="w-full mt-5 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
