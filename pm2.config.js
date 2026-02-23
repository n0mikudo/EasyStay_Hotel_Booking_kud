/**
 * EasyStay PM2 统一配置文件
 * 使用方式: pm2 start pm2.config.js
 */

module.exports = {
  apps: [
    {
      name: 'easystay-server',
      script: 'app.js',
      cwd: '/root/hotel/EasyStay_Hotel_Booking_kud/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/root/hotel/EasyStay_Hotel_Booking_kud/logs/server-error.log',
      out_file: '/root/hotel/EasyStay_Hotel_Booking_kud/logs/server-out.log',       
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'easystay-admin',
      script: 'npm',
      args: 'start',
      cwd: '/root/hotel/EasyStay_Hotel_Booking_kud/admin-pc',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3011,
        REACT_APP_API_URL: 'http://81.71.15.150:3000/api'
      },
      error_file: '/root/hotel/EasyStay_Hotel_Booking_kud/logs/admin-error.log',
      out_file: '/root/hotel/EasyStay_Hotel_Booking_kud/logs/admin-out.log',    
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'easystay-mobile',
      script: 'npm',
      args: 'start',
      cwd: '/root/hotel/EasyStay_Hotel_Booking_kud/client-mobile',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        REACT_APP_API_URL: 'http://81.71.15.150:3000/api'
      },
      error_file: '/root/hotel/EasyStay_Hotel_Booking_kud/logs/mobile-error.log',
      out_file: '/root/hotel/EasyStay_Hotel_Booking_kud/logs/mobile-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
