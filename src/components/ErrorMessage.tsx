import React from 'react'

interface ErrorMessageProps {
    message: string
    onRetry?: () => void
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Noe gikk galt</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {onRetry && (
                <button 
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                Prøv på nytt
                </button>
            )}
        </div>
    )
}

export default ErrorMessage