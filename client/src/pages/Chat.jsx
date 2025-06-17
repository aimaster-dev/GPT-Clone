import { useEffect, useState } from 'react';
import "../assets/css/chat.css";
import { toast } from 'react-toastify';
const API_URL = import.meta.env.VITE_REACT_APP_API;

function Chat() {
  const [chatname, setChatname] = useState("");
  const [input, setInput] = useState("");
  const [chatsnames, setChatsnames] = useState([]);
  const [btnname, setBtnName] = useState("");
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState('');
  const [, setId] = useState('');
  const [, setToken] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedId = localStorage.getItem('id');
    const storedToken = localStorage.getItem('token');

    if (!storedUser && !storedId) {
      window.location.replace('/');
    } else {
      setUser(storedUser);
      setId(storedId);
      setToken(storedToken);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chatname === "") {
      toast.info("Please enter a chat name");
      return;
    }
    try {
      await fetch(`${API_URL}/tableuser/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user,
          chatname,
        }),
      });
      await fetch(`${API_URL}/tableuser/${user}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatname,
        }),
      });
      setBtnName(chatname);
      setChatname("");
      await getChatnames(user);
      await getChats(user, chatname);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const send = async (user, btnname) => {
    const response = await fetch(`${API_URL}/tableuser/chatss/${user}/${btnname}`, {
      method: "POST",
      body: JSON.stringify({
        input
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    setInput('');
    getChats(user, btnname);
  };

  const getChatnames = async (user) => {
    const response = await fetch(`${API_URL}/tableuser/${user}`);
    const data = await response.json();
    setChatsnames(data);
  };

  useEffect(() => {
    if (user === '') return;
    getChatnames(user);
  }, [user]);


  useEffect(() => {
    if(user === '' || btnname === '') return;
    getChats(user, btnname);
  }, [user, btnname]);

  const handleButtonClick = (chatname) => {
    setBtnName(chatname);
  };

  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const getChats = async (user, btnname) => {
    setIsLoadingChats(true);
    try {
      const response_chats = await fetch(`${API_URL}/tableuser/chats/${user}/${btnname}`);
      const data_chats = await response_chats.json();
      setChats(data_chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    if (!isLoadingChats) {
      const chatContainer = document.querySelector('.view-chat');
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [isLoadingChats]);

  const deletechat = async (user, other) => {
    try {
      await fetch(`${API_URL}/tableuser/${user}/${other}`, {
        method: "DELETE",
      });
  
      await fetch(`${API_URL}/tableuser/chats/${user}/${other}`, {
        method: "DELETE",
      });
      // Remove the chatname from the list
      setChatsnames((prevChatsnames) => {
        const updated = prevChatsnames.filter((item) => item.chatname !== other);
        // Set the new btnname to the first chatname if available, else empty string
        setBtnName(updated[0]?.chatname || "");
        // Update chats for the new btnname
        if (updated[0]?.chatname) {
          getChats(user, updated[0].chatname);
        } else {
          setChats([]);
        }
        return updated;
      });
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error("Failed to delete chat");      
    }
  };

  return (
    <div className="dark-theme" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ textAlign: "center" }}>Chat</h1>
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
      <button
        className="go-home-link"
        style={{
        padding: "0.5rem 1.5rem",
        borderRadius: "6px",
        border: "none",
        background: "#4f8cff",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "1rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
        }}
        onClick={() => window.location.href = "/"}
      >
        Go to Home
      </button>
      </div>
      <div className='flex' style={{ justifyContent: "center" }}>
      <div className='column'>
        <div className='column-create'>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              onChange={(e) => setChatname(e.target.value)}
              value={chatname}
              placeholder="Add a chat name"
              autoFocus
              className='input-createname'
              style={{ marginRight: "8px" }}
            />
            <button
              type="submit"
              className="btn-create-name"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                verticalAlign: "middle",
                marginLeft: "0",
                padding: 0,
                fontSize: "1.5rem",
                color: "#4f8cff",
                display: "inline-flex",
                alignItems: "center"
              }}
              title="Create Chat"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </form>
        </div>

        <div className="column-chats">
        {chatsnames.map((chatsnamed) => (
          <div key={chatsnamed.id}>
          <button
            className={`btn-chats${btnname === chatsnamed.chatname ? ' active' : ''}`}
            onClick={() => handleButtonClick(chatsnamed.chatname)}
          >
            {chatsnamed.chatname}
          </button>
          <button onClick={() => deletechat(user, chatsnamed.chatname)} className='btn-delete-chat'>X</button>
          </div>
        ))}
        </div>
      </div>
      <div>
        <div className='view-chat'>
        {isLoadingChats ? (
          <p>Loading chats...</p>
        ) : (
          chats.map((chat) => (
          <div key={chat.id}>
            <p>{chat.input}</p>
            <p>{chat.output}</p>
          </div>
          ))
        )}
        </div>
        <div className='input' >
        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Add an input"
          autoFocus
          className="input-user"
          onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() !== "") {
            send(user, btnname);
            }
          }
          }}
        />
        <button onClick={() => send(user, btnname)} className='btn-send' id="send-button">Send</button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Chat;
