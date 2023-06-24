import React, { useEffect, useState } from 'react';
import "../chat.css";
// Connection to backend flask
const API_URL = import.meta.env.VITE_REACT_APP_API;

function Chat() {
  const [chatname, setChatname] = useState("");
  const [input, setInput] = useState("");
  const [chatsnames, setChatsnames] = useState([]);
  const [btnname, setBtnName] = useState("");
  const [chats, setChats] = useState([]);


  const [user, setUser] = useState('');
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedId = localStorage.getItem('id');
    const storedToken = localStorage.getItem('token');

    if (!storedUser && !storedId) {
      // Si no se encuentra el nombre de usuario en el almacenamiento local, redirigir al inicio de sesión
      window.location.replace('/');
    } else {
      // Si se encuentra el nombre de usuario, establecer el estado del usuario
      setUser(storedUser);
      setId(storedId);
      setToken(storedToken);
    }
   
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chatname === "") {
      window.alert("Please enter a chat name");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/tableuser/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user,
          chatname
        }),
      });
      
      setChatname('');
      //GENERAR POST /tableuser/<user>
      const response_chatname = await fetch(`${API_URL}/tableuser/${user}`, {
        method: "POST",
        body: JSON.stringify({
          chatname
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      setBtnName(chatname);

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const enviar = async (user, btnname) => {
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
  


  //get chatnames
  
  const getChatnames = async (user) => {
    const response = await fetch(`${API_URL}/tableuser/${user}`);
    const data = await response.json();
    setChatsnames(data);
  };

  useEffect(() => {
    getChatnames(user);
    
  },  );


  useEffect(() => {
    getChats(user, btnname);
  }, [user, btnname] );

  // Function to handle button click
  const handleButtonClick = (chatname) => {
   
    setBtnName(chatname); // Set the clicked chatname as the value of btnname state
    console.log({btnname});
    

  };
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const getChats = async (user, btnname) => {
    setIsLoadingChats(true); // Indicar que se está cargando la información

    try {
      const response_chats = await fetch(`${API_URL}/tableuser/chats/${user}/${btnname}`);
      const data_chats = await response_chats.json();
      setChats(data_chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoadingChats(false); // Indicar que la carga ha finalizado
    }
  };

  
  //last scroll bar class view-chat
  useEffect(() => {
    // Desplazar la barra de desplazamiento al final después de que se actualicen los chats
    if (!isLoadingChats) {
      const chatContainer = document.querySelector('.view-chat');
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [isLoadingChats]);
  //



  //delete chat
  const deletechat = async (user,other) => {
    const response = await fetch(`${API_URL}/tableuser/${user}/${other}`, {
      method: "DELETE",
    });
    
    
    const response_delete = await fetch(`${API_URL}/tableuser/chats/${user}/${other}`, {
      method: "DELETE",
    });    

    
    await getChats(user, btnname);



  };

  return (
    <div className="dark-theme">
      <h1>Chat</h1>
        <div className='flex'>
      <div className='column'>
      <div className='column-create'>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={(e) => setChatname(e.target.value)}
          value={chatname}
          placeholder="Add a chat name"
          autoFocus
          className='input-createname'
        />

        <br />
        <br />
        <button type="submit" className='btn-create-name'>
          Create Chat
        </button>
      </form>
      </div>
      
      <div className="column-chats">
  {chatsnames.map((chatsnamed) => (
    <div key={chatsnamed.id}>
      <button onClick={() => handleButtonClick(chatsnamed.chatname)} className="btn-chats">
        {chatsnamed.chatname}
      </button>
      <button onClick={() => deletechat(user,chatsnamed.chatname)} className='btn-delete-chat'>X</button>
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
        />

        <button onClick={() => enviar(user,btnname)} className='btn-send' id="send-button">Send</button>
      </div>
      </div>

      </div>
    </div>
  );
}

export default Chat;
