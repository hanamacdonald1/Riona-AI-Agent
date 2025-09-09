# Riona AI Agent - Deployment Guide

## 🚀 Quick Start

The Riona AI Agent is now fully set up and ready to use! The application is currently running and accessible at:

**🌐 Live Application URL**: [https://3000-ittpsz4yrko73bupkgo84-6532622b.e2b.dev](https://3000-ittpsz4yrko73bupkgo84-6532622b.e2b.dev)

**📊 API Status Endpoint**: [https://3000-ittpsz4yrko73bupkgo84-6532622b.e2b.dev/api/status](https://3000-ittpsz4yrko73bupkgo84-6532622b.e2b.dev/api/status)

## 📋 What's Been Set Up

### ✅ Core Infrastructure
- **Web Server**: Express.js application running on port 3000
- **Process Manager**: PM2 for production-grade process management
- **Frontend Dashboard**: React-style dashboard for monitoring and management
- **API Endpoints**: RESTful API for all agent operations
- **Security**: Helmet.js, CORS, and session management configured

### ✅ Environment Configuration
- **Development Environment**: `.env` file created with development settings
- **Environment Template**: `.env.example` with all required variables documented
- **PM2 Configuration**: `ecosystem.config.js` for production deployment
- **Database Setup**: MongoDB connection with fallback for standalone operation

### ✅ Directory Structure
```
/home/user/webapp/
├── frontend/dist/          # Web dashboard files
├── src/                    # TypeScript source code
├── build/                  # Compiled JavaScript
├── logs/                   # Application logs
├── cookies/               # Session cookies storage
├── data/training/         # AI training data
├── .env                   # Environment variables
├── .env.example          # Environment template
├── ecosystem.config.js   # PM2 configuration
└── package.json          # Dependencies
```

## 🛠 Configuration

### Environment Variables Setup

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your credentials in `.env`**:
   ```bash
   # Instagram credentials
   IGusername=your_instagram_username
   IGpassword=your_instagram_password
   
   # Twitter credentials  
   Xusername=your_twitter_username
   Xpassword=your_twitter_password
   
   # Google AI API key (for content generation)
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   
   # MongoDB URI (optional)
   MONGODB_URI=mongodb://localhost:27017/riona-ai-agent
   ```

### MongoDB Setup (Optional)

The application can run with or without MongoDB. To use the full database features:

1. **Using Docker** (recommended):
   ```bash
   docker run -d -p 27017:27017 --name riona-mongodb \
     -v mongodb_data:/data/db \
     mongodb/mongodb-community-server:latest
   ```

2. **Using local MongoDB**:
   - Install MongoDB on your system
   - Start the MongoDB service
   - Update `MONGODB_URI` in `.env`

## 🚀 Running the Application

### Development Mode
```bash
# Install dependencies
npm install

# Build the application
npm run start

# Or use PM2 for production-like environment
npx pm2 start ecosystem.config.js --env development
```

### Production Mode
```bash
# Build the application
npx tsc && npm run postbuild

# Start with PM2
npx pm2 start ecosystem.config.js --env production

# Monitor the application
npx pm2 status
npx pm2 logs
```

### PM2 Commands
```bash
# Check status
npx pm2 status

# View logs
npx pm2 logs --nostream

# Restart application
npx pm2 restart riona-ai-agent

# Stop application
npx pm2 stop riona-ai-agent

# Delete application from PM2
npx pm2 delete riona-ai-agent
```

## 📡 API Endpoints

### Authentication
- `POST /api/login` - Login with Instagram credentials
- `GET /api/me` - Check authentication status
- `POST /api/logout` - Logout

### Instagram Operations
- `POST /api/interact` - Interact with Instagram posts
- `POST /api/dm` - Send direct message
- `POST /api/dm-file` - Send messages from file
- `POST /api/scrape-followers` - Scrape followers list

### System Operations
- `GET /api/status` - Check system status
- `DELETE /api/clear-cookies` - Clear Instagram cookies
- `POST /api/exit` - Graceful shutdown

## 🤖 AI Agent Features

### Content Generation
The AI agent can generate engaging content using Google's Generative AI:
- Instagram captions
- Comment responses  
- Twitter tweets
- Personalized messages

### Training Options
Train the AI with your content:

1. **YouTube Video Training**:
   ```bash
   npm run train:youtube
   ```

2. **Audio File Training**:
   ```bash
   npm run train:audio
   ```

3. **Website/Link Training**:
   ```bash
   npm run train:link
   ```

### Character Profiles
Available character profiles:
- `ArcanEdge.System.Agent.json` - Default AI agent
- `elon.character.json` - Elon Musk style
- `sample.character.json` - Sample character template

## 🔒 Security Features

- **Session Management**: Secure cookie-based authentication
- **CORS Protection**: Cross-origin request protection  
- **Helmet.js**: Security headers
- **Rate Limiting**: API rate limiting (configurable)
- **Input Validation**: Request validation middleware

## 📊 Monitoring & Logs

### Log Files
- `logs/combined.log` - All application logs
- `logs/out.log` - Standard output logs
- `logs/error.log` - Error logs

### Monitoring Dashboard
Access the web dashboard at: [https://3000-ittpsz4yrko73bupkgo84-6532622b.e2b.dev](https://3000-ittpsz4yrko73bupkgo84-6532622b.e2b.dev)

Features:
- Service status monitoring
- API endpoint documentation
- Real-time status indicators
- Interactive dashboard

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Change PORT in .env file
   PORT=3001
   ```

2. **MongoDB Connection Issues**:
   - Check if MongoDB is running
   - Verify MONGODB_URI in .env
   - Application will run without DB if connection fails

3. **Instagram Login Issues**:
   - Verify credentials in .env
   - Clear cookies: `curl -X DELETE http://localhost:3000/api/clear-cookies`
   - Check Instagram rate limits

4. **PM2 Issues**:
   ```bash
   # Kill all PM2 processes
   npx pm2 kill
   
   # Restart PM2 daemon
   npx pm2 resurrect
   ```

### Debug Mode
Enable debug logging by setting in `.env`:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## 📚 Additional Resources

- **Main Repository**: [hanamacdonald1/Riona-AI-Agent](https://github.com/hanamacdonald1/Riona-AI-Agent)
- **API Documentation**: Available at `/api/status`
- **Training Guides**: Check `/Guides` directory
- **Character Templates**: See `/src/Agent/characters/`

## 🆘 Support

For issues and feature requests:
1. Check the logs: `npx pm2 logs`
2. Verify configuration: Review `.env` file
3. Test API endpoints: Use the status endpoint
4. Check GitHub issues or create a new one

---

**🌸 Riona AI Agent is now live and ready to automate your social media interactions!**

Built with ❤️ by David Patrick | Enhanced deployment by AI Assistant