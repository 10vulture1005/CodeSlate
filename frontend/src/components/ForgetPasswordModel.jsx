import React from 'react'
import './model.css'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input
} from "@heroui/react";
import { useState } from 'react';
import axios from 'axios';
export default function ForgetPasswordModel({ isOpen, onClose }) {
  const [success, setSuccess] = useState(false);


  const handleSubmit = (e) => {
    setSuccess(true);
    // e.preventDefault();
    // const email = document.getElementById('email').value;
    // if (!email) {
    //   alert('Please enter your email address');
    //   return;
    // }
    // axios.post('http://localhost:8080/forgot-password', { email })
    //   .then(response => {
    //     console.log('Password reset email sent:', response.data);
    //     alert('Password reset email sent! Please check your inbox.');
    //   })
    //   .catch(error => {
    //     console.error('There was an error sending the email!', error);
    //     alert('An error occurred. Please try again later.');
    //   });
  };

  return (
    <>
        <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Reset Password</ModalHeader>
            <ModalBody>
              {/* Add form/input if needed */}
              <div>
                {!success && (
                  <>

                  <p>Please enter your registered email address to reset your password.</p>
                  <Input label="Email" type="email" id="email" />

                  </>
                )}
                {success && (
                  <>
                    <p>Please enter OTP sent to given email</p>
                    <Input className='mt-5'  label="OTP" type="text" id="otp" />
                    <p className="text-green-500 mt-2 text-xs">A password reset link has been sent to your email.</p>

                  </>
                )}
              </div>

            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onModalClose}>
                Close
              </Button>
              {!success && (
              <Button color="primary" onPress={handleSubmit}>
                Send Link
              </Button>
              )}
              {success && (
                <Button color="primary" onPress={handleSubmit}>
                  Submit
                </Button>
              )}

            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    </>
  )
}
