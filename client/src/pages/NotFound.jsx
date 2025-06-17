import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
        <Link to="/">Go to Home</Link>
    </div>
);

export default NotFound;