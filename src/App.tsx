import Portfolio from './pages/Portfolio'
import NotFound from './pages/NotFound'
import { Routes, Route } from 'react-router-dom';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Portfolio/>} />
            <Route path="*" element={<NotFound/>} />
        </Routes>
    )
}

export default App
