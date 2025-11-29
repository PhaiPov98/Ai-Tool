import React, { useState, useEffect, useCallback, useRef } from 'react';
import { checkApiKey, promptApiKeySelection, generateVideo } from './services/geminiService';
import { VideoConfig, GeneratedVideo, GenerationState } from './types';
import { VideoHistory } from './components/VideoHistory';
import { WandIcon, LoaderIcon, KeyIcon, DownloadIcon, FilmIcon } from './components/Icons';

function App() {
  // --- State ---
  const [apiKeySet, setApiKeySet] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<GeneratedVideo | null>(null);
  
  // Form State
  const [prompt, setPrompt] = useState('A futuristic cybernetic python snake slithering through glowing green code matrix, 8k resolution, cinematic lighting');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [model, setModel] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');

  // Refs for video playback
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Effects ---
  useEffect(() => {
    // Check for API key on mount
    const verifyKey = async () => {
      const hasKey = await checkApiKey();
      setApiKeySet(hasKey);
    };
    verifyKey();
  }, []);

  useEffect(() => {
    // Autoplay active video when switched
    if (activeVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log('Autoplay blocked', e));
    }
  }, [activeVideo]);

  // --- Handlers ---

  const handleApiKeySelection = async () => {
    await promptApiKeySelection();
    // Re-check after prompt
    const hasKey = await checkApiKey();
    setApiKeySet(hasKey);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Ensure key is set before starting
    const hasKey = await checkApiKey();
    if (!hasKey) {
      await handleApiKeySelection();
      // If still false, user cancelled or failed
      if (!(await checkApiKey())) return;
    }

    setGenerationState({ status: 'generating', progressMessage: 'Initializing Veo model...' });
    
    const config: VideoConfig = {
      prompt,
      aspectRatio,
      resolution,
      model,
    };

    try {
      // 1. Generate & Poll
      setGenerationState({ status: 'polling', progressMessage: 'Dreaming up your video (this may take 1-2 mins)...' });
      
      const videoBlob = await generateVideo(config);
      
      // 2. Process Result
      setGenerationState({ status: 'downloading', progressMessage: 'Finalizing video...' });
      
      const videoUrl = URL.createObjectURL(videoBlob);
      const newVideo: GeneratedVideo = {
        id: crypto.randomUUID(),
        url: videoUrl,
        config,
        createdAt: Date.now(),
        fileName: `veo-gen-${Date.now()}.mp4`
      };

      setGeneratedVideos(prev => [newVideo, ...prev]);
      setActiveVideo(newVideo);
      setGenerationState({ status: 'completed' });

    } catch (error: any) {
      console.error("Generation error:", error);
      // If error is about key, reset key state
      if (error.message && (error.message.includes("key") || error.message.includes("403"))) {
         setApiKeySet(false);
      }
      setGenerationState({ 
        status: 'error', 
        error: error.message || "An unexpected error occurred during video generation." 
      });
    }
  };

  // --- Renders ---

  const isProcessing = ['generating', 'polling', 'downloading'].includes(generationState.status);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
               <WandIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Veo Studio
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors hidden sm:block">
              Billing & Pricing Info
            </a>
            <button
              onClick={handleApiKeySelection}
              className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                ${apiKeySet 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse'}
              `}
            >
              <KeyIcon className="w-4 h-4" />
              <span>{apiKeySet ? 'API Key Active' : 'Select API Key'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & History */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Controls Panel */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
              <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
              Configuration
            </h2>
            
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isProcessing}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-sm leading-relaxed"
                  placeholder="Describe your video in detail..."
                />
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`py-2 text-xs font-medium rounded-md transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      16:9
                    </button>
                    <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`py-2 text-xs font-medium rounded-md transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      9:16
                    </button>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Resolution</label>
                   <select 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                   >
                     <option value="720p">720p HD</option>
                     <option value="1080p">1080p FHD</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Model</label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="veo-3.1-fast-generate-preview">Veo Fast (Preview)</option>
                  <option value="veo-3.1-generate-preview">Veo Quality (Preview)</option>
                </select>
                <p className="text-[10px] text-slate-600 mt-2">
                  * Fast model is optimized for speed. Quality model takes longer but produces higher fidelity details.
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isProcessing || !prompt}
                className={`
                  w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98]
                  flex items-center justify-center space-x-2
                  ${isProcessing 
                    ? 'bg-slate-800 cursor-not-allowed opacity-80' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'}
                `}
              >
                {isProcessing ? (
                  <>
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <WandIcon className="w-5 h-5" />
                    <span>Generate Video</span>
                  </>
                )}
              </button>

              {generationState.status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {generationState.error}
                </div>
              )}
            </div>
          </div>

          {/* History Panel */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 h-[400px] overflow-y-auto custom-scrollbar">
             <VideoHistory 
               videos={generatedVideos} 
               onSelect={setActiveVideo} 
               activeVideoId={activeVideo?.id} 
             />
          </div>

        </div>

        {/* Right Column: Preview Area */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
          <div className="flex-grow bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative group">
            
            {activeVideo ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video 
                  ref={videoRef}
                  src={activeVideo.url} 
                  controls 
                  loop
                  className="max-h-full max-w-full w-auto h-auto object-contain outline-none"
                />
                
                {/* Download Overlay Button */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a 
                    href={activeVideo.url} 
                    download={activeVideo.fileName}
                    className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            ) : (
              // Empty State or Loading State
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                {isProcessing ? (
                  <div className="space-y-6 max-w-md animate-pulse">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto relative">
                      <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                      <LoaderIcon className="w-10 h-10 text-indigo-400 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Generating...</h3>
                      <p className="text-indigo-300 font-medium">{generationState.progressMessage}</p>
                      <p className="text-slate-500 text-sm mt-4">Veo is crafting your video frame by frame. Please don't close this tab.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                     <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 border border-slate-700">
                        <FilmIcon className="w-12 h-12 text-slate-600" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-300">Ready to Create</h3>
                     <p className="text-slate-500">
                       Enter a prompt on the left to start generating high-quality AI videos with Google's Veo model.
                     </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Active Video Meta */}
          {activeVideo && !isProcessing && (
            <div className="mt-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-white font-medium text-lg mb-1">Generated Result</h3>
                   <p className="text-slate-400 text-sm">{activeVideo.config.prompt}</p>
                </div>
                <div className="flex space-x-4 text-sm text-slate-500">
                   <div className="flex flex-col items-end">
                      <span className="uppercase text-[10px] font-bold tracking-wider mb-0.5">Model</span>
                      <span className="text-slate-300">{activeVideo.config.model.includes('fast') ? 'Veo Fast' : 'Veo Quality'}</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="uppercase text-[10px] font-bold tracking-wider mb-0.5">Resolution</span>
                      <span className="text-slate-300">{activeVideo.config.resolution}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;