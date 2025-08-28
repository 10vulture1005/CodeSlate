import React, { useEffect, useState } from "react";
import axios from "axios"; // Import axios for HTTP requests
import { useDisclosure } from "@heroui/react";
import ForgetPasswordModel from "./ForgetPasswordModel"; // Import the Forget Password model component
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
export default function Login() {
  const [isActive, setIsActive] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const firebaseConfig = {
    apiKey: "AIzaSyCZO0y5fC33rx-WpNyzMBBtmwQP3iOpXu4",
    authDomain: "codeview-ab0d6.firebaseapp.com",
    projectId: "codeview-ab0d6",
    storageBucket: "codeview-ab0d6.firebasestorage.app",
    messagingSenderId: "447102249162",
    appId: "1:447102249162:web:e76dab8d060c6b4319ac33",
    measurementId: "G-G573D47S39",
  };
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser != null) {
      navigate("/lobby");
    }
  }, []);

  const handleRegisterClick = () => {
    setIsActive(true);
  };

  const handleLoginClick = () => {
    setIsActive(false);
  };
  const forgetpassword = () => {
    onOpen();
  };
    const handleGoogleSignin = () => {
      const provider = new GoogleAuthProvider();
      const auth = getAuth();

      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          console.log("Google Sign-In successful:", user);
          navigate('/lobby')
        })
        .catch((error) => {
          console.error("Google Sign-In failed:", error.message);
        });
    };
  const handleSubmitSignUp = (e) => {
    e.preventDefault();
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const passwordconfirm = document.getElementById("conf-pass").value;
    if (!passwordconfirm || !email || !password) {
      alert("Please fill in all fields");
      return;
    }
    if (password == passwordconfirm) {
      const auth = getAuth();

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed up
          const user = userCredential.user;
          handleLoginClick();
          alert("registration suckcesfhool");

          // ...
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          // ..
          console.log(error);
        });
    } else {
      alert(
        "User your Password doesn't match with Confirm Password. Make sure to write the same password in both fields"
      );
    }

    // Here you would typically send the data to your server
    // axios.post('http://localhost:8080/register', { username: name, email, password })
    //   .then(response => {

    //     console.log('Registration successful:', response.data);
    //     handleLoginClick();
    //     alert('Registration successful! You can now log in.');

    //   })
    //   .catch(error => {
    //     console.error('There was an error registering!', error);
    //     alert('An error occurred during registration. Please try again later.');
    //   });
  };
  const handleSubmitSignIn = (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        alert("login sucksesfhool");
        navigate("/lobby");
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error);
      });
    // axios.post(`http://localhost:8080/login`, { username:username, password:password },
    //   {
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   })
    //   .then(res => {

    //     if (res.data) {
    //       console.log('Login successful:', res.data);
    //       alert('Login successful!');

    //       // Here you can redirect the user or perform any other actions after successful login

    //       navigate('./notes',{state: { username: username }});

    //     } else {
    //       alert('Login failed. Please check your credentials.');
    //     }
    //   })
    //   .catch(err => console.error("There was an error logging in!", err));


  };
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        fontFamily: "'Montserrat', sans-serif",
        backgroundColor: "#c9d6ff",
        background: "linear-gradient(to right, #9fb7ff, #7337ff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
      />

      <div
        className={`container ${isActive ? "active" : ""}`}
        style={{
          backgroundColor: "#fff",
          borderRadius: "30px",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.35)",
          position: "relative",
          overflow: "hidden",
          width: "768px",
          maxWidth: "100%",
          minHeight: "480px",
        }}
      >
        {/* Sign Up Form */}
        <div
          className="form-container sign-up"
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            transition: "all 0.6s ease-in-out",
            left: 0,
            width: "50%",
            opacity: isActive ? 1 : 0,
            zIndex: isActive ? 5 : 1,
            transform: isActive ? "translateX(100%)" : "translateX(0)",
            animation: isActive ? "move 0.6s" : "none",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: "0 40px",
              height: "100%",
            }}
          >
            <h1
              style={{
                margin: "20px 0",
                fontSize: "28px",
                fontWeight: "bold",
                color: "#000",
              }}
            >
              Create Account
            </h1>
            <div className="social-icons" style={{
                  border: "1px solid #ccc",
                  borderRadius: "20%",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 3px",
                  width: "40px",
                  height: "40px",
                  color: "#333",
                  textDecoration: "none",
                }}
                    onClick={handleGoogleSignin}
                >
              
                <i className="fa-brands fa-google-plus-g"></i>
              
              {/* <a href="#" className="icon" style={{
                border: '1px solid #ccc',
                borderRadius: '20%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 3px',
                width: '40px',
                height: '40px',
                color: '#333',
                textDecoration: 'none'
              }}>
                <i className="fa-brands fa-facebook-f"></i>
              </a> */}
            </div>
            <span
              style={{ fontSize: "12px", margin: "10px 0", color: "black" }}
            >
              or use your email for registration
            </span>

            {/* <input id="name" type="text" placeholder="Username" style={{
              backgroundColor: '#eee',
              onclick: () => document.getElementById('name').focus(),
              border: 'none',
              margin: '8px 0',
              padding: '10px 15px',
              color: '#000',
              fontSize: '13px',
              borderRadius: '8px',
              width: '100%',
              outline: 'none'
            }} /> */}
            <input
              id="reg-email"
              type="email"
              placeholder="Email"
              style={{
                backgroundColor: "#eee",
                border: "none",
                color: "#000",
                margin: "8px 0",
                padding: "10px 15px",
                fontSize: "13px",
                borderRadius: "8px",
                width: "100%",
                outline: "none",
              }}
            />
            <input
              id="reg-password"
              type="password"
              placeholder="Password"
              style={{
                backgroundColor: "#eee",
                border: "none",
                margin: "8px 0",
                color: "#000",
                padding: "10px 15px",
                fontSize: "13px",
                borderRadius: "8px",
                width: "100%",
                outline: "none",
              }}
            />
            <input
              id="conf-pass"
              type="password"
              placeholder="Confirm Password"
              style={{
                backgroundColor: "#eee",
                border: "none",
                margin: "8px 0",
                color: "#000",
                padding: "10px 15px",
                fontSize: "13px",
                borderRadius: "8px",
                width: "100%",
                outline: "none",
              }}
            />
            <button
              onClick={handleSubmitSignUp}
              style={{
                backgroundColor: "#0040ff",
                color: "#fff",
                fontSize: "12px",
                padding: "10px 45px",
                border: "1px solid transparent",
                borderRadius: "8px",
                fontWeight: "600",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginTop: "10px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#0040ff")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#0040ff")}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Sign In Form */}
        <div
          className="form-container sign-in"
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            transition: "all 0.6s ease-in-out",
            left: 0,
            width: "50%",
            zIndex: 2,
            transform: isActive ? "translateX(100%)" : "translateX(0)",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: "0 40px",
              height: "100%",
            }}
          >
            <h1
              style={{
                margin: "20px 0",
                fontSize: "28px",
                fontWeight: "bold",
                color: "#000",
              }}
            >
              Sign In
            </h1>
            <div className="social-icons" style={{
                  border: "1px solid #ccc",
                  borderRadius: "20%",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 3px",
                  width: "40px",
                  height: "40px",
                  color: "#333",
                  textDecoration: "none",
                }}
                    onClick={handleGoogleSignin}
                >
              
                <i className="fa-brands fa-google-plus-g"></i>
              {/* <a href="#" className="icon" style={{
                border: '1px solid #ccc',
                borderRadius: '20%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 3px',
                width: '40px',
                height: '40px',
                color: '#333',
                textDecoration: 'none'
              }}>
                <i className="fa-brands fa-facebook-f"></i>
              </a> */}
            </div>

            <span style={{ fontSize: "12px", margin: "10px 0", color: "#000" }}>
              or use your email password
            </span>
            <input
              id="email"
              type="email"
              placeholder="Email"
              style={{
                backgroundColor: "#eee",
                border: "none",
                margin: "8px 0",
                color: "#000",
                padding: "10px 15px",
                fontSize: "13px",
                borderRadius: "8px",
                width: "100%",
                outline: "none",
              }}
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              style={{
                backgroundColor: "#eee",
                border: "none",
                color: "#000",
                margin: "8px 0",
                padding: "10px 15px",
                fontSize: "13px",
                borderRadius: "8px",
                width: "100%",
                outline: "none",
              }}
            />
            <a
              href="#"
              onClick={() => forgetpassword()}
              style={{
                color: "#333",

                fontSize: "13px",
                textDecoration: "none",
                margin: "15px 0 10px",
              }}
            >
              Forget Your Password?
            </a>
            <button
              type="button"
              onClick={handleSubmitSignIn}
              style={{
                backgroundColor: "#0040ff",
                color: "#fff",
                fontSize: "12px",
                padding: "10px 45px",
                border: "1px solid transparent",
                borderRadius: "8px",
                fontWeight: "600",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginTop: "10px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#0040ff")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#0040ff")}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Toggle Container */}
        <div
          className="toggle-container"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "50%",
            height: "100%",
            overflow: "hidden",
            transition: "all 0.6s ease-in-out",
            borderRadius: isActive ? "0 150px 100px 0" : "150px 0 0 100px",
            zIndex: 1000,
            transform: isActive ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <div
            className="toggle"
            style={{
              backgroundColor: "#12813c",
              height: "100%",
              background: "linear-gradient(to right, #7b9bfc, #0040ff)",
              color: "#fff",
              position: "relative",
              left: "-100%",
              width: "200%",
              transform: isActive ? "translateX(50%)" : "translateX(0)",
              transition: "all 0.6s ease-in-out",
            }}
          >
            <div
              className="toggle-panel toggle-left"
              style={{
                position: "absolute",
                width: "50%",

                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                textAlign: "center",
                top: 0,
                transform: isActive ? "translateX(0)" : "translateX(-200%)",
                transition: "all 0.6s ease-in-out",
              }}
            >
              <h1
                style={{
                  margin: "20px 0",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              >
                Welcome Back!
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  width: "80%",
                  lineHeight: "20px",
                  letterSpacing: "0.3px",
                  margin: "20px 0",
                }}
              >
                Enter your personal details to use all of site features
              </p>
              <button
                className="hiddens"
                onClick={handleLoginClick}
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#fff",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "10px 45px",
                  border: "1px solid #fff",
                  borderRadius: "8px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginTop: "10px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Sign In
              </button>
            </div>
            <div
              className="toggle-panel toggle-right"
              style={{
                position: "absolute",
                width: "50%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                textAlign: "center",
                top: 0,
                right: 0,
                transform: isActive ? "translateX(200%)" : "translateX(0)",
                transition: "all 0.6s ease-in-out",
              }}
            >
              <h1
                style={{
                  margin: "20px 0",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              >
                Hello, Friend!
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: "20px",
                  width: "80%",
                  letterSpacing: "0.3px",
                  margin: "20px 0",
                }}
              >
                Register with your personal details to use all of site features
              </p>
              <button
                className="hiddens"
                onClick={handleRegisterClick}
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#fff",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "10px 45px",
                  border: "1px solid #fff",
                  borderRadius: "8px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginTop: "10px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      <ForgetPasswordModel isOpen={isOpen} onClose={onClose} />
    </div>
  );
}
