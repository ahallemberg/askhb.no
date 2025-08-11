import { useEffect } from 'react';
import Portfolio from './pages/Portfolio'

function App() {

  useEffect(() => {
    document.body.classList.add('bg-gray-100');
  }, [])

  return (
    <Portfolio/>
  )
}

export default App
