import { lazy } from 'react';
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const register = lazy(() => import('./pages/register'));
const Changepassword = lazy(() => import('./pages/Changepassword'));
const Chat = lazy(() => import('./pages/Chat'));

const routes = [
  {
    path: '/login',
    component: Login,
    protected: false,
  },
  {
    path: '/',
    component: Home,
    protected: true,
  },
  {
    path: '/register',
    component: register,
    protected: false,
  },
  {
    path: '/changepassword',
    component: Changepassword,
    protected: true,
  },
  {
    path: '/chat',
    component: Chat,
    protected: true,
  },
  {
    path: '/notfound',
    component: NotFound,
    protected: false,
  }
];

export default routes;