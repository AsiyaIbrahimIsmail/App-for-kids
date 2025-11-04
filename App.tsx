
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { STORY_DATA } from './constants';
import * as geminiService from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import type { StoryPage } from './types';

// --- Icon Components ---
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
);
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);
const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
);
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a9 9 0 0115.546 5.962m-1.348 5.076A9.005 9.005 0 0112 21a9 9 0 01-9-9 8.962 8.962 0 014.39-7.5" /></svg>
);

// --- Main App Component ---
export default function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const currentPage: StoryPage = useMemo(() => STORY_DATA[currentPageIndex], [currentPageIndex]);
  const currentImage: string | undefined = useMemo(() => generatedImages[currentPage.id], [generatedImages, currentPage]);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);
  
  const generateImage = useCallback(async (pageId: number, prompt: string) => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const imageUrl = await geminiService.generateStoryImage(prompt);
      setGeneratedImages(prev => ({ ...prev, [pageId]: imageUrl }));
    } catch (err) {
      console.error("Image generation failed:", err);
      setError("Oops! We couldn't create an illustration. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  }, []);

  useEffect(() => {
    if (!currentImage && !isGeneratingImage) {
      generateImage(currentPage.id, currentPage.imagePrompt);
    }
  }, [currentPage, currentImage, isGeneratingImage, generateImage]);

  const stopCurrentAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
      setIsReadingAloud(false);
    }
  }, []);
  
  const handleReadAloud = useCallback(async () => {
    if (isReadingAloud || !audioContextRef.current) return;
    stopCurrentAudio();
    setIsReadingAloud(true);
    setError(null);
    try {
      const audioBuffer = await geminiService.generateSpeech(currentPage.text, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      source.onended = () => {
        setIsReadingAloud(false);
        audioSourceRef.current = null;
      };
      audioSourceRef.current = source;
    } catch (err) {
      console.error("Speech generation failed:", err);
      setError("Oops! We couldn't read the story aloud. Please try again.");
      setIsReadingAloud(false);
    }
  }, [currentPage, isReadingAloud, stopCurrentAudio]);

  const handleNextPage = () => {
    if (currentPageIndex < STORY_DATA.length - 1) {
      stopCurrentAudio();
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      stopCurrentAudio();
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleGenerateNewImage = () => {
    if (!isGeneratingImage) {
        generateImage(currentPage.id, currentPage.imagePrompt);
    }
  };
  
  return (
    <div className="min-h-screen bg-sky-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-sky-700" style={{fontFamily: "'Comic Sans MS', cursive, sans-serif"}}>Gingi's Candy Adventure</h1>
          <p className="text-sky-500 mt-1">An AI-Illustrated Storybook</p>
        </header>
        <main className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="aspect-square w-full bg-slate-200 flex items-center justify-center relative">
            {isGeneratingImage && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10">
                <LoadingSpinner size="12" color="sky-500" />
                <p className="mt-4 text-sky-600 font-medium">Illustrating...</p>
              </div>
            )}
            {currentImage ? (
              <img src={currentImage} alt="Story illustration" className="w-full h-full object-cover"/>
            ) : (
                !isGeneratingImage && <div className="text-slate-500">Illustration will appear here</div>
            )}
          </div>
          <div className="p-6 md:p-8">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-6 text-center">{currentPage.text}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReadAloud}
                disabled={isReadingAloud}
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isReadingAloud ? <LoadingSpinner size="6" color="white" /> : <SpeakerIcon />}
                {isReadingAloud ? 'Reading...' : 'Read Aloud'}
              </button>
              <button
                onClick={handleGenerateNewImage}
                disabled={isGeneratingImage}
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <SparklesIcon />
                New Illustration
              </button>
            </div>
          </div>
          <footer className="bg-slate-50 p-4 flex justify-between items-center border-t">
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="flex items-center px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon />
              <span className="ml-1">Prev</span>
            </button>
            <div className="text-gray-600 font-medium">
              Page {currentPageIndex + 1} / {STORY_DATA.length}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === STORY_DATA.length - 1}
              className="flex items-center px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-1">Next</span>
              <ChevronRightIcon />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
