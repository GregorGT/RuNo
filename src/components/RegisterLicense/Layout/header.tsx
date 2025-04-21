import React from 'react';

interface HeaderProps {
  className?: string,
  text?: string
}

const Header: React.FC<HeaderProps> = (props) => {
  return (
    <div className={props.className}>
      <h4>{props.text}</h4>
    </div>
  )
}

export default Header;