/** GIA NOTES
 *
 * Use the code below to start a bare-bone express web server

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import * as config from './config';

async function main() {
  const server = express();
  server.use(cors());
  server.use(morgan('dev'));
  server.use(bodyParser.urlencoded({ extended: false }));
  server.use(bodyParser.json());
  server.use('/:fav.ico', (req, res) => res.sendStatus(204));

  // Example route
  server.use('/', (req, res) => {
    res.send('Hello World');
  });

  // This line rus the server
  server.listen(config.port, () => {
    console.log(`Server URL: http://localhost:${config.port}/`);
  });
}

main();
*/

import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import * as config from './config';
// import pgClient from './db/pg-client';
import pgApiWrapper from './db/pg-api';

import DataLoader from 'dataloader';

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startApolloServer() {
  const app = express();
  // const { pgPool } = await pgClient();
  const pgApi = await pgApiWrapper();

  app.use(cors());
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use('/:fav.ico', (req, res) => res.sendStatus(204));

  const loaders = {
    users: new DataLoader((userIds) => pgApi.usersInfo(userIds)),
    user: new DataLoader((userId) => pgApi.userInfo(userId)),
    approachLists: new DataLoader((taskIds) => pgApi.approachLists(taskIds)),
    tasks: new DataLoader((taskIds) => pgApi.tasksInfo(taskIds)),
    tasksByTypes: new DataLoader((types) => pgApi.tasksByTypes(types)),
    searchResults: new DataLoader((searchTerms) => pgApi.searchResults(searchTerms))
  };

  const mutators = {
    ...pgApi.mutators
  }

  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      // Get the user token from the headers.
      const token = req.headers && req.headers.authorization ? req.headers.authorization.slice(7) : null;
      const currentUser = await pgApi.userFromAuthToken(token);
      return {pgApi, loaders, mutators, currentUser};
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (err) => {
      // Don't give the specific errors to the client.
      if (err.message.startsWith('Database Error: ')) {
        return new Error('Internal server error');
      }
      // Otherwise return the original error. The error can also
      // be manipulated in other ways, as long as it's returned.
      const errorReport = {
        message: err.message,
        locations: err.locations,
        stack: err.stack ? err.stack.split('\n') : [],
        path: err.path
      };
      console.error('GraphQL Error', errorReport);
      return config.isDev ? errorReport : { message: 'Oops'};
    },
  });

  app.get('/rest', (req, res) => {
    res.json({
      data: "API is working...",
    });
  })

  await server.start();
  server.applyMiddleware({ app });
  await new Promise(resolve => httpServer.listen({ port: config.port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${config.port}${server.graphqlPath}`);
}

startApolloServer();
