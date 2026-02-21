import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import React from 'react';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();

  const handleNavigate = (page) => {
    navigate(createPageUrl(page));
  };

  // Clone children with onNavigate prop if it's a React element
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children, { onNavigate: handleNavigate })
    : children;

  return <>{childrenWithProps}</>;
}