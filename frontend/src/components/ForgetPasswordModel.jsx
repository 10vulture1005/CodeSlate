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
