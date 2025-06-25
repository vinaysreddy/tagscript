# MediaIQ Deployment Guide

This guide will help you deploy MediaIQ to production environments.

## 🚀 Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (free tier available)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mediaiq.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Click "Deploy"

3. **Environment Variables** (if needed)
   - In Vercel dashboard, go to your project settings
   - Add any environment variables if you're using them in the frontend

## 🔧 Backend Deployment (Render)

### Prerequisites
- GitHub account
- Render account (free tier available)
- OpenAI API key

### Steps

1. **Prepare Backend for Deployment**
   Create a `render.yaml` file in the root directory:
   ```yaml
   services:
     - type: web
       name: mediaiq-backend
       env: python
       plan: free
       buildCommand: cd backend && pip install -r requirements.txt
       startCommand: cd backend && python main.py
       envVars:
         - key: OPENAI_API_KEY
           sync: false
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `mediaiq-backend`
     - Environment: `Python 3`
     - Build Command: `cd backend && pip install -r requirements.txt`
     - Start Command: `cd backend && python main.py`
   - Add environment variable:
     - Key: `OPENAI_API_KEY`
     - Value: Your OpenAI API key
   - Click "Create Web Service"

3. **Update Frontend Configuration**
   After deployment, update the frontend to use the production backend URL:
   
   In `vite.config.js`, update the proxy target:
   ```javascript
   proxy: {
     '/api': {
       target: 'https://your-backend-url.onrender.com',
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/api/, '')
     }
   }
   ```

## 🌐 Alternative Backend Deployment (Railway)

### Steps

1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Python and deploy

2. **Configure Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add `OPENAI_API_KEY` with your API key

3. **Update Start Command**
   - In Railway dashboard, go to "Settings"
   - Set start command to: `cd backend && python main.py`

## 🔒 Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key

### Optional
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

## 📊 Monitoring

### Health Checks
- Backend health endpoint: `GET /health`
- Returns: `{"status": "healthy", "openai_key_configured": true/false}`

### Logs
- Vercel: Available in dashboard under "Functions" tab
- Render: Available in dashboard under "Logs" tab
- Railway: Available in dashboard under "Deployments" tab

## 🔄 Continuous Deployment

Both Vercel and Render/Railway support automatic deployments:
- Every push to `main` branch triggers a new deployment
- Preview deployments are created for pull requests

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if `OPENAI_API_KEY` is set
   - Verify Python dependencies are installed
   - Check logs for error messages

2. **Frontend can't connect to backend**
   - Verify backend URL is correct
   - Check CORS configuration
   - Ensure backend is running and accessible

3. **OpenAI API errors**
   - Verify API key is valid
   - Check API usage limits
   - Ensure sufficient credits

### Debug Commands

```bash
# Test backend locally
python test_backend.py

# Check backend logs
curl http://localhost:8000/health

# Test frontend build
npm run build
```

## 📈 Scaling

### Free Tier Limits
- Vercel: 100GB bandwidth/month
- Render: 750 hours/month
- Railway: $5 credit/month

### Upgrading
- Vercel: Pro plan ($20/month)
- Render: Paid plans start at $7/month
- Railway: Pay-as-you-go

## 🔐 Security Best Practices

1. **API Keys**
   - Never commit API keys to Git
   - Use environment variables
   - Rotate keys regularly

2. **CORS**
   - Configure CORS for production domains
   - Don't use `allow_origins=["*"]` in production

3. **Rate Limiting**
   - Consider adding rate limiting for the `/analyze` endpoint
   - Monitor API usage

## 📞 Support

If you encounter deployment issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test locally first
4. Check platform-specific documentation

---

Happy deploying! 🚀 