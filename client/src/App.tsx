import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';

function AppInner() {
  useSocket(); // Initialize socket connection
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppInner />;
}
