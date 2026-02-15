import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import HotelListPage from './pages/HotelListPage';
import HotelDetailPage from './pages/HotelDetailPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/hotels" element={<HotelListPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
