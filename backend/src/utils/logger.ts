import { join } from 'path';
import fs from 'fs';
import type { Request, Response } from 'express';

// Use CommonJS __filename and __dirname if available, otherwise fallback
declare const __filename: string;
declare const __dirname: string;

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

interface LogMeta {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: LogMeta;
}

const formatMessage = (level: string, message: string, meta: LogMeta = {}): string => {
  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = {
    timestamp,
    level,
    message,
    ...(Object.keys(meta).length > 0 && { meta })
  };
  
  return JSON.stringify(logEntry, null, 2);
};

interface WriteToFile {
  (level: string, content: string): void;
}

const writeToFile: WriteToFile = (level, content) => {
  const fileName = `${level.toLowerCase()}.log`;
  const filePath = join(logsDir, fileName);
  
  try {
    fs.appendFileSync(filePath, content + '\n');
  } catch (error: any) {
    console.error('Failed to write to log file:', error.message);
  }
};

interface Logger {
  error: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
  request: (req: Request, res: Response, responseTime: number) => void;
}

interface RequestLogData {
  method: string;
  url: string;
  ip: string;
  userAgent: string | undefined;
  statusCode: number;
  responseTime: string;
  timestamp: string;
}

const logger: Logger = {
  error: (message: string, meta: LogMeta = {}) => {
    const logContent = formatMessage(LOG_LEVELS.ERROR, message, meta);
    console.error(`❌ ERROR: ${message}`);
    
    if (Object.keys(meta).length > 0) {
      console.error('Meta:', JSON.stringify(meta, null, 2));
    }
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      writeToFile(LOG_LEVELS.ERROR, logContent);
    }
  },

  warn: (message: string, meta: LogMeta = {}) => {
    const logContent = formatMessage(LOG_LEVELS.WARN, message, meta);
    console.warn(`⚠️  WARN: ${message}`);
    
    if (Object.keys(meta).length > 0) {
      console.warn('Meta:', JSON.stringify(meta, null, 2));
    }
    
    if (process.env.NODE_ENV === 'production') {
      writeToFile(LOG_LEVELS.WARN, logContent);
    }
  },

  info: (message: string, meta: LogMeta = {}) => {
    const logContent = formatMessage(LOG_LEVELS.INFO, message, meta);
    console.log(`ℹ️  INFO: ${message}`);
    
    if (Object.keys(meta).length > 0) {
      console.log('Meta:', JSON.stringify(meta, null, 2));
    }
    
    if (process.env.NODE_ENV === 'production') {
      writeToFile(LOG_LEVELS.INFO, logContent);
    }
  },

  debug: (message: string, meta: LogMeta = {}) => {
    // Only log debug messages in development
    if (process.env.NODE_ENV === 'development') {
      const logContent = formatMessage(LOG_LEVELS.DEBUG, message, meta);
      console.log(`🐛 DEBUG: ${message}`);
      
      if (Object.keys(meta).length > 0) {
        console.log('Meta:', JSON.stringify(meta, null, 2));
      }
    }
  },

  // HTTP request logger
  request: (req: Request, res: Response, responseTime: number) => {
    const logData: RequestLogData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || '',
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };

    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} [${responseTime}ms]`;
    
    if (res.statusCode >= 400) {
      logger.error(message, logData);
    } else {
      logger.info(message, logData);
    }
  }
};

export { logger };