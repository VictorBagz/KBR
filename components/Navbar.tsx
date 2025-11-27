
import React, { useState } from 'react';
import { Menu, X, Search, User, LogIn, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (page: 'home' | 'news' | 'fixtures' | 'profile') => void;
  currentPage: 'home' | 'news' | 'fixtures' | 'profile';
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Helper to handle navigation
  const handleNavClick = (target: string) => {
    setIsOpen(false);
    if (target === 'news') {
      onNavigate('news');
    } else if (target === 'fixtures') {
      onNavigate('fixtures');
    } else if (target === 'home') {
      onNavigate('home');
      window.scrollTo(0,0);
    } else if (target === 'profile') {
      onNavigate('profile');
    } else if (target === 'fantasy') {
      // Logic for scrolling to section on home page
      if (currentPage !== 'home') {
        onNavigate('home');
        // Allow render cycle to complete before scrolling
        setTimeout(() => {
          const element = document.getElementById(target);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const element = document.getElementById(target);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate('home');
    }
  };

  const navLinks = [
    { name: 'News', target: 'news' },
    { name: 'Fixtures & Results', target: 'fixtures' },
    { name: 'Fantasy', target: 'fantasy' },
    { name: 'Video', target: 'home' }, // Placeholder
    { name: 'Stats', target: 'home' }, // Placeholder
  ];

  const displayName = user?.user_metadata?.first_name 
    ? user.user_metadata.first_name 
    : user?.email?.split('@')[0];

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <nav className="sticky top-0 z-50 bg-rugby-950/90 backdrop-blur-md border-b border-rugby-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-rugby-accent rounded-br-lg rounded-tl-lg flex items-center justify-center font-bold text-white group-hover:bg-blue-600 transition-colors">
              K
            </div>
            <span className="font-bold text-xl tracking-tight text-white">KEYBOARD<span className="text-rugby-accent group-hover:text-blue-400 transition-colors"> </span>RUGBY</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.target)}
                  className={`${
                    (link.target === 'news' && currentPage === 'news') || 
                    (link.target === 'fixtures' && currentPage === 'fixtures') ||
                    (link.target === 'home' && currentPage === 'home')
                      ? 'text-white bg-rugby-800' 
                      : 'text-gray-300 hover:text-white hover:bg-rugby-800'
                  } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Icons / Auth */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Search size={20} />
            </button>
            
            {user ? (
               <button 
                 onClick={() => handleNavClick('profile')}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                   currentPage === 'profile' 
                    ? 'bg-rugby-800 border-rugby-700 text-white' 
                    : 'bg-transparent border-transparent hover:bg-rugby-800 text-gray-300 hover:text-white'
                 }`}
               >
                  <div className="w-8 h-8 bg-rugby-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {initial}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{displayName}</span>
               </button>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-rugby-accent hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-rugby-800 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-rugby-900 border-b border-rugby-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.target)}
                className="w-full text-left text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-rugby-800"
              >
                {link.name}
              </button>
            ))}
            <div className="border-t border-rugby-800 pt-3 mt-3">
               {user ? (
                  <button
                    onClick={() => handleNavClick('profile')}
                    className="w-full text-left text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-rugby-800 flex items-center gap-2"
                  >
                    <User size={18} /> Profile ({displayName})
                  </button>
               ) : (
                  <button
                    onClick={() => { setIsOpen(false); onOpenAuth(); }}
                    className="w-full text-left text-rugby-accent hover:text-white block px-3 py-2 rounded-md text-base font-bold hover:bg-rugby-800 flex items-center gap-2"
                  >
                    <LogIn size={18} /> Sign In / Join
                  </button>
               )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
