import { useEffect } from 'react';
import Portfolio from './pages/Portfolio'
import NotFound from './pages/NotFound'
import { Routes, Route } from 'react-router-dom';

function App() {
    
    useEffect(() => {
        document.body.classList.add('bg-gray-100', 'dark:bg-gray-900');
    }, [])
    
    return (
        <Routes>
            <Route path="/" element={<Portfolio/>} />
            <Route path="*" element={<NotFound/>} />
        </Routes>
    )
}

export default App