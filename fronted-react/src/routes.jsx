// routes.js
import { lazy } from 'react';


const Login = lazy(() => import('./components/Login'));
const Home = lazy(() => import('./components/Home'));
const Loginup = lazy(() => import('./components/Loginup'));
const Changepassword = lazy(() => import('./components/Changepassword'));
const Chat = lazy(() => import('./components/Chat'));

const routes = [
  {
    path: '/',
    component: Login,
    protected: false, // Esta ruta no requiere autenticación
  },
  {
    path: '/home',
    component: Home,
    protected: true, // Esta ruta requiere autenticación
  },
  {
    path: '/loginup',
    component: Loginup,
    protected: false, // Esta ruta no requiere autenticación
  },
  {
    path: '/changepassword',
    component: Changepassword,
    protected: true, // Esta ruta requiere autenticación
  },
  {
    path: '/home/chat',
    component: Chat,
    protected: true, // Esta ruta requiere autenticación
  }
 
];

export default routes;