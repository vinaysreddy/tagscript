# MediaIQ - AI Transcript Analysis

A lightweight web application that analyzes `.txt` or `.srt` transcripts using OpenAI's GPT-4 to extract tags, create timestamped chapters, classify ad safety, and provide content-aware viewer retention analysis.

## 🚀 Features

- **File Upload**: Support for `.txt` and `.srt` files with drag-and-drop
- **AI Analysis**: Uses OpenAI GPT-4 for intelligent content analysis
- **Structured Results**: 
  - Tags and topics extraction
  - Timestamped chapter summaries
  - Ad safety classification (✅ Safe / ⚠️ Needs Review / ❌ Unsafe)
- **Content-Aware Viewer Retention Analysis**: 
  - Intelligent drop-off simulation based on actual transcript content
  - Factors in content length, complexity, ad safety, and chapter analysis
  - Provides actionable insights for content optimization
- **No Database**: Stateless application with no persistent storage
- **Modern UI**: Clean, responsive design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + OpenAI API
- **Deployment**: Ready for Vercel (frontend) and Render/Railway (backend)

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env and add your OpenAI API key
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will be available at `http://localhost:8000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
```

### API Endpoints

- `POST /analyze` - Analyze transcript
  - Request: `{"transcript": "your transcript text"}`
  - Response: `{"tags": [...], "chapters": [...], "ad_safety": "..."}`

- `GET /health` - Health check
- `GET /` - API info

## 📁 Project Structure

```
tagscript/
├── src/
│   ├── components/
│   │   ├── TranscriptUploader.jsx
│   │   ├── AnalysisResults.jsx
│   │   └── DropOffSimulator.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── backend/
│   ├── index.js
│   ├── package.json
│   └── env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

### Backend (Render/Railway)

1. Push your code to GitHub
2. Create a new service on Render/Railway
3. Set environment variables:
   - `OPENAI_API_KEY`
4. Deploy

## 💡 Usage

1. Open the application in your browser
2. Upload a `.txt` or `.srt` file or paste transcript text
3. Click "Analyze Transcript"
4. View the results:
   - Tags and topics
   - Chapter summaries with timestamps
   - Ad safety classification
   - Content-aware viewer retention analysis with insights

## 🎯 Example Output

```json
{
  "tags": ["therapy", "addiction", "family", "recovery"],
  "chapters": [
    {"start": "00:00", "summary": "Host introduces guest and topic"},
    {"start": "05:30", "summary": "Discussion of addiction struggles"},
    {"start": "15:45", "summary": "Family impact and support systems"}
  ],
  "ad_safety": "⚠️ Needs Review"
}
```

## 🧠 Content-Aware Analysis Features

### Viewer Retention Analysis
The application now provides intelligent viewer drop-off simulation based on:

- **Content Length**: Longer transcripts = higher potential drop-off
- **Ad Safety**: Unsafe content = increased viewer loss
- **Topic Complexity**: Technical/scientific content = steeper drop-off
- **Chapter Analysis**: Boring or complex chapters trigger drop-off spikes
- **Content Insights**: Actionable recommendations for content optimization

### Smart Insights
The system generates insights such as:
- ⚠️ Unsafe content may cause higher viewer drop-off
- 📚 Multiple topics detected - consider focusing content
- ⏱️ Long content detected - viewers may lose interest
- 📉 High drop-off rate - consider content pacing

## 🔒 Security

- No user authentication required
- No persistent data storage
- API key stored in environment variables
- CORS configured for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own applications.

## 🆘 Support

If you encounter any issues:

1. Check that your OpenAI API key is valid
2. Ensure both frontend and backend are running
3. Check the browser console for errors
4. Verify the backend logs for API errors

---

Built with ❤️ using React, Node.js, and OpenAI