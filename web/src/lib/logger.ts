import { getLogger } from '@logtape/logtape'
import { APP_CONFIG } from '@/constants'

// Standard log keys for high-cardinality logs
export const LogKeys = {
  USER_ID: 'user_id',
  STATUS: 'status',
  PATH: 'path',
  METHOD: 'method',
  ERROR: 'error',
} as const

export const logger = getLogger([APP_CONFIG.LOGGER_NAME])

/**
 * Logs a high-cardinality milestone event with a single "fat" log entry.
 */
export function logMilestone(message: string, data: Record<string, unknown>) {
  logger.info(message, data)
}
