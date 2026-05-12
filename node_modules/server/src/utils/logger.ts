import winston from 'winston';
import { env } from '../config/env';

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, stack }) =>
      stack ? `${timestamp} [${level}]: ${message}\n${stack}` : `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});
