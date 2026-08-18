import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import DarkModeToggle from '../components/DarkModeToggle';

const NotFound: React.FC = () => {
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
            <div className="container mx-auto px-4 py-8 max-w-6xl flex justify-end">
                <DarkModeToggle />
            </div>

            <FadeIn>
                <main className="container mx-auto px-4 max-w-6xl text-center py-24">
                    <p className="text-5xl font-bold mb-4 dark:text-white">404</p>
                    <h1 className="text-2xl font-bold mb-2 dark:text-white">Page not found</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        There is nothing at this address.
                    </p>
                    <Link
                        to="/"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        ← Back to the portfolio
                    </Link>
                </main>
            </FadeIn>
        </div>
    );
};

export default NotFound;
