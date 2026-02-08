
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

// Audio utility functions following @google/genai guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiNarrator {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();

  constructor() {
    // Correct initialization: always use { apiKey: process.env.API_KEY } directly
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  async connect() {
    if (this.sessionPromise) return;

    const systemInstruction = `
      Bạn là một người bạn Capybara thân thiện và vui vẻ. 
      Bạn đang hướng dẫn một em bé 6 tuổi trồng cam.
      Hãy nói tiếng Việt thật nhẹ nhàng, khích lệ và dễ hiểu.
      Khi bé xòe tay (Open Palm), hãy khen bé đã gieo hạt giỏi.
      Khi bé chỉ tay (Pointing), hãy nói "Cây đang uống nước đấy, thích quá!".
      Khi bé nắm tay (Fist), hãy chúc mừng bé đã thu hoạch được cam ngon.
      Hãy dùng những từ ngữ như "Bạn nhỏ ơi", "Giỏi quá", "Cố lên nào".
    `;

    // Follow Session Setup example to avoid race conditions and ensure session data is sent correctly
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction,
      },
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected!");
        },
        onmessage: async (message: LiveServerMessage) => {
          // Process model's audio output bytes following guidelines
          const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData) {
            this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
            const audioBuffer = await decodeAudioData(
              decode(audioData),
              this.audioContext,
              24000,
              1
            );
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.addEventListener('ended', () => {
              this.sources.delete(source);
            });
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          if (message.serverContent?.interrupted) {
            for (const source of this.sources.values()) {
              source.stop();
              this.sources.delete(source);
            }
            this.nextStartTime = 0;
          }
        },
        onerror: (e: any) => console.error("Gemini Live Error:", e),
        onclose: () => {
          this.sessionPromise = null;
          console.log("Gemini Live Closed");
        }
      }
    });

    try {
      await this.sessionPromise;
    } catch (err) {
      console.error("Failed to connect to Gemini:", err);
      this.sessionPromise = null;
    }
  }

  // Guidelines note that Live API is primarily for audio-in.
  // This helper is kept for consistency with the component usage but uses the session promise.
  say(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        // Live API typically expects audio or image frames via sendRealtimeInput.
        // We rely on the model's personality and triggers here.
      });
    }
  }

  close() {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close());
      this.sessionPromise = null;
    }
  }
}
