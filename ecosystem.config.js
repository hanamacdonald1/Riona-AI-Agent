module.exports = {
  apps: [
    {
      name: 'riona-ai-agent',
      script: 'build/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart configuration
      min_uptime: '10s',
      max_restarts: 5,
      
      // Environment variables
      env_file: '.env',
      
      // Pre/post deploy hooks
      pre_setup: 'npm install',
      post_setup: 'npm run build',
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Advanced settings
      merge_logs: true,
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'user',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/hanamacdonald1/Riona-AI-Agent.git',
      path: '/home/user/webapp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    },
    development: {
      user: 'user',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/hanamacdonald1/Riona-AI-Agent.git',
      path: '/home/user/webapp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development'
    }
  }
};