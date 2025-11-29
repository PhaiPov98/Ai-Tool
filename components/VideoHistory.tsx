import React from 'react';
import { GeneratedVideo } from '../types';
import { PlayIcon, DownloadIcon, FilmIcon } from './Icons';

interface VideoHistoryProps {
  videos: GeneratedVideo[];
  onSelect: (video: GeneratedVideo) => void;
  activeVideoId?: string;
}

export const VideoHistory: React.FC<VideoHistoryProps> = ({ videos, onSelect, activeVideoId }) => {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 border border-slate-800 rounded-lg bg-slate-900/50">
        <FilmIcon className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No videos yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 px-1">Library</h3>
      <div className="space-y-2">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => onSelect(video)}
            className={`
              group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border
              ${activeVideoId === video.id 
                ? 'bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {video.config.aspectRatio}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(video.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <p className="text-sm text-slate-200 line-clamp-2 mb-3 font-light leading-relaxed">
              {video.config.prompt}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
              <div className="flex items-center space-x-2">
                <button 
                  className={`p-1.5 rounded-full transition-colors ${activeVideoId === video.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}
                >
                  <PlayIcon className="w-3 h-3" />
                </button>
              </div>
              <a 
                href={video.url} 
                download={video.fileName}
                onClick={(e) => e.stopPropagation()}
                className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                title="Download"
              >
                <DownloadIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};