import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'

const ChunkedAnalysisDashboard = ({ results }) => {
    const [selectedChunk, setSelectedChunk] = useState(0)

    if (!results.chunk_analysis) {
        return null // Only show for chunked analysis
    }

    const chunkData = results.chunk_analysis
    const totalChunks = results.total_chunks

    // Prepare data for charts
    const sentimentData = [
        { name: 'Positive', value: chunkData.filter(chunk => chunk.sentiment === 'positive').length, color: '#10B981' },
        { name: 'Neutral', value: chunkData.filter(chunk => chunk.sentiment === 'neutral').length, color: '#6B7280' },
        { name: 'Negative', value: chunkData.filter(chunk => chunk.sentiment === 'negative').length, color: '#EF4444' }
    ]

    const safetyData = [
        { name: 'Safe', value: chunkData.filter(chunk => chunk.ad_safety === '✅ Safe').length, color: '#10B981' },
        { name: 'Needs Review', value: chunkData.filter(chunk => chunk.ad_safety === '⚠️ Needs Review').length, color: '#F59E0B' },
        { name: 'Unsafe', value: chunkData.filter(chunk => chunk.ad_safety === '❌ Unsafe').length, color: '#EF4444' }
    ]

    const chunkProgressData = chunkData.map((chunk, index) => ({
        chunk: `Chunk ${index + 1}`,
        length: chunk.chunkLength,
        tags: chunk.tags?.length || 0,
        topics: chunk.key_topics?.length || 0
    }))

    // Filter out 0% slices to prevent overlapping labels
    const filteredSentimentData = sentimentData.filter(entry => entry.value > 0)
    const filteredSafetyData = safetyData.filter(entry => entry.value > 0)

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-50'
            case 'negative': return 'text-red-600 bg-red-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const getSafetyColor = (safety) => {
        if (safety.includes('✅')) return 'text-green-600 bg-green-50'
        if (safety.includes('⚠️')) return 'text-yellow-600 bg-yellow-50'
        if (safety.includes('❌')) return 'text-red-600 bg-red-50'
        return 'text-gray-600 bg-gray-50'
    }

    const getSafetyExplanation = (safety, reason) => {
        if (reason) {
            return reason; // Use the specific reason from the analysis
        }

        // Fallback to generic explanations if no specific reason provided
        switch (safety) {
            case '✅ Safe':
                return 'Family-friendly content suitable for all advertisers'
            case '⚠️ Needs Review':
                return 'Contains mature themes or sensitive topics requiring human review'
            case '❌ Unsafe':
                return 'Explicit content or highly controversial topics that most advertisers avoid'
            default:
                return 'Content safety level not determined'
        }
    }

    const getSentimentExplanation = (sentiment) => {
        switch (sentiment) {
            case 'positive':
                return 'Uplifting, encouraging, or optimistic content'
            case 'neutral':
                return 'Factual, balanced, or informational content'
            case 'negative':
                return 'Critical, concerning, or pessimistic content'
            default:
                return 'Sentiment not determined'
        }
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md p-6 transition-colors duration-500 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text">
                    Comprehensive Analysis Dashboard
                </h2>
                <div className="text-sm text-gray-500 dark:text-dark-muted">
                    {totalChunks} chunks analyzed • {results.original_length.toLocaleString()} characters
                </div>
            </div>

            {/* Analysis Method Info */}
            {results.warning && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Chunked Analysis Complete
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>{results.warning}</p>
                                <p className="mt-1">
                                    Analyzed {results.analyzed_length.toLocaleString()} of {results.original_length.toLocaleString()} characters
                                    ({Math.round((results.analyzed_length / results.original_length) * 100)}% coverage)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalChunks}</div>
                    <div className="text-sm text-gray-600">Chunks Analyzed</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{results.tags?.length || 0}</div>
                    <div className="text-sm text-gray-600">Combined Tags</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{results.chapters?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Chapters</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{results.key_topics?.length || 0}</div>
                    <div className="text-sm text-gray-600">Key Topics</div>
                </div>
            </div>

            {/* Charts Section - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Sentiment Distribution */}
                <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-6 transition-colors duration-500 animate-fade-in overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-border">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">Sentiment Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={filteredSentimentData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {filteredSentimentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} chunks`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Sentiment Explanations */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="font-medium text-green-400 dark:text-green-300">Positive:</span>
                            <span className="ml-2 text-gray-600 dark:text-dark-muted">Uplifting, encouraging, or optimistic content</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                            <span className="font-medium text-gray-400 dark:text-gray-300">Neutral:</span>
                            <span className="ml-2 text-gray-600 dark:text-dark-muted">Factual, balanced, or informational content</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="font-medium text-red-400 dark:text-red-300">Negative:</span>
                            <span className="ml-2 text-gray-600 dark:text-dark-muted">Critical, concerning, or pessimistic content</span>
                        </div>
                    </div>
                </div>

                {/* Safety Distribution */}
                <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-6 transition-colors duration-500 animate-fade-in overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-border">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">Ad Safety Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={filteredSafetyData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {filteredSafetyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} chunks`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Safety Explanations */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="font-medium text-green-400 dark:text-green-300">Safe:</span>
                            <span className="ml-2 text-gray-600 dark:text-dark-muted">Family-friendly content suitable for all advertisers</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="font-medium text-yellow-400 dark:text-yellow-300">Needs Review:</span>
                            <span className="ml-2 text-gray-600 dark:text-dark-muted">Contains mature themes or sensitive topics requiring human review</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="font-medium text-red-400 dark:text-red-300">Unsafe:</span>
                            <span className="ml-2 text-gray-600 dark:text-dark-muted">Explicit content or highly controversial topics that most advertisers avoid</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chunk Progress Chart */}
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-6 mb-8 transition-colors duration-500 animate-fade-in overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-border">
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">Chunk Analysis Overview</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chunkProgressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="chunk" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="length" fill="#3B82F6" name="Characters" />
                            <Bar dataKey="tags" fill="#10B981" name="Tags" />
                            <Bar dataKey="topics" fill="#F59E0B" name="Topics" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chunk Selector */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">Individual Chunk Analysis</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {chunkData.map((chunk, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedChunk(index)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedChunk === index
                                ? 'bg-primary-600 text-white dark:bg-dark-accent dark:text-dark-bg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface'}
                                `}
                        >
                            Chunk {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Chunk Details */}
            {chunkData[selectedChunk] && (
                <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-6 transition-colors duration-500 animate-fade-in overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">
                                Chunk {selectedChunk + 1} Details
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">Length:</span>
                                    <span className="ml-2 text-sm text-gray-900 dark:text-dark-text">
                                        {chunkData[selectedChunk].chunkLength.toLocaleString()} characters
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">Sentiment:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getSentimentColor(chunkData[selectedChunk].sentiment)} dark:bg-dark-bg dark:text-dark-text`}>
                                        {chunkData[selectedChunk].sentiment}
                                    </span>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-dark-muted">
                                        {getSentimentExplanation(chunkData[selectedChunk].sentiment)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">Ad Safety:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getSafetyColor(chunkData[selectedChunk].ad_safety)} dark:bg-dark-bg dark:text-dark-text`}>
                                        {chunkData[selectedChunk].ad_safety}
                                    </span>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-dark-muted">
                                        {getSafetyExplanation(chunkData[selectedChunk].ad_safety, chunkData[selectedChunk].ad_safety_reason)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">Content Analysis</h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">Tags:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {chunkData[selectedChunk].tags?.map((tag, tagIndex) => (
                                            <span key={tagIndex} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded dark:bg-dark-bg dark:text-dark-text dark:border dark:border-dark-border">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">Key Topics:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {chunkData[selectedChunk].key_topics?.map((topic, topicIndex) => (
                                            <span key={topicIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded dark:bg-dark-bg dark:text-green-300 dark:border dark:border-dark-border">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">Chapters:</span>
                                    <div className="mt-1 space-y-1">
                                        {chunkData[selectedChunk].chapters?.map((chapter, chapterIndex) => (
                                            <div key={chapterIndex} className="text-xs text-gray-700 dark:text-dark-text">
                                                {chapter.start && (
                                                    <span className="font-medium">{chapter.start}</span>
                                                )}
                                                {chapter.start && ': '}
                                                {chapter.summary}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChunkedAnalysisDashboard 