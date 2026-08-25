import { type FadeInProps } from '../types/props';

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0 }) => {
    return (
        <div className="fade-in-block" style={{ animationDelay: `${delay}ms` }}>
            {children}
        </div>
    );
};

export default FadeIn;
