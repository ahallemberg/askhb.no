import { useEffect, useState } from 'react';
import { type FadeInProps } from '../types/props';

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);
    
    return (
        <div
            className={`transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            >
            {children}
        </div>
    );
};

export default FadeIn;