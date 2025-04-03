// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  enableIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQaHyx81V1b8q7-7XWLP9UlW4zjTd0SC8",
    authDomain: "xpensepal-a5042.firebaseapp.com",
    projectId: "xpensepal-a5042",
    storageBucket: "xpensepal-a5042.appspot.com",
    messagingSenderId: "14137785761",
    appId: "1:14137785761:web:592af038e9a388013f9fe0"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable persistence with error handling
    enableIndexedDbPersistence(db)
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code === 'unimplemented') {
                console.warn('The current browser does not support persistence.');
            }
        });
    
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Make functions available globally
window.handleSignUp = async function(event) {
  event.preventDefault();
  
  if (!auth || !db) {
    showError("Firebase not initialized. Please refresh the page.");
    return;
  }
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const phone = document.getElementById('phone').value.trim();
  
  // Basic validation
  if (!name || !email || !password) {
    showError("Please fill in all required fields");
    return;
  }
  
  if (password.length < 6) {
    showError("Password must be at least 6 characters long");
    return;
  }
  
  if (phone && !/^[0-9]{10}$/.test(phone)) {
    showError("Please enter a valid 10-digit phone number");
    return;
  }
  
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with name
    await updateProfile(user, {
      displayName: name
    });
    
    // Store comprehensive user information in Firestore
    const userData = {
      uid: user.uid,
      name: name,
      email: email,
      phoneNumber: phone || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      lastSeen: serverTimestamp(),
      profileComplete: true,
      totalExpenses: 0,
      totalPayments: 0,
      rooms: [],
      settings: {
        notifications: true,
        emailUpdates: true,
        currency: 'USD',
        theme: 'light'
      },
      profileImageUrl: '',
      status: 'active',
      address: '',
      bio: '',
      preferences: {
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    // Use collection reference for better error handling
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, userData);
    
    console.log("User created successfully!");
    window.location.replace("dashboard.html");
  } catch (error) {
    console.error("Error creating user:", error.code, error.message);
    let errorMessage = "An error occurred during sign up";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "This email is already registered";
        break;
      case 'auth/invalid-email':
        errorMessage = "Please enter a valid email address";
        break;
      case 'auth/weak-password':
        errorMessage = "Password should be at least 6 characters";
        break;
      default:
        errorMessage = error.message;
    }
    
    showError(errorMessage);
  }
};

window.handleLogin = async function(event) {
  event.preventDefault();
  
  if (!auth || !db) {
    showError("Firebase not initialized. Please refresh the page.");
    return;
  }
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // Basic validation
  if (!email || !password) {
    showError("Please fill in all fields");
    return;
  }
  
  try {
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login timestamp
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      lastLogin: serverTimestamp()
    }, { merge: true });
    
    console.log("User logged in successfully!");
    window.location.replace("dashboard.html");
  } catch (error) {
    console.error("Error logging in:", error.code, error.message);
    let errorMessage = "Wrong login details. Please check your email and password.";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "Wrong login details. Please check your email and password.";
        break;
      case 'auth/wrong-password':
        errorMessage = "Wrong login details. Please check your email and password.";
        break;
      case 'auth/invalid-email':
        errorMessage = "Please enter a valid email address.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Too many failed attempts. Please try again later.";
        break;
      case 'auth/user-disabled':
        errorMessage = "This account has been disabled. Please contact support.";
        break;
      default:
        errorMessage = "Wrong login details. Please check your email and password.";
    }
    
    showError(errorMessage);
    
    // Clear the password field for security
    document.getElementById('password').value = '';
  }
};

window.handleLogout = async function() {
  try {
    await signOut(auth);
    console.log("User logged out successfully");
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Error logging out:", error.message);
    showError("Error logging out. Please try again.");
  }
};

window.showSignUp = function() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  // Clear any existing error messages
  const errorElement = document.getElementById('auth-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
};

window.showLogin = function() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  // Clear any existing error messages
  const errorElement = document.getElementById('auth-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
};

// Handle user session state
function initAuthStateListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user.uid);
      // Only redirect to dashboard if explicitly logging in
      // Remove automatic redirect from here
    } else {
      // User is signed out
      console.log("User is signed out");
      // Redirect to login if on a protected page
      const protectedPages = ['/dashboard.html', '/expenses.html', '/groups.html'];
      const currentPath = window.location.pathname;
      
      if (protectedPages.includes(currentPath)) {
        window.location.href = "/index.html";
      }
    }
  });
}

// Get current user data
async function getCurrentUserData() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error("No user is signed in");
    return null;
  }
  
  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No user data found!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

// Helper function to display error messages
function showError(message) {
  // Create or update error element
  let errorElement = document.getElementById('auth-error');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'auth-error';
    errorElement.className = 'error-message';
    
    // Insert after the form button
    const forms = document.querySelectorAll('form');
    const activeForm = Array.from(forms).find(form => !form.closest('.hidden'));
    
    if (activeForm) {
      activeForm.querySelector('button').insertAdjacentElement('afterend', errorElement);
    }
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Hide after 5 seconds
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

// Initialize auth state listener when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuthStateListener();
  
  // Add logout button listener if it exists
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
});