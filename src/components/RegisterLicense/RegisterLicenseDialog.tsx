import React, { useRef, useState, useEffect } from 'react';
import { Modal, notification } from 'antd';
import { invoke } from '@tauri-apps/api/core';

import Header from './Layout/header';
import Footer from './Layout/footer';
import './index.scss';

import {
  SITE_URL,
  LICENSE_PATTERN,
  HTTP_SUCCESS
} from '../utils/consts';

const RegisterLicenseDialog = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [keyParts, setKeyParts] = useState(['', '', '', '']);
  const [email, setEmail] = useState('');
  const licenseInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const emailInputRef = useRef(null);

  const [api, contextHolder] = notification.useNotification();

  const handleChange = (index: number, value: string) => {
    const newParts = [...keyParts];
    newParts[index] = value.slice(0, 4);
    setKeyParts(newParts);

    if (value.length === 4 && index < 3) {
      licenseInputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');

    const match = pastedText.match(LICENSE_PATTERN);
    if (match) {
      e.preventDefault(); // Stop default paste behavior
      const parts = match.slice(1, 5); // Get matched groups
      setKeyParts(parts);

      // Optional: focus last input
      licenseInputsRef.current[3]?.focus();
    }
  };

  const licenseKey = keyParts.join('-');

  const handleRegisteredLicense = async () => {
    invoke('write_license_file')
      .then(() => {
        api.success({
          message: 'Successfully registered',
          placement: 'topRight'
        })
      })
      .catch((err) => {
        throw err;
      })
  }

  const registerLicense = async () => {
    if (!email) {
      api.warning({
        message: 'No email address',
        placement: 'topRight'
      });
      emailInputRef.current?.focus();
      return;
    }

    if (!licenseKey.match(LICENSE_PATTERN)) {
      api.warning({
        message: "Please input valid license key",
        placement: "topRight"
      })
      return;
    }

    fetch(`${SITE_URL}/license/register`, {
      method: 'post',
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({ email, licenseKey })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === HTTP_SUCCESS) {
          handleRegisteredLicense();
        } else {
          api.error({
            message: res.message ? res.message : "Something went wrong, please try again.",
            placement: 'topRight'
          })
        }
      })
      .catch((err) => {
        console.error('Error in register license', err);
        api.error({
          message: "Error",
          description: `${err instanceof Error ? err.message : String(err)
            }, please try again.`
        })
      })
      .finally(onClose)
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      {contextHolder}
      <div className="register-license-dialog">
        <div className="register-license-form">
          <Header className="dialog-header" text="Register License" />
          <div className='dialog-content'>
            <p className='description'>
              Fill in the email address and 4x4 Code values that were provided to you via e-mail after the software was purchased and press on register to register the software.
            </p>
            <div>
              <input
                type="email"
                autoFocus
                ref={emailInputRef}
                className='email-input'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='E-mail'
              />
            </div>
            <div className="license-inputs">
              {keyParts.map((part, index) => (
                <input
                  key={index}
                  type="text"
                  value={part}
                  ref={(el) => (licenseInputsRef.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onPaste={handlePaste}
                  maxLength={4}
                  className="license-part-input"
                  required
                />
              ))}
            </div>
          </div>
          <Footer
            actionText="Register"
            onClose={onClose}
            onSubmit={registerLicense}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RegisterLicenseDialog;
