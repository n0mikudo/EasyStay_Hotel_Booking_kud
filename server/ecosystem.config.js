/**
 * PM2 进程管理配置文件
 * 使用方式: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'easystay-server',
      script: 'app.js',
      cwd: '/opt/EasyStay_Project/server',
      
      // 实例数量
      instances: 1,
      exec_mode: 'fork',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // 日志配置
      error_file: '/opt/EasyStay_Project/server/logs/error.log',
      out_file: '/opt/EasyStay_Project/server/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 重启策略
      watch: false,
      max_memory_restart: '500M',
      
      // 自动重启
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
