import React, { useEffect, useState } from 'react';
import "../changepasword.css";

// Conection to backend flask
const API_URL = import.meta.env.VITE_REACT_APP_API;

function Changepassword() {
  const [user, setUser] = useState('');
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  const [password, setNewPassword] = useState("");
  const [email, setEmail] = useState("");

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


    const getEmail = async (id) => {
        const response = await fetch(`${API_URL}/loginup/${id}`);  // Cambia la URL para que coincida con la ruta de obtención de email en tu backend

        if (response.ok) {
            const user = await response.json();
            setEmail(user.email);  // Establece el estado del email obtenido
        } else {
            console.log('Error al obtener el email');
        }
        };

  useEffect(() => {
    const storedUser = localStorage.getItem('userForChangePassword');
    const storedId = localStorage.getItem('idForChangePassword');
    const storedToken = localStorage.getItem('tokenForChangePassword');

    if (!storedUser && !storedId) {
      // Si no se encuentran los datos necesarios en el almacenamiento local, redirigir al inicio de sesión
      window.location.replace('/');
    } else {
      // Si se encuentran los datos, establecer el estado correspondiente
      setUser(storedUser);
      setId(storedId);
      setToken(storedToken);
      getEmail(storedId); // Llamada a la función para obtener el email
    }

    // Limpiar los datos del almacenamiento local después de obtenerlos
    //localStorage.removeItem('userForChangePassword');
    //localStorage.removeItem('idForChangePassword');

    
  }, []);

  const Home = () => {

    // Redireccionar a la página de cambio de contraseña
    window.location.href = '/home';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== same_password) {
      window.alert("Las contraseñas no coinciden");
      return;
    }

    const response = await fetch(`${API_URL}/loginup/${id}`, {  // Cambia la URL para que coincida con la ruta de inicio de sesión en tu backend
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        email ,
        password,
      }),
    });

    if (response.status === 200) {
        // La contraseña se ha modificado exitosamente
        setNewPassword("");
        setSame_password("");
        console.log('Contraseña modificada correctamente');
        window.alert('Contraseña modificada correctamente');
      } else {
        // Ocurrió un error al modificar la contraseña
        console.log('Error al modificar la contraseña');
      } 
  };




  return (
    <div className="darkTheme">
    <h1>Changepassword, {user} , ID:{id}! </h1>
    <button onClick={Home}>Home</button>
    <br/>
    <br/>
    <form onSubmit={handleSubmit}>
    <h3>New Password</h3>
    <input
          type="password"
          onChange={(e) => {
            setNewPassword(e.target.value);
            validatePassword(e.target.value);
          }}
          value={password}
          placeholder="NewPassword"
        />
        
        {/* Mostrar la condición de validación de la contraseña */}
        {error && <p className="errorMessage">{error}</p>}
        
        
        <h3>Confrim New Password</h3>
        <input
          type="password"
          onChange={(e) => {
            setSame_password(e.target.value);
            
          }}
          value={same_password}
          placeholder="Validation Password"
          
        />
        <h3>Email</h3>
        <input
          type="text"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          placeholder={email}
        />
        <br/>
        <br/>
        <button className="modify">Update</button>
    </form>
    
    </div>
  );
}

export default Changepassword;
