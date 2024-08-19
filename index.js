import { ApolloServer } from '@apollo/server';
import { createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import express from 'express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';

import { resolvers } from './Resolver.js'
import { typeDefs } from './schema.js'

const port = 3000;


const pubSub = new PubSub();

const mockLongLastingOperation = (name) => {
    setTimeout(() => {
        pubSub.publish('OPERATION_FINISHED', { operationFinished: { name, endDate: new Date().toDateString() } });
    }, 1000);
}


const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
});

const wsServerCleanup = useServer({schema}, wsServer);

const apolloServer = new ApolloServer({
    schema,
    formatError: (formattedError, error) => {
        if (
          formattedError.extensions.code ===
          ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED
        ) {
          return {
            ...formattedError,
            message: "Your query doesn't match the schema. Try double-checking it!",
          };
        }
     return formattedError;
      },
    plugins: [
       // Proper shutdown for the HTTP server.
       ApolloServerPluginDrainHttpServer({ httpServer }),

       // Proper shutdown for the WebSocket server.
       {
        async serverWillStart() {
            return {
                async drainServer() {
                    await wsServerCleanup.dispose();
                }
            }
        }
       }
    ]
});

await apolloServer.start();

app.use('/graphql', bodyParser.json(), expressMiddleware(apolloServer));

httpServer.listen(port, () => {
    console.log(`Query endpoint ready at http://localhost:${port}/graphql`);
    console.log(`Subscription endpoint ready at ws://localhost:${port}/graphql`);
});