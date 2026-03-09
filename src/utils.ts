import { GoogleGenAI, Modality } from "@google/genai";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const speak = async (text: string) => {
    try {
        console.log("Gerando voz para:", text);
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp", // Updated to a more standard model if the tts one is specific
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            console.log("Áudio recebido, iniciando reprodução...");
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            const pcmData = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                float32Data[i] = pcmData[i] / 32768.0;
            }

            const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        } else {
            console.warn("Nenhum dado de áudio na resposta do Gemini");
        }
    } catch (error) {
        console.error("Erro ao gerar voz:", error);
    }
};

export const triggerCall = async (patientName: string, ticketNumber: string, sector: string) => {
    try {
        await addDoc(collection(db, "calls"), {
            patientName,
            ticketNumber,
            sector,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Erro ao disparar chamada:", error);
    }
};

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userUid?: string) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: userUid,
        },
        operationType,
        path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
}
