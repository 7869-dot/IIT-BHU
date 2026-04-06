import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import GalaxyPage from './GalaxyPage';
import ProfilePage from './ProfilePage';
import ArchivePage from './ArchivePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/galaxy" element={<GalaxyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/archive" element={<ArchivePage />} />
      </Routes>
    </Router>
  );
}

export default App;
