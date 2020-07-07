const logger = require('./logger')

const requestLogger = (request, response, next) => {
  logger.info('Method: ', request.method)
  logger.info('Path: ', request.path)
  logger.info('Body: ', request.body)
  logger.info('-------')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknwon endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  // TODO add error handling like CastError and ValidationError

  next(error)
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler
}