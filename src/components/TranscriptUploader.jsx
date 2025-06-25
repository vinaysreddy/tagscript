import { useState, useRef } from 'react'

const TranscriptUploader = ({ onTranscriptChange, onAnalyze, loading }) => {
    const [file, setFile] = useState(null)
    const [transcriptText, setTranscriptText] = useState('')
    const [timestamps, setTimestamps] = useState([])
    const fileInputRef = useRef(null)

    const handleFileUpload = (event) => {
        const uploadedFile = event.target.files[0]
        if (!uploadedFile) return

        setFile(uploadedFile)

        const reader = new FileReader()
        reader.onload = (e) => {
            let content = e.target.result
            let extractedTimestamps = []

            // Handle SRT files - extract timestamps and clean content
            if (uploadedFile.name.endsWith('.srt')) {
                const srtData = parseSrtContent(content)
                content = srtData.text
                extractedTimestamps = srtData.timestamps
            } else {
                // For TXT files, check if they contain timestamps
                const textData = parseTextContent(content)
                content = textData.text
                extractedTimestamps = textData.timestamps
            }

            setTranscriptText(content)
            setTimestamps(extractedTimestamps)
            onTranscriptChange(content, extractedTimestamps)
        }
        reader.readAsText(uploadedFile)
    }

    const parseSrtContent = (content) => {
        const lines = content.split('\n')
        const timestamps = []
        let text = ''
        let currentTimestamp = null

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()

            // Check for timestamp line (format: 00:00:00,000 --> 00:00:00,000)
            const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/)

            if (timestampMatch) {
                const startTime = timestampMatch[1] + ':' + timestampMatch[2].padStart(3, '0')
                const endTime = timestampMatch[3] + ':' + timestampMatch[4].padStart(3, '0')
                currentTimestamp = { start: startTime, end: endTime }
                timestamps.push(currentTimestamp)
            } else if (line && !line.match(/^\d+$/) && !line.match(/^[A-Z][a-z]+:\s*$/)) {
                // This is actual text content (not subtitle number or speaker marker)
                if (currentTimestamp) {
                    text += line + ' '
                }
            }
        }

        return {
            text: text.trim(),
            timestamps: timestamps
        }
    }

    const parseTextContent = (content) => {
        // Check if the text contains timestamps in various formats
        const timestampPatterns = [
            // HH:MM:SS format
            /(\d{1,2}):(\d{2}):(\d{2})/g,
            // MM:SS format
            /(\d{1,2}):(\d{2})/g
        ]

        let hasTimestamps = false
        const timestamps = []

        // Check if any timestamp patterns exist in the text
        for (const pattern of timestampPatterns) {
            const matches = content.match(pattern)
            if (matches && matches.length > 0) {
                hasTimestamps = true
                break
            }
        }

        if (hasTimestamps) {
            // Extract timestamps and their positions
            const lines = content.split('\n')
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim()

                // Look for timestamp at the beginning of lines
                const timestampMatch = line.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
                if (timestampMatch) {
                    let timeStr
                    if (timestampMatch[3]) {
                        // HH:MM:SS format
                        timeStr = `${timestampMatch[1].padStart(2, '0')}:${timestampMatch[2]}:${timestampMatch[3]}`
                    } else {
                        // MM:SS format
                        timeStr = `${timestampMatch[1].padStart(2, '0')}:${timestampMatch[2]}`
                    }
                    timestamps.push({ start: timeStr, end: timeStr })
                }
            }
        }

        return {
            text: content,
            timestamps: timestamps
        }
    }

    const handleTextChange = (event) => {
        const text = event.target.value
        setTranscriptText(text)

        // Check if the manually entered text contains timestamps
        const textData = parseTextContent(text)
        setTimestamps(textData.timestamps)
        onTranscriptChange(text, textData.timestamps)
    }

    const handleAnalyze = () => {
        if (transcriptText.trim()) {
            onAnalyze(transcriptText, timestamps)
        }
    }

    const handleDrop = (event) => {
        event.preventDefault()
        const droppedFile = event.dataTransfer.files[0]
        if (droppedFile && (droppedFile.name.endsWith('.txt') || droppedFile.name.endsWith('.srt'))) {
            fileInputRef.current.files = event.dataTransfer.files
            handleFileUpload({ target: { files: [droppedFile] } })
        }
    }

    const handleDragOver = (event) => {
        event.preventDefault()
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md p-6 transition-colors duration-500">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text mb-4">
                Upload Transcript
            </h2>

            <div
                className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-dark-accent transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.srt"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <div className="space-y-4">
                    <div className="text-gray-600 dark:text-dark-muted">
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-muted" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-dark-accent transition-colors"
                        >
                            Choose File
                        </button>
                        <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">
                            or drag and drop
                        </p>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-dark-muted">
                        Supports .txt and .srt files
                    </p>
                </div>
            </div>

            {file && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-dark-bg border border-green-200 dark:border-dark-border rounded-lg">
                    <p className="text-green-700 dark:text-green-300 text-sm">
                        ✓ {file.name} uploaded successfully
                    </p>
                </div>
            )}

            <div className="mt-6">
                <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                    Transcript Preview
                </label>
                <textarea
                    id="transcript"
                    value={transcriptText}
                    onChange={handleTextChange}
                    placeholder="Paste your transcript here or upload a file..."
                    className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-dark-accent focus:border-transparent resize-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
            </div>

            <div className="mt-6">
                <button
                    onClick={handleAnalyze}
                    disabled={!transcriptText.trim() || loading}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 dark:hover:bg-dark-accent disabled:bg-gray-400 dark:disabled:bg-dark-border disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? 'Analyzing...' : 'Analyze Transcript'}
                </button>
            </div>
        </div>
    )
}

export default TranscriptUploader 