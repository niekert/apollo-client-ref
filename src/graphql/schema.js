import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLUnionType
} from "graphql";

const TextMessageType = new GraphQLObjectType({
  name: "TextMessage",
  fields: {
    id: { type: GraphQLID },
    content: { type: GraphQLString }
  }
});

const ImageMessageType = new GraphQLObjectType({
  name: "ImageMessage",
  fields: {
    id: { type: GraphQLID },
    src: { type: GraphQLString }
  }
});

class TextMessage {
  constructor(id, content) {
    this.id = id;
    this.content = content;
  }
}

class ImageMessage {
  constructor(id, src) {
    this.id = id;
    this.src = src;
  }
}

const MessageType = new GraphQLUnionType({
  name: "Pet",
  types: [TextMessageType, ImageMessageType],
  resolveType(value) {
    if (value instanceof TextMessage) {
      return TextMessageType;
    }

    if (value instanceof ImageMessage) {
      return ImageMessageType;
    }
  }
});

const MessageEdgeType = new GraphQLObjectType({
  name: "MessageEdge",
  fields: {
    node: { type: MessageType }
  }
});

const conversationType = new GraphQLObjectType({
  name: "Conversation",
  fields: {
    id: { type: GraphQLID },
    textMessages: {
      type: GraphQLList(TextMessageType)
    },
    messages: {
      type: GraphQLList(MessageType)
    },
    messageEdges: {
      type: GraphQLList(MessageEdgeType)
    }
  }
});

const makeMessages = count =>
  Array.from({ length: count }, (_, i) => {
    const isOdd = i % 2;

    if (isOdd) {
      return new TextMessage(
        `${i}-text-message`,
        `This is the ${i}th text message`
      );
    } else {
      return new ImageMessage(
        `${i}-image-message`,
        `https://example.org/image=${i}.png`
      );
    }
  });

const conversation = {
  id: 5,
  textMessages: Array.from({ length: 100 }, (_, i) => {
    return new TextMessage(`${i}-message`, `This is the ${i}th text message`);
  }),
  messages: makeMessages(100),
  messageEdges: makeMessages(100).map(message => ({
    node: message
  }))
};

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    conversation: {
      type: conversationType,
      resolve: () => {
        return conversation;
      }
    }
  }
});

let mutationMessagesCount = 1000;
const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    removeMessage: {
      type: GraphQLBoolean,
      resolve() {
        return true;
      }
    },
    sendMessage: {
      type: MessageType,
      resolve() {
        return new TextMessage(
          mutationMessagesCount++,
          "This was a mutateed message"
        );
      }
    }
  }
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType
});
