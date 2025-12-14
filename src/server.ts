import express from 'express';
import http from 'http';
import { PrismaWrapper } from './utils/prisma';
import { AppConfig } from './utils/config';
import { Logger } from './utils/logger';
import { apiRouter } from './api/router';
import { errorHandler } from './api/common/middlewares/error-handler';
import { requestContextMiddleware } from './api/common/middlewares/request-context';

void (async () => {
  const config = AppConfig.getInstance();
  const logger = Logger.getInstance(config.log);
  PrismaWrapper.getInstance(config.dbUrl);

  const app = express();

  app.use(requestContextMiddleware);

  app.get('/health', (req, res) => {
    res.send('OK');
  });

  app.get('/asd', (req, res) => {
    throw new Error('test');
  });

  app.use('/api', apiRouter);

  // Error handling middleware
  app.use(errorHandler);

  // Low level http server for handling os signals
  const httpServer = http.createServer(app);
  httpServer.listen(config.port, function () {
    logger.info('Server is running on port: ' + config.port);
  });

  //handle OS signals for graceful exit.
  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, (...args) => {
      if (httpServer.listening) {
        httpServer.close((err) => {
          logger.warn(`Could not close http server gracefully, ${err}`);
        });
      }
      // print uncaught exceptions to stderr
      if (eventType === 'uncaughtException') {
        logger.error(`Caught exception: ${args[0]}\n` + `Exception origin: ${args[1]}`);
      }

      if (eventType !== 'exit') process.exit();
    });
  });
})();
