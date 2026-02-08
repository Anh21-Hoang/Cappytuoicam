
import React, { useMemo } from 'react';
import { GameState, GestureType, PlayerStats, Insect } from '../types';
import { CapybaraIcon, OrangeIcon, WateringCanIcon } from '../constants';

interface GameSceneProps {
  gameState: GameState;
  lastGesture: GestureType;
  progress: {
    seedsPlanted: number;
    waterLevel: number;
    orangesHarvested: number;
    activeInsects: Insect[];
    boss: any | null;
  };
  stats: PlayerStats;
}

const GameScene: React.FC<GameSceneProps> = ({ gameState, progress, lastGesture, stats }) => {
  const numPlots = Math.min(2 + Math.ceil(stats.level / 2), 7);
  const maxWater = numPlots * (stats.isHellMode ? 2.5 : 1.6);
  
  const getPlotPosition = (index: number) => {
    const spacing = 450 / (numPlots + 1);
    const startX = -((numPlots - 1) * spacing) / 2;
    return startX + index * spacing;
  };

  const capyPosition = useMemo(() => {
    if (gameState === GameState.PLANTING) return getPlotPosition(Math.min(progress.seedsPlanted, numPlots - 1));
    if (gameState === GameState.GROWING) {
      const waterPerPlot = maxWater / numPlots;
      return getPlotPosition(Math.min(Math.floor(progress.waterLevel / waterPerPlot), numPlots - 1));
    }
    if (gameState === GameState.HARVESTING) return getPlotPosition(Math.min(Math.floor(progress.orangesHarvested / 2), numPlots - 1));
    if (gameState === GameState.BOSS_FIGHT) return 0; // Đứng giữa khi đấu Boss
    return 0;
  }, [gameState, progress, numPlots, maxWater]);

  const waterPercent = Math.min(Math.round((progress.waterLevel / maxWater) * 100), 100);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-[40px] border-[12px] shadow-inner transition-colors duration-1000 ${stats.isHellMode ? 'bg-orange-900 border-red-600' : 'bg-sky-200 border-yellow-300'}`}>
      {/* Background Decor */}
      <div className={`absolute top-10 left-10 animate-bounce ${stats.isHellMode ? 'opacity-20' : 'opacity-50'}`}>
        <div className="w-24 h-8 bg-white rounded-full blur-sm" />
      </div>
      
      {/* Hell Mode Fire Effects */}
      {stats.isHellMode && (
        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-red-600/40 to-transparent z-0 animate-pulse" />
      )}

      {/* Cánh đồng */}
      <div className={`absolute bottom-0 w-full h-[35%] rounded-t-[100px] transition-colors ${stats.isHellMode ? 'bg-amber-950' : 'bg-green-500'}`}>
        <div className="absolute bottom-0 w-full h-1/2 bg-black/20" />
      </div>

      {/* BOSS RENDER */}
      {gameState === GameState.BOSS_FIGHT && progress.boss && (
        <div className="absolute top-20 w-full flex flex-col items-center z-50">
           <div className="w-4/5 h-6 bg-gray-800 rounded-full border-2 border-white overflow-hidden shadow-2xl mb-2">
              <div 
                className="h-full bg-red-500 transition-all duration-300" 
                style={{ width: `${(progress.boss.currentHealth / progress.boss.maxHealth) * 100}%` }}
              />
           </div>
           <div className="text-white font-black text-sm uppercase tracking-widest drop-shadow-md">
              BOSS: {progress.boss.type}
           </div>
           <div className="text-[120px] animate-bounce-heavy mt-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
             {progress.boss.emoji}
           </div>
        </div>
      )}

      {/* Capybara & Effects */}
      <div 
        className="absolute bottom-[28%] transition-all duration-500 transform flex flex-col items-center z-40"
        style={{ left: `calc(50% + ${capyPosition}px)`, transform: 'translateX(-50%)' }}
      >
        {lastGesture === GestureType.VICTORY && (
          <div className="absolute -top-20 text-5xl animate-fire-shot">
            {stats.weaponPower > 1 ? '🔥' : '🫧'}
          </div>
        )}
        
        <div className="relative">
          <div className={`${lastGesture !== GestureType.NONE ? 'animate-bounce' : 'animate-wiggle'}`}>
            <CapybaraIcon />
          </div>

          {lastGesture === GestureType.POINTING && (
            <div className="absolute -right-12 top-4 animate-swing origin-left z-40">
              <WateringCanIcon color={stats.waterMultiplier > 1 ? "#FFD700" : "#3b82f6"} />
            </div>
          )}
        </div>
      </div>

      {/* Garden Plots & Insects */}
      <div className={`absolute bottom-[18%] w-full flex justify-center gap-[10px] md:gap-[15px] px-4 z-10 ${gameState === GameState.BOSS_FIGHT ? 'opacity-20 scale-75' : ''}`}>
        {[...Array(numPlots)].map((_, i) => (
          <div key={i} className="relative flex flex-col items-center w-12 md:w-16">
            <div className={`w-full h-4 rounded-full mb-1 ${stats.isHellMode ? 'bg-red-900' : 'bg-amber-900/60'}`} />
            
            {progress.activeInsects.find(bug => bug.plotIndex === i) && (
              <div className="absolute -top-6 animate-bounce text-2xl z-50">
                {progress.activeInsects.find(bug => bug.plotIndex === i)?.type === 'Snail' ? '🐌' : 
                 progress.activeInsects.find(bug => bug.plotIndex === i)?.type === 'Locust' ? '🦗' : '🕷️'}
              </div>
            )}

            <div className="absolute bottom-4 flex flex-col items-center">
              {progress.seedsPlanted > i && (
                <div className="transition-all duration-1000 transform origin-bottom">
                  {progress.waterLevel < (i * (stats.isHellMode ? 2.5 : 1.6) + 1.2) ? (
                    <div className="w-2.5 h-10 bg-green-400 rounded-t-full border-x-2 border-green-700" />
                  ) : (
                    <div className="relative flex flex-col items-center animate-in zoom-in duration-500">
                      <div className="w-2.5 h-16 bg-amber-800 rounded-t-md" />
                      <div className={`absolute -top-10 w-16 h-16 rounded-full shadow-xl border-2 flex items-center justify-center flex-wrap ${stats.isHellMode ? 'bg-red-600 border-red-400' : 'bg-green-500 border-green-400'}`}>
                         {[...Array(2)].map((_, j) => {
                           const orangeIndex = i * 2 + j;
                           return progress.orangesHarvested <= orangeIndex && (
                             <div key={j} className="m-0.5"><OrangeIcon size={20} /></div>
                           );
                         })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* HUD HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-50">
        <div className={`px-4 py-1 rounded-2xl font-black shadow-lg border-2 border-white flex items-center gap-2 text-sm ${stats.isHellMode ? 'bg-red-600' : 'bg-orange-500'} text-white`}>
           🏆 MÀN {stats.level} {stats.isHellMode && "(HELL)"}
        </div>
        <div className="bg-black/60 px-3 py-1 rounded-xl font-black text-yellow-400 shadow-sm text-xs border border-white/20">
           Sức mạnh bắn: x{stats.weaponPower}
        </div>
      </div>

      <style>{`
        @keyframes fire-shot {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-300px) scale(3); opacity: 0; }
        }
        .animate-fire-shot { animation: fire-shot 0.5s ease-out forwards; }
        @keyframes bounce-heavy {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-heavy { animation: bounce-heavy 1.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default GameScene;
