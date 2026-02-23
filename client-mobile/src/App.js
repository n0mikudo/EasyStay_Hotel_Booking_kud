import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import SearchPage from './pages/SearchPage';
import HotelListPage from './pages/HotelListPage';
import HotelDetailPage from './pages/HotelDetailPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import TabBar from './components/TabBar';
import './App.css';

const TAB_PATHS = ['/', '/hotels', '/chat', '/orders', '/profile'];

function App() {
  const location = useLocation();
  const showTabBar = TAB_PATHS.some(p => {
    if (p === '/') return location.pathname === '/';
    if (p === '/hotels') return location.pathname === '/hotels';
    return location.pathname.startsWith(p);
  });

  return (
    <ClientAuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/hotels" element={<HotelListPage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
        </Routes>
        {showTabBar && <TabBar />}
      </div>
    </ClientAuthProvider>
  );
}

export default App;
