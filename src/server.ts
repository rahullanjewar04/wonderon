import express from 'express';
import http from 'http';
import { Logger } from './logger';
import { AppConfig } from './config';

void (async () => {
  const config = AppConfig.getInstance();
  const logger = Logger.getInstance(config.log);

  const app = express();

  const httpServer = http.createServer(app);
  httpServer.listen(config.port, function () {
    logger.info('Server is running on port: ' + config.port);
  });

  //handle OS signals for graceful exit
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
