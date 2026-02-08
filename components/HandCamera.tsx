
import React, { useEffect, useRef, useState } from 'react';
import { GestureType } from '../types';

interface HandCameraProps {
  onGesture: (gesture: GestureType) => void;
}

const HandCamera: React.FC<HandCameraProps> = ({ onGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const onGestureRef = useRef(onGesture);
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new (window as any).Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const onResults = (results: any) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current || !videoRef.current) return;

      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        (window as any).drawConnectors(ctx, landmarks, (window as any).HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        (window as any).drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });

        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const thumbTip = landmarks[4];

        const isIndexUp = indexTip.y < landmarks[6].y;
        const isMiddleUp = middleTip.y < landmarks[10].y;
        const isRingDown = ringTip.y > landmarks[14].y;
        const isPinkyDown = pinkyTip.y > landmarks[18].y;

        // Cử chỉ Victory ✌️ (Ngón trỏ và ngón giữa lên, các ngón khác xuống)
        const isVictory = isIndexUp && isMiddleUp && isRingDown && isPinkyDown;
        
        // Cử chỉ Chỉ tay ☝️
        const isPointing = isIndexUp && !isMiddleUp && isRingDown;

        // Xòe tay 🖐️
        const isOpen = isIndexUp && isMiddleUp && ringTip.y < landmarks[14].y;

        // Nắm tay ✊
        const isFist = !isIndexUp && !isMiddleUp && isRingDown && isPinkyDown;

        if (isVictory) onGestureRef.current(GestureType.VICTORY);
        else if (isOpen) onGestureRef.current(GestureType.OPEN_PALM);
        else if (isFist) onGestureRef.current(GestureType.FIST);
        else if (isPointing) onGestureRef.current(GestureType.POINTING);
        else onGestureRef.current(GestureType.NONE);
      } else {
        onGestureRef.current(GestureType.NONE);
      }
      ctx.restore();
    };

    hands.onResults(onResults);

    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start().then(() => setIsLoaded(true));

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-black">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover mirror" width="640" height="480" />
      <style>{`.mirror { transform: scaleX(-1); }`}</style>
      <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white p-1 rounded-lg text-[10px] text-center font-bold">
        🖐️Gieo | ☝️Tưới | ✊Hái | ✌️Bắn Côn Trùng
      </div>
    </div>
  );
};

export default HandCamera;
