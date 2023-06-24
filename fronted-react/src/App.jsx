import React, { Suspense } from 'react';
import { Router, Switch, Route } from 'wouter';
import routes from './routes';

import './index.css';

function App() {
  const isAuthenticated = () => {
    // Verificar si el usuario tiene un token de autenticación válido almacenado
    const token = localStorage.getItem('token');
    return token !== null; // Cambia esto según tu lógica de autenticación
  };
  const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
      {...rest}
      component={(props) =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect to="/" />
        )
      }
    />
  );
  



  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
      <Switch>
          {routes.map((route) => {
            if (route.protected) {
              return (
                <PrivateRoute
                  key={route.path}
                  path={route.path}
                  component={route.component}
                />
              );
            } else {
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  component={route.component}
                />
              );
            }
          })}
        </Switch>
      </Suspense>
    </Router>
  );
}

export default App;

//Descargar dependencia primero
// npm install 

/* puedes utilizar la función useRoutes de la biblioteca wouter. A continuación te mostraré cómo configurar y utilizar wouter en una aplicación React con Vite:
npm install wouter */


//const API_URL = import.meta.env.VITE_REACT_APP_API;
// para eso usar npm install dotenv
