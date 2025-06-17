import { Suspense } from 'react';
import { Router, Switch, Route, Redirect } from 'wouter';
import routes from './routes';
import './assets/css/index.css';

function App() {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return token !== null;
  };

  const PublicRoute = ({ component: Component, ...rest }) => (

    <Route
      {...rest}
      component={(props) => {
        const path = rest.path;
        const token = isAuthenticated();
        if (path === '/') {
          if (!token) {
            return <Redirect to="/login" />;
          }
        }

        if (token && (path === '/login' || path === '/register')) {
          return <Redirect to="/" />;
        }

        if (!token && path !== '/login' && path !== '/register') {
          return <Redirect to="/login" />;
        }
        if (!routes.some(r => r.path === path)) {
          return <Redirect to="/notfound" />;
        }
        return <Component {...props} />;
      }}
    />
  );

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          {routes.map((route) => {
            if (route.protected) {
              return (
                <PublicRoute
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
