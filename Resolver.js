import db from './_db.js'

import { PubSub } from 'graphql-subscriptions'
//var pubsub:PubSub;
 //const pubsub = new PubSub();
 const pubSub = new PubSub();
 const mockAdded = (game) => {
  setTimeout(() => {
      pubSub.publish('MESSAGE_ADDED', { gamesAdded: game});
  }, 1000);
}
export const resolvers = {
    Query: {
      games() {
        return db.games
      },
      game(_, args) {
        console.log(args.id)
        return db.games.find((game) => game.id === args.id)
      },
      authors() {
        return db.authors
      },
      author(_, args) {
        return db.authors.find((author) => author.id === args.id)
      },
      reviews() {
        return db.reviews
      },
      review(_, args) {
        return db.reviews.find((review) => review.id === args.id)
      }
    },
    Game: {
      reviews(parent) {
        console.log(parent.id)
        return db.reviews.filter((r) => r.game_id === parent.id)
      }
    },
    Review: {
      author(parent) {
        return db.authors.find((a) => a.id === parent.author_id)
      },
      game(parent) {
        return db.games.find((g) => g.id === parent.game_id)
      }
    },
    Author: {
      reviews(parent) {
        return db.reviews.filter((r) => r.author_id === parent.id)
      }
    },
  /*  Subscription: {
        gamesAdded: {
        resolve: (payload) => payload.gamesAdded,
        subscribe: () => pubsub.asyncIterator(['MESSAGE_ADDED']),
      },
    },*/
    Subscription: {
        gamesAdded:{
      //      resolve: (payload) => payload.gamesAdded
          
          subscribe: () => pubSub.asyncIterator(['MESSAGE_ADDED'])
          
        }
        
      }, 
    Mutation: {
      addGame(_, args) {
        let game = {
          id: Math.floor(Math.random() * 10000).toString(),
          ...args.game
         
          
        }
        db.games.push(game)
    //    pubsub.publish('MESSAGE_ADDED', { gamesAdded: game });
    mockAdded(game)
    console.log(game)
 //   pubsub.publish('MESSAGE_ADDED', { gamesAdded: game})
       
        return game
      },
    
      deleteGame(_, args) {
        db.games = db.games.filter((g) => g.id !== args.id)
  
        return db.games
      },
      updateGame(_, args) {
        db.games = db.games.map((g) => {
          if (g.id === args.id) {
            return {...g, ...args.edits}
          }
  
          return g
        })
  
        return db.games.find((g) => g.id === args.id)
      }
    }
  }