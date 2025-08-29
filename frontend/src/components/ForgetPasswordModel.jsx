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
import { auth } from './firebase/config'; // Your Firebase config
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgetPasswordModel({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email, {
        // Custom action code settings
        url: `${window.location.origin}/reset-password`, // Redirect URL after reset
        handleCodeInApp: false, // Handle in email, not in app
      });
      
      setSuccess(true);
      setError('');
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Handle different error cases
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        default:
          setError('Failed to send reset email. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setEmail('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleResendEmail = () => {
    setSuccess(false);
    setError('');
    // Allow user to send another reset email
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={handleClose}>
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Reset Password
              </ModalHeader>
              <ModalBody>
                <div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                  
                  {!success && (
                    <>
                      <p className="mb-4 text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                      <Input 
                        label="Email Address" 
                        type="email" 
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        isRequired
                        placeholder="Enter your registered email"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Make sure to check your spam folder if you don't see the email.
                      </p>
                    </>
                  )}

                  {success && (
                    <div className="text-center py-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-green-800 font-semibold mb-2">
                          Reset Email Sent!
                        </h3>
                        <p className="text-green-700 text-sm mb-2">
                          A password reset link has been sent to:
                        </p>
                        <p className="text-green-800 font-medium mb-3">
                          {email}
                        </p>
                        <p className="text-green-600 text-xs">
                          Click the link in the email to reset your password. The link will expire in 1 hour.
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>Didn't receive the email?</p>
                        <button 
                          onClick={handleResendEmail}
                          className="text-blue-600 hover:text-blue-800 underline mt-1"
                        >
                          Send another reset email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={handleClose}
                  disabled={loading}
                >
                  {success ? 'Done' : 'Cancel'}
                </Button>
                
                {!success && (
                  <Button 
                    color="primary" 
                    onPress={handleSendResetEmail}
                    isLoading={loading}
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending...' : 'Send Reset Email'}
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