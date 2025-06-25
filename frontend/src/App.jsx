/** Modernized App.jsx with dark mode toggle, animated transitions, and professional dashboard header. */
import { useState, useRef, useEffect } from 'react'
import TranscriptUploader from './components/TranscriptUploader'
import AnalysisResults from './components/AnalysisResults'
import ChunkedAnalysisDashboard from './components/ChunkedAnalysisDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'https://tagscript.onrender.com'

function App() {
    const [transcript, setTranscript] = useState('')
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [darkMode, setDarkMode] = useState(false)
    const resultsRef = useRef(null)

    // Scroll to results when loaded
    useEffect(() => {
        if (results && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [results])

    // Toggle dark mode by toggling class on html element
    useEffect(() => {
        const root = window.document.documentElement
        if (darkMode) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }, [darkMode])

    const handleAnalysis = async (transcriptText, timestamps = []) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcript: transcriptText,
                    timestamps: timestamps
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))

                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again, or use a shorter transcript.')
                } else if (response.status === 413) {
                    throw new Error('Transcript too long. Please use a shorter transcript or split it into smaller parts.')
                } else {
                    throw new Error(errorData.error || 'Analysis failed. Please try again.')
                }
            }

            const data = await response.json()

            // Add transcript length to the results for the drop-off simulator
            const resultsWithLength = {
                ...data,
                transcriptLength: transcriptText.length
            }

            setResults(resultsWithLength)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 bg-gray-50 dark:bg-dark-bg`}>
            <div className="container mx-auto px-4 py-8">
                <header className="header-glow flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-dark-text animate-fade-in">
                            TagScript
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-dark-muted animate-fade-in delay-100">
                            AI-powered transcript analysis for content creators
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <span className="text-gray-600 dark:text-dark-muted text-sm md:mr-4">
                            Developed by{' '}
                            <a
                                href="https://www.linkedin.com/in/vinay-sekhar-reddy-01093b188/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-dark-accent hover:underline font-semibold"
                            >
                                Vinay S Reddy
                            </a>
                        </span>
                        <button
                            onClick={() => setDarkMode(dm => !dm)}
                            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text shadow hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-dark-accent"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? (
                                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
                            ) : (
                                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 4.95l-.71-.71M4.05 4.93l-.71-.71" /></svg>
                            )}
                            <span className="font-semibold">{darkMode ? 'Dark' : 'Light'} Mode</span>
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto">
                    <TranscriptUploader
                        onTranscriptChange={setTranscript}
                        onAnalyze={handleAnalysis}
                        loading={loading}
                    />

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg animate-fade-in">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Analysis Error
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="mt-6 text-center animate-fade-in">
                            <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg animate-pulse">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing transcript...
                            </div>
                        </div>
                    )}

                    <div ref={resultsRef} className="scroll-mt-24">
                        {results && (
                            <div className="mt-8 space-y-8 animate-fade-in">
                                {/* Show chunked dashboard if available, otherwise show regular results */}
                                {results.chunk_analysis ? (
                                    <ChunkedAnalysisDashboard results={results} />
                                ) : (
                                    <AnalysisResults results={results} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App 