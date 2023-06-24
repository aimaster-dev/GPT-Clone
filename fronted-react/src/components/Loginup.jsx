import React, { useState ,useEffect} from "react";
import "../loginup.css";

//google api
import { GoogleLogin } from "react-google-login";
import {gapi} from "gapi-script";


// Conection to backend flask
const API_URL = import.meta.env.VITE_REACT_APP_API;

function Loginup() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[same_password, setSame_password] = useState("");

  const [error, setError] = useState(""); // Nueva variable de estado para el mensaje de error

  const validatePassword = (value) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    const requirements = [
      /\d/,
      /[a-z]/,
      /[A-Z]/,
      /[!@#$%^&*]/,
      /.{8,}/,
      /\S/,
    ];
    const errorMessages = [
      "Debe incluir al menos un número.",
      "Debe incluir al menos una letra minúscula.",
      "Debe incluir al menos una letra mayúscula.",
      "Debe incluir al menos un carácter especial.",
      "La longitud de la contraseña debe ser igual o mayor a 8 caracteres.",
      "No debe contener espacios en blanco.",
    ];

    const errors = [];
    for (let i = 0; i < requirements.length; i++) {
      if (!requirements[i].test(value)) {
        errors.push(errorMessages[i]);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== same_password) {
      window.alert("Las contraseñas no coinciden");
      return;
    }
    const response = await fetch(`${API_URL}/loginup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        password,
        email,
      }),
    });
    const data = await response.json();

    if (response.status === 200) {
      // Registro exitoso, restablecer los campos y borrar el mensaje de error
      setUser("");
      setEmail("");
      setPassword("");
      setError("");
      window.location.href = `/`;
    } else {
      // Mostrar el mensaje de error en caso de que ocurra un error en el registro
      setError(data.error);
    }
  };

  // Botón de registro con Google 
 
  const onSuccess = async (response) => {
    //console.log("Success: ", response.profileObj);
    
    const token = response.tokenId; // Obtener el token de acceso
    
    try {
      const res_loginupgoogle = await fetch(`${API_URL}/loginupgoogle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
  
      if (res_loginupgoogle.status === 200) {
        window.alert("Registro exitoso");
      } else if (res_loginupgoogle.status === 409) {
        window.alert("El usuario ya existe");
      } else if (res_loginupgoogle.status === 401) {
        window.alert("Token no válido");
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  

 const onFailure = (response) => {
   window.alert("Login Failure: ");
   console.log("Login Failure ", response);
   
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
    <div className="darkTheme">
      <h1>Login UP</h1>
      <form onSubmit={handleSubmit}>
        <h3>Username</h3>
        <input
          type="text"
          onChange={(e) => setUser(e.target.value)}
          value={user}
          placeholder="Username"
          autoFocus
        />
        <br />
        
        <h3>Password</h3>
        <input
          type="password"
          onChange={(e) => {
            setPassword(e.target.value);
            validatePassword(e.target.value);
          }}
          value={password}
          placeholder="Password"
          autoFocus
        />
        
        {/* Mostrar la condición de validación de la contraseña */}
        {error && <p className="errorMessage">{error}</p>}
        
        
        <h3>Confirm Password</h3>
        <input
          type="password"
          onChange={(e) => {
            setSame_password(e.target.value);
            
          }}
          value={same_password}
          placeholder="Validation Password"
          autoFocus
        />
        
        <h3>Email</h3>
        <input
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          placeholder="Email"
          autoFocus
        />
        <br />
        <br />
        <button disabled={error.length > 0 && error !== "User already exists"}>Register</button>

      </form>
      <br/>
      <a href="/">Login In</a>
      <br/>
      <br/>
      

       <GoogleLogin
        clientId="CLIENT_ID_APPIGOOLE"
        buttonText="Register with Google"
        onSuccess={onSuccess}
        onFailure={onFailure}
        cookiePolicy={'single_host_origin'}
      />
    </div>
  );
}

export default Loginup;
