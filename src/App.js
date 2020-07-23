import React from "react";
import { gql, useQuery, useMutation } from "@apollo/client";

const CONVERSATION = gql`
  query Conversation {
    conversation {
      id
      textMessages {
        id
        content
      }
      messages {
        ... on TextMessage {
          id
          content
        }

        ... on ImageMessage {
          id
          src
        }
      }
      messageEdges {
        node {
          ... on TextMessage {
            id
            content
          }

          ... on ImageMessage {
            id
            src
          }
        }
      }
    }
  }
`;

const REMOVE_MESSAGE_MUTATION = gql`
  mutation removeMessage {
    removeMessage
  }
`;

const useRemovemessageMutation = (conversationId, fieldToUpdate) => {
  return useMutation(REMOVE_MESSAGE_MUTATION, {
    optimisticResponse: {
      removeMessage: true
    },
    update: (cache, result) => {
      cache.modify({
        id: cache.identify({
          __typename: "Conversation",
          id: conversationId
        }),
        broadcast: true,
        fields: {
          [fieldToUpdate]: existingMessages => {
            const [, ...remainingMessages] = existingMessages;

            return remainingMessages;
          }
        }
      });
    }
  });
};

const useSendMessageMutation = (conversationId, fieldToUpdate) => {
  return useMutation(SEND_MESSAGE_MUTATIOM, {
    optimisticResponse: {
      __typename: "Message",
      id: Date.now()
    }
  });
};

// The message is React.memo'd. Whenever a message has to re-render
// We call the "countRender" fn which shows the number of re-renders
const Message = React.memo(({ message, countRender }) => {
  React.useEffect(() => {
    countRender();
  });

  console.log("rendering message");

  if (message.__typename === "ImageMessage") {
    return <div style={{ border: "1px solid blue " }}>{message.src}</div>;
  }

  return <div style={{ border: "1px solid red " }}>{message.content}</div>;
});

export default function App() {
  const { loading, data } = useQuery(CONVERSATION);
  const [renderCount, setRenderCount] = React.useState(0);
  const [removeTextMessage] = useRemovemessageMutation(
    data?.conversation?.id,
    "textMessages"
  );
  const [removeUnionMessage] = useRemovemessageMutation(
    data?.conversation?.id,
    "messages"
  );
  const [removeMessageEdge] = useRemovemessageMutation(
    data?.conversation?.id,
    "messageEdges"
  );

  const lastTextMessage =
    data?.conversation?.textMessages[data.conversation.textMessages.length - 1];
  const lastUnionMessage =
    data?.conversation?.messages[data.conversation.messages.lenght - 1];
  const firstTextMessage = data?.conversation?.textMessages[0];

  React.useEffect(() => {
    if (lastTextMessage) {
      console.log("lastTextMessage changed");
    }
  }, [lastTextMessage]);

  React.useEffect(() => {
    if (firstTextMessage) {
      console.log("firstTextMessage changed");
    }
  }, [firstTextMessage]);

  React.useEffect(() => {
    if (lastUnionMessage) {
      console.log("lastUnionMessage changed");
    }
  }, [lastUnionMessage]);

  const countRender = React.useCallback(() => {
    setRenderCount(v => v + 1);
  }, []);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This app demonstrates that items in a list are not the same reference,
        breaking React.memo.
      </p>
      <h2>Message render count after action: {renderCount}</h2>
      <div style={{ display: "flex" }}>
        <button
          onClick={() => {
            setRenderCount(0);
            removeTextMessage();
          }}
        >
          Remove a text message
        </button>
        <button
          onClick={() => {
            setRenderCount(0);
            removeUnionMessage();
          }}
        >
          Remove a union message
        </button>
        <button
          onClick={() => {
            setRenderCount(0);
            removeMessageEdge();
          }}
        >
          Remove a message edge
        </button>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{ display: "flex" }}>
          <div>
            <h3>Text messages</h3>
            {data.conversation.textMessages.map(message => (
              <Message
                key={message.id}
                message={message}
                countRender={countRender}
              />
            ))}
          </div>
          <div>
            <h3>union messages</h3>
            {data.conversation.messages.map(message => (
              <Message
                key={message.id}
                message={message}
                countRender={countRender}
              />
            ))}
          </div>
          <div>
            <h3>message edges</h3>
            {data.conversation.messageEdges.map(message => (
              <Message
                key={message.node.id}
                message={message.node}
                countRender={countRender}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
