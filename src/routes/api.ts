import express, { Request, Response } from 'express';
import { getIgClient, closeIgClient, scrapeFollowersHandler } from '../client/Instagram';
import logger from '../config/logger';
import mongoose from 'mongoose';
import { signToken, verifyToken, getTokenFromRequest } from '../secret';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';

const router = express.Router();

// JWT Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload || typeof payload !== 'object' || !('username' in payload)) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  (req as any).user = { username: payload.username };
  next();
}

// Status endpoint
router.get('/status', (_req: Request, res: Response) => {
    const status = {
        dbConnected: mongoose.connection.readyState === 1
    };
    return res.json(status);
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const igClient = await getIgClient(username, password);
    // Sign JWT and set as httpOnly cookie
    const token = signToken({ username });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      secure: process.env.NODE_ENV === 'production',
    });
    return res.json({ message: 'Login successful' });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// Auth check endpoint
router.get('/me', (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload || typeof payload !== 'object' || !('username' in payload)) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  return res.json({ username: payload.username });
});

// Endpoint to clear Instagram cookies
router.delete('/clear-cookies', async (req, res) => {
  const cookiesPath = path.join(__dirname, '../../cookies/Instagramcookies.json');
  try {
    await fs.unlink(cookiesPath);
    res.json({ success: true, message: 'Instagram cookies cleared.' });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.json({ success: true, message: 'No cookies to clear.' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to clear cookies.', error: err.message });
    }
  }
});

// Get available characters (public endpoint)
router.get('/agent/characters', async (req: Request, res: Response) => {
  try {
    const charactersDir = path.join(__dirname, '../Agent/characters');
    const files = await fs.readdir(charactersDir);
    const characters = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(charactersDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const character = JSON.parse(content);
        characters.push({
          id: file.replace('.json', ''),
          name: character.name || file,
          bio: character.bio || [],
          filename: file
        });
      }
    }
    
    return res.json({ characters });
  } catch (error) {
    logger.error('Error loading characters:', error);
    return res.status(500).json({ error: 'Failed to load characters' });
  }
});

// Get system health (public endpoint)
router.get('/system/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'online' : 'offline',
        ai_engine: 'online',
        instagram_api: 'online',
        twitter_api: 'maintenance',
        storage: 'online'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    return res.status(500).json({ error: 'Health check failed' });
  }
});

// All routes below require authentication
router.use(requireAuth);

// Interact with posts endpoint
router.post('/interact', async (req: Request, res: Response) => {
  try {
    const igClient = await getIgClient((req as any).user.username);
    await igClient.interactWithPosts();
    return res.json({ message: 'Interaction successful' });
  } catch (error) {
    logger.error('Interaction error:', error);
    return res.status(500).json({ error: 'Failed to interact with posts' });
  }
});

// Send direct message endpoint
router.post('/dm', async (req: Request, res: Response) => {
  try {
    const { username, message } = req.body;
    if (!username || !message) {
      return res.status(400).json({ error: 'Username and message are required' });
    }
    const igClient = await getIgClient((req as any).user.username);
    await igClient.sendDirectMessage(username, message);
    return res.json({ message: 'Message sent successfully' });
  } catch (error) {
    logger.error('DM error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send messages from file endpoint
router.post('/dm-file', async (req: Request, res: Response) => {
  try {
    const { file, message, mediaPath } = req.body;
    if (!file || !message) {
      return res.status(400).json({ error: 'File and message are required' });
    }
    const igClient = await getIgClient((req as any).user.username);
    await igClient.sendDirectMessagesFromFile(file, message, mediaPath);
    return res.json({ message: 'Messages sent successfully' });
  } catch (error) {
    logger.error('File DM error:', error);
    return res.status(500).json({ error: 'Failed to send messages from file' });
  }
});

// Scrape followers endpoint
router.post('/scrape-followers', async (req: Request, res: Response) => {
  const { targetAccount, maxFollowers } = req.body;
  try {
    const result = await scrapeFollowersHandler(targetAccount, maxFollowers);
    if (Array.isArray(result)) {
      if (req.query.download === '1') {
        const filename = `${targetAccount}_followers.txt`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(result.join('\n'));
      } else {
        res.json({ success: true, followers: result });
      }
    } else {
      res.json({ success: true, result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET handler for scrape-followers to support file download
router.get('/scrape-followers', async (req: Request, res: Response) => {
  const { targetAccount, maxFollowers } = req.query;
  try {
    const result = await scrapeFollowersHandler(
      String(targetAccount),
      Number(maxFollowers)
    );
    if (Array.isArray(result)) {
      const filename = `${targetAccount}_followers.txt`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(result.join('\n'));
    } else {
      res.status(400).send('No followers found.');
    }
  } catch (error) {
    res.status(500).send('Error scraping followers.');
  }
});

// Exit endpoint
router.post('/exit', async (_req: Request, res: Response) => {
  try {
    await closeIgClient();
    return res.json({ message: 'Exiting successfully' });
  } catch (error) {
    logger.error('Exit error:', error);
    return res.status(500).json({ error: 'Failed to exit gracefully' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ message: 'Logged out successfully' });
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(pdf|doc|docx|txt|mp3|wav|m4a)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, MP3, WAV, M4A are allowed.'));
    }
  }
});

// ============================================================================
// AI AGENT ENDPOINTS
// ============================================================================

// Generate AI content
router.post('/agent/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type = 'caption', context = '', platform = 'instagram' } = req.body;
    
    logger.info(`Generating ${type} content for ${platform}`);
    
    // Simulate content generation (replace with actual AI logic)
    const generatedContent = await generateAIContent(type, context, platform);
    
    return res.json({
      success: true,
      content: generatedContent,
      type,
      platform,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Content generation error:', error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Train AI with YouTube URL
router.post('/agent/train/youtube', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({ error: 'Valid YouTube URL is required' });
    }
    
    logger.info(`Starting YouTube training with URL: ${url}`);
    
    // Simulate training process (replace with actual training logic)
    setTimeout(async () => {
      try {
        // Here you would implement actual YouTube training
        logger.info('YouTube training completed successfully');
      } catch (error) {
        logger.error('YouTube training failed:', error);
      }
    }, 1000);
    
    return res.json({
      success: true,
      message: 'YouTube training started',
      url,
      estimatedTime: '2-5 minutes'
    });
  } catch (error) {
    logger.error('YouTube training error:', error);
    return res.status(500).json({ error: 'Failed to start YouTube training' });
  }
});

// Train AI with website URL
router.post('/agent/train/website', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Valid website URL is required' });
    }
    
    logger.info(`Starting website training with URL: ${url}`);
    
    // Simulate training process
    setTimeout(async () => {
      try {
        logger.info('Website training completed successfully');
      } catch (error) {
        logger.error('Website training failed:', error);
      }
    }, 1000);
    
    return res.json({
      success: true,
      message: 'Website training started',
      url,
      estimatedTime: '1-3 minutes'
    });
  } catch (error) {
    logger.error('Website training error:', error);
    return res.status(500).json({ error: 'Failed to start website training' });
  }
});

// Train AI with file upload
router.post('/agent/train/file', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
    
    const { originalname, filename, mimetype, size } = req.file;
    
    logger.info(`Starting file training with: ${originalname} (${mimetype}, ${size} bytes)`);
    
    // Simulate training process
    setTimeout(async () => {
      try {
        // Clean up uploaded file
        await fs.unlink(req.file!.path);
        logger.info('File training completed successfully');
      } catch (error) {
        logger.error('File training failed:', error);
      }
    }, 1000);
    
    return res.json({
      success: true,
      message: 'File training started',
      filename: originalname,
      size,
      estimatedTime: '1-4 minutes'
    });
  } catch (error) {
    logger.error('File training error:', error);
    return res.status(500).json({ error: 'Failed to start file training' });
  }
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// Get analytics data
router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    // Simulate analytics data (replace with actual analytics logic)
    const analyticsData = {
      instagram: {
        posts: Math.floor(Math.random() * 50) + 10,
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 200) + 20,
        followers: Math.floor(Math.random() * 500) + 50,
        engagement_rate: (Math.random() * 5 + 2).toFixed(1) + '%'
      },
      twitter: {
        tweets: Math.floor(Math.random() * 30) + 5,
        retweets: Math.floor(Math.random() * 150) + 20,
        likes: Math.floor(Math.random() * 500) + 50,
        impressions: Math.floor(Math.random() * 3000) + 500,
        engagement_rate: (Math.random() * 4 + 1).toFixed(1) + '%'
      },
      ai: {
        content_generated: Math.floor(Math.random() * 100) + 20,
        success_rate: (Math.random() * 20 + 80).toFixed(1) + '%',
        avg_response_time: (Math.random() * 2 + 0.5).toFixed(1) + 's',
        quality_score: Math.floor(Math.random() * 20) + 80
      },
      summary: {
        total_actions: Math.floor(Math.random() * 200) + 50,
        active_days: Math.floor(Math.random() * 7) + 1,
        growth_rate: '+' + (Math.random() * 15 + 5).toFixed(1) + '%'
      }
    };
    
    return res.json(analyticsData);
  } catch (error) {
    logger.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================

// Get activity logs
router.get('/system/logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { limit = 50, level = 'all' } = req.query;
    
    // Simulate log entries (replace with actual log reading)
    const logs = Array.from({ length: Number(limit) }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
      message: `Sample log entry ${i + 1}`,
      service: ['instagram', 'twitter', 'ai', 'system'][Math.floor(Math.random() * 4)]
    }));
    
    return res.json({ logs });
  } catch (error) {
    logger.error('Logs error:', error);
    return res.status(500).json({ error: 'Failed to load logs' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function generateAIContent(type: string, context: string, platform: string): Promise<string> {
  // Simulate AI content generation
  const templates = {
    caption: [
      "🌟 Embracing the journey ahead with passion and purpose! ✨",
      "💫 Every moment is a new opportunity to shine brighter! 🌈",
      "🚀 Innovation meets inspiration in everything we create! 💡"
    ],
    comment: [
      "Amazing content! Love the creativity! 🔥",
      "This is exactly what I needed to see today! 💯",
      "Incredible work, keep it up! 👏"
    ],
    tweet: [
      "The future belongs to those who believe in the power of their dreams! 🌟 #Innovation #Tech",
      "Building something amazing, one line of code at a time 💻 #Developer #AI",
      "When passion meets purpose, magic happens ✨ #Entrepreneur #Growth"
    ]
  };
  
  const content = templates[type as keyof typeof templates] || templates.caption;
  return content[Math.floor(Math.random() * content.length)];
}

export default router; 