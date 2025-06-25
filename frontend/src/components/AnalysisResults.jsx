const AnalysisResults = ({ results }) => {
    const getAdSafetyColor = (safety) => {
        if (safety.includes('✅')) return 'bg-green-100 text-green-800 border-green-200'
        if (safety.includes('⚠️')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        if (safety.includes('❌')) return 'bg-red-100 text-red-800 border-red-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md p-6 transition-colors duration-500 animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text mb-6">
                Analysis Results
            </h2>

            {/* Truncation Warning */}
            {results.warning && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg animate-fade-in">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Transcript Truncated
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>{results.warning}</p>
                                {results.original_length && results.analyzed_length && (
                                    <p className="mt-1">
                                        Analyzed {results.analyzed_length.toLocaleString()} of {results.original_length.toLocaleString()} characters
                                        ({Math.round((results.analyzed_length / results.original_length) * 100)}% of content)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tags Section */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">
                        Tags & Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {results.tags && results.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-dark-bg dark:text-dark-text border border-primary-200 dark:border-dark-border transition-colors duration-300"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Ad Safety Section */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">
                        Ad Safety
                    </h3>
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getAdSafetyColor(results.ad_safety)} transition-colors duration-500 bg-white dark:bg-dark-surface`}>
                        <span className="text-lg mr-2">
                            {results.ad_safety.includes('✅') && '✅'}
                            {results.ad_safety.includes('⚠️') && '⚠️'}
                            {results.ad_safety.includes('❌') && '❌'}
                        </span>
                        <span className="font-medium">
                            {results.ad_safety.replace(/[✅⚠️❌]/g, '').trim()}
                        </span>
                    </div>
                    {results.ad_safety_reason && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
                            {results.ad_safety_reason}
                        </div>
                    )}
                </div>

                {/* Chapters Section */}
                <div className="lg:col-span-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">
                        Chapter Summaries
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.chapters && results.chapters.map((chapter, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 border border-gray-200 dark:border-dark-border transition-colors duration-300"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    {chapter.start && (
                                        <span className="text-sm font-medium text-primary-600 dark:text-dark-accent bg-primary-50 dark:bg-dark-surface px-2 py-1 rounded">
                                            {chapter.start}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-dark-muted">
                                        Chapter {index + 1}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-dark-text leading-relaxed">
                                    {chapter.summary}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-primary-600 dark:text-dark-accent">
                            {results.tags ? results.tags.length : 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-dark-muted">Topics Identified</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-primary-600 dark:text-dark-accent">
                            {results.chapters ? results.chapters.length : 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-dark-muted">Chapters Created</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-primary-600 dark:text-dark-accent">
                            {results.ad_safety ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-dark-muted">Safety Analyzed</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnalysisResults 