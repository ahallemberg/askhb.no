import { useEffect } from 'react';
import Portfolio from './pages/Portfolio'
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {

  useEffect(() => {
    document.body.classList.add('bg-gray-100', 'dark:bg-gray-900');
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Portfolio/>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
