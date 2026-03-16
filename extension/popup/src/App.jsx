import './App.css';
import { Coffee, ChartColumn, Settings, Bell } from 'lucide-react'
import { useState, useEffect } from 'react';

function App() {

  // This is for time
  const [scrollTime, setScrollTime] = useState(0);
  useEffect(() => {
    chrome.storage.local.get('scrollTime', function(result) {
      setScrollTime(result.scrollTime || 0);
    });
  }, []);


  // this is for site name
  const [currentSite, setcurrentSite] = useState("No site");
  useEffect(() => {
    chrome.storage.local.get('currentSite', function(result) {
      setcurrentSite(result.currentSite || "No site");
    });
  }, []);


  return(
    
    <div className="everything font-[Iosevka_Charon] text-2xl text-center w-96 min-h-[28rem] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-rose-200">
     <div className="h-1 bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300"></div> 
      <div className='header bg-gradient-to-r from-rose-200 to-rose-100 text-black-900 p-5 relative'>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #e11d48 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
        <h1 className='font-[Dancing_Script] text-4xl relative z-10 drop-shadow-sm'>Ditch The Scroll</h1>
      </div>

      <div className='greeting flex-1 bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d5] text-gray-700 p-6 space-y-3'>
        <div className='flex items-center justify-center gap-2'>
          <span className='font-bold text-2xl'>Hello</span>
          <span className='font-[Dancing_Script] text-3xl'>
            Shruti!
          </span>
        </div>
        
        <div className='bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-inner'>
          <p className='text-gray-800'>You've been scrolling on {currentSite} for</p>
          <p className='text-4xl font-bold text-rose-500 animate-pulse mt-1'>
            {scrollTime}
            <span className='text-2xl ml-1'>mins</span>
          </p>
        </div>
      </div>

      <div className='nudge bg-[#f5f0e6] text-gray-800 p-5 border-y-2 border-rose-200'>
        <div className='flex items-center justify-center gap-3'>
          <Bell 
            size={24} 
            className="text-rose-500" 
            style={{
              animation: 'ring 0.5s ease-in-out infinite'
            }}
          />
          <h3 className='font-medium'>Nudge coming your way!</h3>
          <Bell 
            size={24} 
            className="text-rose-500" 
            style={{
              animation: 'ring 0.5s ease-in-out infinite'
            }}
          />
        </div>
        <p className='text-sm mt-2 text-stone-500'>Please check your phone for a playful nudge</p>
      </div>

      <div className='buttons flex justify-center gap-10 bg-gradient-to-r from-rose-100 to-rose-200 p-5'>
        <div className="relative group">
          <button className="transform hover:scale-120 transition-all duration-200 hover:drop-shadow-lg">
            <Coffee size={32} color="#44403c" strokeWidth={1.5} />
          </button>
          <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-stone-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Take a Break
          </span>
        </div>

        <div className="relative group">
          <button className="transform hover:scale-120 transition-all duration-200 hover:drop-shadow-lg">
            <ChartColumn size={32} color="#44403c" strokeWidth={1.5} />
          </button>
          <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-stone-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            See your stats
          </span>
        </div>

        <div className="relative group">
          <button className="transform hover:scale-120 transition-all duration-200 hover:drop-shadow-lg">
            <Settings size={32} color="#44403c" strokeWidth={1.5} />
          </button>
          <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-stone-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Settings
          </span>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300"></div>

      <style>{`
        @keyframes ring {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

export default App;