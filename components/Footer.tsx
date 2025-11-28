import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: 'home' | 'news' | 'fixtures' | 'profile' | 'admin' | 'article') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLatestNewsClick = () => {
    onNavigate('news');
  };

  const handleMatchCenterClick = () => {
    onNavigate('home');
    // Scroll to match center section after navigation
    setTimeout(() => {
      const matchCenterSection = document.getElementById('match-center-section');
      if (matchCenterSection) {
        matchCenterSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  };
  return (
    <footer className="bg-rugby-950 border-t border-rugby-900 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-rugby-accent rounded-br-lg rounded-tl-lg flex items-center justify-center font-bold text-white">K</div>
                <span className="font-bold text-xl text-white">KEYBOARD<span className="text-rugby-accent"> RUGBY</span></span>
             </div>
             <p className="text-gray-400 text-sm max-w-xs">
               The ultimate destination for rugby enthusiasts. Breaking news, live scores, fantasy leagues, and expert analysis powered by Isametrics.
             </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={handleLatestNewsClick} className="hover:text-rugby-accent transition-colors">Latest News</button></li>
              <li><button onClick={handleMatchCenterClick} className="hover:text-rugby-accent transition-colors">Match Center</button></li>
              <li><a href="#" className="hover:text-rugby-accent">Fantasy League</a></li>
              <li><a href="#" className="hover:text-rugby-accent">Video Highlights</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Youtube size={20} /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-rugby-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; 2024 Keyboard Rugby. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">Terms of Service</a>
            <a href="#" className="hover:text-gray-300">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};