import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const DropOffSimulator = ({ results }) => {
    // Generate content-aware drop-off data based on analysis results
    const generateContentAwareDropOffData = () => {
        const data = []
        let viewers = 1000
        let time = 0

        // Base parameters from content analysis
        const transcriptLength = results?.transcriptLength || 1000 // characters
        const adSafety = results?.ad_safety || "⚠️ Needs Review"
        const tags = results?.tags || []
        const chapters = results?.chapters || []

        // Calculate content complexity score (0-1)
        const complexityScore = calculateComplexityScore(tags, chapters)

        // Calculate drop-off factors
        const baseDropRate = 0.015 // 1.5% base drop per minute
        const lengthFactor = Math.min(transcriptLength / 2000, 1) * 0.01 // Longer content = more drop-off
        const safetyFactor = getSafetyFactor(adSafety)
        const complexityFactor = complexityScore * 0.02 // Complex content = more drop-off

        // Calculate total duration based on transcript length
        const estimatedDuration = Math.max(5, Math.min(60, Math.floor(transcriptLength / 100))) // 5-60 minutes

        // Generate drop-off pattern with content-aware spikes
        for (let i = 0; i <= estimatedDuration; i++) {
            // Base drop-off rate
            let dropRate = baseDropRate + lengthFactor + safetyFactor + complexityFactor

            // Add content-specific drop-off spikes
            const chapterDrop = getChapterDropRate(i, chapters, estimatedDuration)
            dropRate += chapterDrop

            // Add some randomness (±20%)
            const randomFactor = 0.8 + Math.random() * 0.4
            dropRate *= randomFactor

            // Ensure minimum viewers
            const newViewers = Math.max(50, Math.round(viewers * (1 - dropRate)))

            data.push({
                time: `${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`,
                viewers: newViewers,
                percentage: Math.round((newViewers / 1000) * 100),
                dropRate: Math.round(dropRate * 1000) / 10 // Drop rate in percentage
            })

            viewers = newViewers
            time = i
        }

        return data
    }

    const calculateComplexityScore = (tags, chapters) => {
        // Analyze tags for complexity indicators
        const complexKeywords = [
            'technical', 'scientific', 'academic', 'research', 'analysis',
            'statistics', 'data', 'theory', 'methodology', 'philosophy',
            'politics', 'economics', 'finance', 'legal', 'medical'
        ]

        const complexTagCount = tags.filter(tag =>
            complexKeywords.some(keyword =>
                tag.toLowerCase().includes(keyword)
            )
        ).length

        return Math.min(complexTagCount / 3, 1) // Normalize to 0-1
    }

    const getSafetyFactor = (adSafety) => {
        switch (adSafety) {
            case '✅ Safe':
                return -0.005 // Lower drop-off for safe content
            case '⚠️ Needs Review':
                return 0.005 // Moderate drop-off
            case '❌ Unsafe':
                return 0.015 // Higher drop-off for unsafe content
            default:
                return 0.005
        }
    }

    const getChapterDropRate = (currentMinute, chapters, totalDuration) => {
        if (!chapters || chapters.length === 0) return 0

        // Find if current minute corresponds to a chapter boundary
        const chapterTime = chapters.find(chapter => {
            const [minutes, seconds] = chapter.start.split(':').map(Number)
            const chapterStartMinute = minutes + seconds / 60
            return Math.abs(currentMinute - chapterStartMinute) < 1
        })

        if (chapterTime) {
            // Analyze chapter summary for potential drop-off indicators
            const summary = chapterTime.summary.toLowerCase()
            const dropIndicators = [
                'boring', 'slow', 'technical', 'complicated', 'difficult',
                'confusing', 'long', 'detailed', 'complex', 'dry'
            ]

            const hasDropIndicators = dropIndicators.some(indicator =>
                summary.includes(indicator)
            )

            return hasDropIndicators ? 0.03 : 0.01 // Higher drop-off for boring chapters
        }

        return 0
    }

    const data = generateContentAwareDropOffData()

    // Calculate insights based on the data
    const startingViewers = data[0]?.viewers || 0
    const endingViewers = data[data.length - 1]?.viewers || 0
    const retentionRate = Math.round(((startingViewers - endingViewers) / startingViewers) * 100)
    const avgDropRate = data.reduce((sum, point) => sum + point.dropRate, 0) / data.length

    // Generate insights based on content analysis
    const generateInsights = () => {
        const insights = []

        if (results?.ad_safety === '❌ Unsafe') {
            insights.push('⚠️ Unsafe content may cause higher viewer drop-off')
        }

        if (results?.tags?.length > 4) {
            insights.push('📚 Multiple topics detected - consider focusing content')
        }

        if (data.length > 30) {
            insights.push('⏱️ Long content detected - viewers may lose interest')
        }

        if (avgDropRate > 3) {
            insights.push('�� High drop-off rate - consider content pacing')
        }

        return insights.length > 0 ? insights : ['📊 Content analysis complete']
    }

    const insights = generateInsights()

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Content-Aware Viewer Retention Analysis
            </h2>
            <p className="text-gray-600 mb-6">
                Viewer drop-off simulation based on your transcript analysis
            </p>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="time"
                            stroke="#6b7280"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value, name) => [
                                `${value} viewers (${Math.round((value / 1000) * 100)}%)`,
                                'Viewers'
                            ]}
                            labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="viewers"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                        {startingViewers}
                    </div>
                    <div className="text-sm text-blue-600">Starting Viewers</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                        {endingViewers}
                    </div>
                    <div className="text-sm text-green-600">Ending Viewers</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                        {retentionRate}%
                    </div>
                    <div className="text-sm text-purple-600">Drop-off Rate</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">
                        {Math.round(avgDropRate * 10) / 10}%
                    </div>
                    <div className="text-sm text-orange-600">Avg Drop/Min</div>
                </div>
            </div>

            {/* Content Insights */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Content Insights</h3>
                <div className="space-y-2">
                    {insights.map((insight, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                            <span className="mr-2">{insight}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DropOffSimulator 