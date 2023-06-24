import React, { useState,useEffect  } from "react";
import "../login.css";

//google api
import { GoogleLogin } from "react-google-login";
import {gapi} from "gapi-script";

// Conection to backend flask
const API_URL = import.meta.env.VITE_REACT_APP_API;

function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [incorrectLogin, setIncorrectLogin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${API_URL}`, {  // Cambia la URL para que coincida con la ruta de inicio de sesión en tu backend
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        password,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      const token = data.token;
      const user_id = data.user_id;

      // Guardar el token en el almacenamiento local (localStorage) para su uso posterior
      localStorage.setItem("token", token);
      localStorage.setItem('user', user);
      localStorage.setItem('id', user_id);
      

      // Redireccionar a la página de inicio después de un inicio de sesión exitoso
      window.location.href = `/home`;  // Incluir también la contraseña en la URL
    } else {
      setIncorrectLogin(true);
    }
  };


  // Botón de registro con Google 
 
  const onSuccessl = async (response) => {
    //console.log("Success: ", response.profileObj);
    const token = response.tokenId; // Obtener el token de acceso
  
    try {
      const responsegoogle = await fetch(`${API_URL}/logingoogle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
  
      if (responsegoogle.status === 200) {
        const data = await responsegoogle.json();
        const token = data.token;
        const user_id = data.user_id;
        const user = data.user;
  
        // Guardar el token en el almacenamiento local (localStorage) para su uso posterior
        localStorage.setItem("token", token);
        localStorage.setItem('user', user);
        localStorage.setItem('id', user_id);
  
        // Redireccionar a la página de inicio después de un inicio de sesión exitoso
        window.location.href = `/home`;  // Incluir también la contraseña en la URL
      } else {
        window.alert("Error al iniciar sesión , Registrate primero");
      }
    } catch (error) {
      // Manejar cualquier error que ocurra durante la solicitud POST
      console.error('Error:', error);
    }
  };
  

 const onFailurel = (response) => {
  window.alert("Error al iniciar sesión");
    console.log("Login Failure: ", response);
 }

 useEffect(() => {
  gapi.load("client:auth2", () => {
    gapi.client
      .init({
        clientId:
        "CLIENT_ID_APPIGOOLE",
        scope: "email",
      })
      .then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateAuthStatus);
        updateAuthStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      });
  });
 })

//------------------------------

  return (
    <div className="loginContainer">
    <h1 className="title">Login</h1>
    <form onSubmit={handleSubmit} className="form">
      <h3 className="subtitle">Username</h3>
      <input
        type="text"
        onChange={(e) => setUser(e.target.value)}
        value={user}
        placeholder="Username"
        autoFocus
        className="input"
      />
      <br />
      <h3 className="subtitle">Password</h3>
      <input
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        placeholder="Password"
        className="input"
      />
      <br />
      <br />
      <button type="submit" className="loginButton">
        Login
      </button>
    </form>
    <br />
    <a href="/loginup" className="registerLink">
      Register
    </a>
    <br />
    <br />
    {incorrectLogin && <p className="errorMessage">Incorrect username or password</p>}
    <GoogleLogin
        clientId="CLIENT_ID_APPIGOOLE"
        buttonText="Login with Google"
        onSuccess={onSuccessl}
        onFailure={onFailurel}
        cookiePolicy={'single_host_origin'}
      />
  </div>

  );
}

export default Login;
