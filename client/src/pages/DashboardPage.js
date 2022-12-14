import React from "react";
import axios from "axios";
// import { Link } from "react-router-dom";
import makeToast from "../Toaster";
import ReactLoading from "react-loading";
// import { useMatch } from "react-router-dom";

export default function DashboardPage({ socket }) {
  // console.log(socket);
  // const match = useMatch("/test/");
  const [chatroomId, setChatroomId] = React.useState();
  const [messages, setMessages] = React.useState([]);
  const [userId, setUserId] = React.useState("");
  const messageRef = React.useRef(null);
  //////////////////////////////////////////////////////////////////////////////////////////////
  const [chatrooms, setChatrooms] = React.useState([]);
  const chatroomRef = React.createRef();
  const [prevMessages, setPrevMessages] = React.useState([]);
  const messagesEndRef = React.useRef(null);

  const URL = "https://dizcorddds.herokuapp.com";

  const getChatrooms = () => {
    axios
      .get(`${URL}/chatroom`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("DC_Token")}`,
        },
      })
      .then((response) => {
        setChatrooms(response.data);
      })
      .catch((err) => {
        setTimeout(getChatrooms, 3000);
      });
  };

  const getPreviousMessages = () => {
    axios
      .get(`${URL}/chatroom/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("DC_Token")}`,
        },
      })
      .then((response) => {
        setPrevMessages(response.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // to get old messags when the component mounts
  React.useEffect(() => {
    getPreviousMessages();
  }, []);

  React.useEffect(() => {
    getChatrooms();
    // eslint-disable-next-line
  }, []);

  const createChatroom = (e) => {
    e.preventDefault();
    axios
      .post(
        `${URL}/chatroom`,
        {
          name: chatroomRef.current.value,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("DC_Token")}`,
          },
        }
      )
      .then((response) => {
        makeToast("success", response.data.message);
        chatroomRef.current.value = "";
        getChatrooms();
      })
      .catch((err) => {
        makeToast("error", err.response.data.message);
      });
  };
  //////////////////////////////////////////////////////////////////////////////////////////////

  const sendMessage = (e) => {
    e.preventDefault();
    if (socket) {
      socket.emit("chatroomMessage", {
        chatroomId,
        message: messageRef.current.value,
      });

      messageRef.current.value = "";
      setMessageBeingTyped("");
      socket.emit("typingMessage", {
        chatroomId,
        message: "",
      });
    }
  };

  React.useEffect(() => {
    const token = localStorage.getItem("DC_Token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));

      setUserId(payload.id);
    }
    if (socket) {
      socket.on("newMessage", (message) => {
        const newMessages = [...messages, message];
        setMessages(newMessages);
      });
    }
    //eslint-disable-next-line
  }, [messages]);
  React.useEffect(() => {
    if (socket) {
      socket.emit("joinRoom", {
        chatroomId,
      });
    }

    return () => {
      //Component Unmount
      if (socket) {
        socket.emit("leaveRoom", {
          chatroomId,
        });
      }
    };
    //eslint-disable-next-line
  }, [chatroomId]);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // <input type="checkbox" id="toggle" className="toggle--checkbox" />
  // <label for="toggle" className="toggle--label">
  //   <span className="toggle--label-background"></span>
  // </label>
  // <div className="background"></div>

  // this is the list of previous messages based on the chatroom
  const chatroomPreviousMessages = prevMessages
    .filter((item) => item.chatroom === chatroomId)
    .map((message) => (
      <div
        className={`message ${message.user === userId ? "self-message" : ""}`}
        key={message._id}
      >
        <div
          className={`message-inner  ${
            message.user === userId ? "green-message" : ""
          }`}
        >
          <strong>{message.user !== userId && message.username + ":"}</strong>{" "}
          {message.message}
        </div>
      </div>
    ));

  // this is the list of the new messages
  const chatroomNewMessages = messages.map((message, i) => (
    <div
      key={i}
      className={`message ${message.userId === userId ? "self-message" : ""}`}
    >
      {/* <span
          className={
            userId === message.userId ? "ownMessage" : "otherMessage"
          }
        >
      </span>{" "} */}
      <div
        className={`message-inner message-new ${
          message.userId === userId ? "green-message" : ""
        }`}
      >
        <strong>{message.userId !== userId && message.name + ":"}</strong>{" "}
        {message.message}
      </div>
    </div>
  ));

  // to get old messages when the component is mounted

  React.useEffect(() => {
    getPreviousMessages();
  }, []);

  function joinChatRoom(id) {
    setChatroomId(id);
    setMessageBeingTyped("");
    socket.emit("typingMessage", {
      chatroomId,
      message: "",
    });
    setMessages([]);
  }

  const availableChatrooms = chatrooms
    .map((chatroom, i) => (
      <div
        key={i}
        onClick={() => {
          joinChatRoom(chatroom._id);
        }}
      >
        <div key={chatroom._id} to={`/chatroom/${chatroom._id}`}>
          <div className="chatroom-name">{chatroom.name}</div>
        </div>
      </div>
    ))
    .reverse();

  const typingMessage = () => {
    if (socket) {
      socket.emit("typingMessage", {
        chatroomId,
        message: messageRef.current.value,
      });
    }
  };
  //.............................................

  const [messageBeingTyped, setMessageBeingTyped] = React.useState("");

  if (socket) {
    socket.on("typing", (message) => {
      setMessageBeingTyped(message);
    });
  }
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageBeingTyped]);

  return (
    <div className="main-app">
      <input type="checkbox" id="toggle" className="side-button"></input>
      <label htmlFor="toggle" class="side-button-label"></label>

      <div className="side-bar">
        <div>
          <br className="top-page-break" />

          <br />

          <div className="chatroom-creator">
            <form className="create-chatroom-form">
              <input
                className="chatroom-name-input"
                type="text"
                name="ChatroomName"
                id="ChatroomName"
                ref={chatroomRef}
                placeholder="create chatroom"
              />
              <button
                className="create-chatroom-button"
                onClick={createChatroom}
              >
                +
              </button>
            </form>

            {chatrooms.length > 0 ? (
              <div className="chatrooms">{availableChatrooms}</div>
            ) : (
              <div className="loading-div">
                <ReactLoading
                  className="loading-balls"
                  type="balls"
                  color="#767e88"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="other">
        <div className="chat-box">
          {/* {prevMessages.map((message) => (
            <div className="message" key={message._id}>
              {message.message}
            </div>
          ))} */}

          {chatroomPreviousMessages}
          {chatroomNewMessages}

          {chatroomId &&
            messageBeingTyped.message &&
            messageBeingTyped.userId !== userId && (
              <div className="message">
                <div className="message-inner gray-message">
                  <strong>{messageBeingTyped.name} is typing:</strong>
                  <div>{messageBeingTyped.message}</div>
                </div>
              </div>
            )}

          {!chatroomId && (
            <div className="enter-chatroom">
              Enter a chatroom to start chatting!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatroom-actions">
          <form className="send-message-form" onSubmit={sendMessage}>
            <input
              className="send-message-input"
              type="text"
              name="message"
              placeholder="Say something!"
              ref={messageRef}
              disabled={!chatroomId}
              onChange={typingMessage}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
