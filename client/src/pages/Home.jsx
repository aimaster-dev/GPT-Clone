import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import "../assets/css/home.css";
const API_URL = import.meta.env.VITE_REACT_APP_API;

function Home() {
  const [user, setUser] = useState('');
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/');
  };

  const changePassword = () => {
    localStorage.setItem('userForChangePassword', user);
    localStorage.setItem('idForChangePassword', id);
    localStorage.setItem('tokenForChangePassword', token);
    window.location.href = '/changepassword';
  };

  const deleteAccount = async (id, user) => {
    if (window.confirm('Do you want to delete your account? This action cannot be undone.')) {

      const response_delete_table_user_chats = await fetch(`${API_URL}/tableuser/chats/all/${user}`, {
        method: "DELETE",
      });
      const response_delete_table_user = await fetch(`${API_URL}/tableuser/account/${user}`, {
        method: "DELETE",
      });
      const response = await fetch(`${API_URL}/register/${id}`, {
        method: "DELETE",
      });

      if (response.status === 200) {
        toast.success('Account Successfully Deleted');
        window.location.href = `/`;
      } else {
        toast.error('Error deleting account');
      }
    }
  };

  const chat = () => {
    fetch(`${API_URL}/tableuser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user

      }),
    });
    window.location.href = '/chat';
  }

  return (
    <div className="home-container">
      <div className="home-card home-center">
        <h1 className="home-title">Welcome, <span className="home-username">{user}</span>!</h1>
        <div className="home-actions">
          <button className="home-btn logout" onClick={handleLogout}>Logout</button>
          <button className="home-btn change-password" onClick={changePassword}>Change Password</button>
          <button className="home-btn delete-account" onClick={() => deleteAccount(id, user)}>Delete Account</button>
          <button className="home-btn chats" onClick={chat}>Chats</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
