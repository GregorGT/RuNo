import React from 'react';

interface FooterProps {
  onClose: () => void,
  onSubmit?: () => void,
  actionText?: string
}

const Footer: React.FC<FooterProps> = (props) => {
  return (
    <div className='actions'>
      <button type="button" onClick={props.onClose}>
        Cancel
      </button>
      <button type="button" onClick={props.onSubmit}>{props.actionText}</button>
    </div>
  )
}

export default Footer;