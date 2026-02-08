
import React, { useState, useEffect, useRef, useCallback } from 'react';
import HandCamera from './components/HandCamera';
import GameScene from './components/GameScene';
import { GameState, GestureType, GameProgress, PlayerStats, Insect, BossData } from './types';
import { GeminiNarrator } from './services/geminiLiveService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    totalOranges: 0,
    waterMultiplier: 1,
    harvestPower: 1,
    weaponPower: 1,
    isHellMode: false,
  });
  const [progress, setProgress] = useState<GameProgress>({
    seedsPlanted: 0,
    waterLevel: 0,
    orangesHarvested: 0,
    activeInsects: [],
    boss: null,
  });
  const [lastGesture, setLastGesture] = useState<GestureType>(GestureType.NONE);
  
  const narratorRef = useRef<GeminiNarrator | null>(null);
  const cooldownRef = useRef<boolean>(false);
  const insectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    narratorRef.current = new GeminiNarrator();
    return () => {
      narratorRef.current?.close();
      if (insectIntervalRef.current) clearInterval(insectIntervalRef.current);
    };
  }, []);

  const spawnInsect = useCallback(() => {
    const numPlots = Math.min(2 + Math.ceil(stats.level / 2), 7);
    const randomPlot = Math.floor(Math.random() * numPlots);
    let type: 'Snail' | 'Locust' | 'Spider' = 'Snail';
    if (stats.level >= 4) type = Math.random() > 0.6 ? 'Locust' : 'Snail';
    if (stats.level >= 7) type = Math.random() > 0.4 ? 'Spider' : (Math.random() > 0.5 ? 'Locust' : 'Snail');
    
    setProgress(prev => {
      if (prev.activeInsects.some(bug => bug.plotIndex === randomPlot)) return prev;
      return {
        ...prev,
        activeInsects: [...prev.activeInsects, { id: Date.now(), type, plotIndex: randomPlot, health: 1 }]
      };
    });
  }, [stats.level]);

  useEffect(() => {
    if (gameState === GameState.GROWING || gameState === GameState.PLANTING) {
      const intervalTime = (3000 - (stats.level * 200)) / (stats.isHellMode ? 2 : 1);
      insectIntervalRef.current = setInterval(spawnInsect, Math.max(800, intervalTime));
    } else {
      if (insectIntervalRef.current) {
        clearInterval(insectIntervalRef.current);
        insectIntervalRef.current = null;
      }
    }
  }, [gameState, stats.level, stats.isHellMode, spawnInsect]);

  const handleStartGame = async () => {
    if (narratorRef.current) await narratorRef.current.connect();
    setGameState(GameState.PLANTING);
  };

  const nextLevel = () => {
    const isBossLevel = stats.level % 2 === 0;
    setStats(prev => ({ ...prev, totalOranges: prev.totalOranges + progress.orangesHarvested }));
    
    if (isBossLevel) {
      const bossTypes = ['Ốc Sên Vua 🐌', 'Chúa Châu Chấu 🦗', 'Bọ Hôi Thối 🪲', 'Nữ Hoàng Nhện 🕷️', 'Quạ Bóng Đêm 🐦‍⬛'];
      const bossIdx = (stats.level / 2) - 1;
      const hp = stats.level * (stats.isHellMode ? 10 : 5);
      setProgress(prev => ({
        ...prev,
        boss: {
          type: bossTypes[bossIdx],
          maxHealth: hp,
          currentHealth: hp,
          emoji: bossTypes[bossIdx].split(' ').pop() || '👾',
          attackCooldown: 0
        }
      }));
      setGameState(GameState.BOSS_FIGHT);
    } else {
      if (stats.level >= 10) setGameState(GameState.FINISHED);
      else setGameState(GameState.UPGRADE);
    }
  };

  const startNextLevel = () => {
    setStats(prev => ({ ...prev, level: prev.level + 1 }));
    setProgress({ seedsPlanted: 0, waterLevel: 0, orangesHarvested: 0, activeInsects: [], boss: null });
    setGameState(GameState.PLANTING);
  };

  const processGesture = useCallback((gesture: GestureType) => {
    if (gameState === GameState.UPGRADE || gameState === GameState.FINISHED || gameState === GameState.START) return;
    
    setLastGesture(gesture);
    if (cooldownRef.current) return;

    const numPlots = Math.min(2 + Math.ceil(stats.level / 2), 7);
    const maxWater = numPlots * (stats.isHellMode ? 2.5 : 1.6);

    // Đánh Boss
    if (gameState === GameState.BOSS_FIGHT && gesture === GestureType.VICTORY && progress.boss) {
      setProgress(prev => {
        if (!prev.boss) return prev;
        const newHp = prev.boss.currentHealth - stats.weaponPower;
        if (newHp <= 0) {
          setTimeout(() => {
            if (stats.level >= 10) setGameState(GameState.FINISHED);
            else setGameState(GameState.UPGRADE);
          }, 500);
          return { ...prev, boss: { ...prev.boss, currentHealth: 0 } };
        }
        return { ...prev, boss: { ...prev.boss, currentHealth: newHp } };
      });
      triggerAction();
      return;
    }

    // Tiêu diệt côn trùng
    if (gesture === GestureType.VICTORY && progress.activeInsects.length > 0) {
      setProgress(prev => ({
        ...prev,
        activeInsects: prev.activeInsects.slice(1)
      }));
      triggerAction();
      return;
    }

    const hasInsects = progress.activeInsects.length > 0;

    if (gesture === GestureType.OPEN_PALM && gameState === GameState.PLANTING && !hasInsects) {
      setProgress(prev => {
        const newVal = Math.min(prev.seedsPlanted + 1, numPlots);
        if (newVal >= numPlots) setGameState(GameState.GROWING);
        return { ...prev, seedsPlanted: newVal };
      });
      triggerAction();
    } else if (gesture === GestureType.POINTING && gameState === GameState.GROWING && !hasInsects) {
      setProgress(prev => {
        const waterAmount = (stats.isHellMode ? 0.2 : 0.4) * stats.waterMultiplier;
        const newVal = prev.waterLevel + waterAmount;
        if (newVal >= maxWater) setGameState(GameState.HARVESTING);
        return { ...prev, waterLevel: newVal };
      });
      triggerAction();
    } else if (gesture === GestureType.FIST && gameState === GameState.HARVESTING) {
      setProgress(prev => {
        const newVal = Math.min(prev.orangesHarvested + stats.harvestPower, numPlots * 2);
        if (newVal >= numPlots * 2) nextLevel();
        return { ...prev, orangesHarvested: newVal };
      });
      triggerAction();
    }
  }, [gameState, progress, stats, nextLevel]);

  const triggerAction = () => {
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, stats.isHellMode ? 250 : 400);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-2 font-sans transition-colors duration-1000 ${stats.isHellMode ? 'bg-red-50' : 'bg-green-50'}`}>
      <header className="mb-2 text-center w-full max-w-4xl flex items-center justify-between">
        <h1 className={`text-2xl md:text-5xl font-black transition-colors ${stats.isHellMode ? 'text-red-700' : 'text-orange-600'} drop-shadow-md select-none`}>
          {stats.isHellMode ? 'HELL FARM 🔥' : 'Capybara Hero 🛡️'}
        </h1>
        {gameState === GameState.START && (
          <button 
            onClick={() => setStats(s => ({...s, isHellMode: !s.isHellMode}))}
            className={`px-4 py-2 rounded-full font-black text-sm border-2 transition-all ${stats.isHellMode ? 'bg-red-600 text-white border-red-800 scale-110' : 'bg-white text-gray-400 border-gray-200'}`}
          >
            {stats.isHellMode ? 'ĐANG BẬT HELL MODE 💀' : 'BẬT HELL MODE?'}
          </button>
        )}
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <div className="lg:col-span-2 h-[450px] lg:h-[600px]">
          {gameState === GameState.START ? (
            <div className="w-full h-full bg-white rounded-[30px] shadow-xl flex flex-col items-center justify-center p-6 border-[8px] border-orange-100 relative">
              {stats.isHellMode && <div className="absolute inset-0 bg-red-600/5 animate-pulse rounded-[22px]" />}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce transition-colors ${stats.isHellMode ? 'bg-red-600' : 'bg-orange-400'}`}>
                <span className="text-6xl">{stats.isHellMode ? '🔥' : '⚔️'}</span>
              </div>
              <h2 className="text-3xl font-black mb-2 uppercase">{stats.isHellMode ? 'Chào mừng đến Địa Ngục!' : 'Sẵn sàng ra trận!'}</h2>
              <p className="text-gray-500 font-bold mb-6">Đấu Boss mỗi 2 màn chơi</p>
              <button onClick={handleStartGame} className={`${stats.isHellMode ? 'bg-red-700' : 'bg-orange-500'} text-white text-2xl font-black py-4 px-12 rounded-full shadow-lg hover:translate-y-1`}>
                CHIẾN LUÔN! 🚀
              </button>
            </div>
          ) : gameState === GameState.UPGRADE ? (
            <div className="w-full h-full bg-orange-50 rounded-[40px] shadow-xl p-6 flex flex-col items-center border-[10px] border-white overflow-y-auto">
                <h2 className="text-3xl font-black text-orange-600 mb-2">CỬA HÀNG VŨ KHÍ 🏪</h2>
                <p className="font-bold text-gray-500 mb-4">Dùng Cam 🍊 để đổi lấy sức mạnh!</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    <button onClick={() => { if(stats.totalOranges >= 5) setStats(s => ({...s, totalOranges: s.totalOranges-5, waterMultiplier: 2.5})) }} 
                      className="p-4 bg-white rounded-2xl border-4 border-blue-200 flex flex-col items-center shadow-md hover:scale-105">
                        <span className="text-4xl">🔱</span><span className="font-bold text-xs">Vòi Rồng (5🍊)</span>
                    </button>
                    <button onClick={() => { if(stats.totalOranges >= 8) setStats(s => ({...s, totalOranges: s.totalOranges-8, weaponPower: stats.weaponPower + 2})) }} 
                      className="p-4 bg-white rounded-2xl border-4 border-red-200 flex flex-col items-center shadow-md hover:scale-105">
                        <span className="text-4xl">☄️</span><span className="font-bold text-xs">Thiên Thạch (8🍊)</span>
                    </button>
                    <button onClick={() => { if(stats.totalOranges >= 10) setStats(s => ({...s, totalOranges: s.totalOranges-10, harvestPower: 3})) }} 
                      className="p-4 bg-white rounded-2xl border-4 border-green-200 flex flex-col items-center shadow-md hover:scale-105">
                        <span className="text-4xl">⚡</span><span className="font-bold text-xs">Siêu Găng (10🍊)</span>
                    </button>
                </div>
                <button onClick={startNextLevel} className="mt-8 bg-green-500 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg">
                    TIẾP TỤC MÀN {stats.level + 1} ➡️
                </button>
            </div>
          ) : <GameScene gameState={gameState} progress={progress} lastGesture={lastGesture} stats={stats} /> }
        </div>

        <div className="flex flex-col gap-4">
          <div className={`bg-white rounded-[24px] shadow-lg p-2 border-4 transition-colors ${stats.isHellMode ? 'border-red-500' : 'border-white'}`}>
            <HandCamera onGesture={processGesture} />
          </div>
          <div className="bg-white rounded-[24px] shadow-lg p-4 flex-1 border-b-8 border-orange-500 overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-2">Mục tiêu {stats.level}:</h3>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex items-center gap-2"><span className="text-xl">✌️</span> Victory để BẮN Boss và Côn Trùng</div>
              <div className="flex items-center gap-2 text-red-600"><span className="text-xl">🐌</span> Ốc sên: Cây sẽ ngừng lớn</div>
              <div className="flex items-center gap-2 text-purple-600"><span className="text-xl">🦗</span> Châu chấu: Ăn trộm hạt giống</div>
              <div className="flex items-center gap-2 text-gray-800"><span className="text-xl">🕷️</span> Nhện (Màn 7+): Làm chậm Capybara</div>
            </div>
          </div>
        </div>
      </main>

      {gameState === GameState.FINISHED && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[50px] p-12 text-center max-w-md border-t-[20px] border-yellow-400 shadow-[0_0_100px_rgba(255,255,255,0.2)]">
            <span className="text-8xl">🥇</span>
            <h2 className="text-4xl font-black text-orange-600 my-4 uppercase">HUYỀN THOẠI!</h2>
            <p className="font-bold mb-8 text-xl">Bé đã giải cứu thế giới Cam khỏi đại dịch côn trùng!</p>
            <button onClick={() => window.location.reload()} className="bg-green-500 text-white font-black py-4 px-16 rounded-full shadow-2xl scale-110">CHƠI LẠI TỪ ĐẦU 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
