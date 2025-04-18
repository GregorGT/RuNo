import React, { useRef, useState, useEffect } from 'react';
import Header from '../Layout/header';
import Footer from '../Layout/footer';
import '../index.scss';

interface RegisterLicenseModalProps {
  closeModal: () => void;
  onSubmit: (form: { name: string; email: string; licenseKey: string }) => void;
}

const RegisterLicenseModal: React.FC<RegisterLicenseModalProps> = (props) => {
  const [keyParts, setKeyParts] = useState(['', '', '', '']);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const newParts = [...keyParts];
    newParts[index] = value.slice(0, 4); // Limit to 4 characters
    setKeyParts(newParts);

    // Auto move to next input if 4 chars are entered
    if (value.length === 4 && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
  
    const match = pastedText.match(/^([A-Za-z0-9]{4})-([A-Za-z0-9]{4})-([A-Za-z0-9]{4})-([A-Za-z0-9]{4})$/);
    if (match) {
      e.preventDefault(); // Stop default paste behavior
      const parts = match.slice(1, 5); // Get matched groups
      setKeyParts(parts);
  
      // Optional: focus last input
      inputsRef.current[3]?.focus();
    }
  };
  
  const licenseKey = keyParts.join('-');

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  return (
    <div className="register-license-modal">
      <div className="register-license-form">
        <Header className="modal-header" text="Register License" />
        <div className='modal-content'>
          <label>
            Fill in the 4x4 Code values that were provided to you via e-mail after the software was purchased and press on register to register the software.
            <div className="license-inputs">
              {keyParts.map((part, index) => (
                <input
                  key={index}
                  type="text"
                  value={part}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onPaste={handlePaste}
                  maxLength={4}
                  className="license-part-input"
                  required
                />
              ))}
            </div>
          </label>
        </div>
        <Footer
          actionText="Register"
          onClose={props.closeModal}
          onSubmit={() => alert(`Submitted license key: ${licenseKey}`)}
        />
      </div>
    </div>
  );
};

export default RegisterLicenseModal;
