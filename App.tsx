import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroNews } from './components/HeroNews';
import { NewsGrid } from './components/NewsGrid';
import { NewsPage } from './components/NewsPage';
import { MatchCenter } from './components/MatchCenter';
import { FixturesPage } from './components/FixturesPage';
import { FantasyCTA } from './components/FantasyCTA';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider } from './context/AuthContext';

type Page = 'home' | 'news' | 'fixtures' | 'profile' | 'admin';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-rugby-950 text-slate-100 font-sans selection:bg-rugby-accent selection:text-white">
      {/* Hide Navbar on Admin Dashboard for focus */}
      {currentPage !== 'admin' && (
        <Navbar 
          onNavigate={handleNavigate} 
          currentPage={currentPage} 
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}
      
      <main>
        {currentPage === 'home' && (
          <>
            <HeroNews />
            <NewsGrid />
            <MatchCenter onNavigate={handleNavigate} />
            <FantasyCTA />
          </>
        )}
        {currentPage === 'news' && (
          <NewsPage />
        )}
        {currentPage === 'fixtures' && (
          <FixturesPage />
        )}
        {currentPage === 'profile' && (
          <ProfilePage onNavigate={handleNavigate} />
        )}
        {currentPage === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </main>
      
      {currentPage !== 'admin' && <Footer />}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;