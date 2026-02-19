import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RefreshHandler = ({ setisAuthenticated, setIsAuthLoading }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      setisAuthenticated(true);
      setIsAuthLoading(false);
      if (
        location.pathname === '/login' ||
        location.pathname === '/register'
      ) {
        navigate('/report', { replace: true });
      }
    } else {
      setisAuthenticated(false);
      setIsAuthLoading(false);
    }
  }, [location.pathname, navigate, setisAuthenticated, setIsAuthLoading]);
  return null;
};

export default RefreshHandler;
