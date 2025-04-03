// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, query, where, getDocs, getDoc, increment, arrayUnion } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Your Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBQaHyx81V1b8q7-7XWLP9UlW4zjTd0SC8",
        authDomain: "xpensepal-a5042.firebaseapp.com",
        projectId: "xpensepal-a5042",
        storageBucket: "xpensepal-a5042.firebasestorage.app",
        messagingSenderId: "14137785761",
        appId: "1:14137785761:web:592af038e9a388013f9fe0"
      };
    // Add your Firebase config here


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize collections
const roomsCollection = collection(db, 'rooms');
const usersCollection = collection(db, 'users');
const roomCodesCollection = collection(db, 'room_codes');

// Generate a random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new room
async function createRoom() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        const roomCode = generateRoomCode();
        
        // Create room document
        const roomData = {
            code: roomCode,
            createdBy: {
                userId: currentUser.uid,
                email: currentUser.email,
                name: currentUser.displayName || 'Anonymous'
            },
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'active',
            members: [{
                userId: currentUser.uid,
                email: currentUser.email,
                name: currentUser.displayName || 'Anonymous',
                role: 'admin',
                joinedAt: new Date().toISOString(),
                status: 'active',
                totalPaid: 0,
                totalOwed: 0
            }],
            memberEmails: [currentUser.email],
            totalExpenses: 0,
            expenses: []
        };

        // Save room to Firestore
        const roomRef = await addDoc(roomsCollection, roomData);
        const roomId = roomRef.id;

        // Save room reference in user's data
        await setDoc(doc(db, 'users', currentUser.uid, 'rooms', roomId), {
            roomId: roomId,
            roomCode: roomCode,
            joinedAt: new Date().toISOString(),
            role: 'admin'
        });

        // Store room info in localStorage
        localStorage.setItem('currentRoomId', roomId);
        localStorage.setItem('roomCode', roomCode);

        alert('Room created successfully! Room Code: ' + roomCode);
        window.location.href = 'expense.html';

    } catch (error) {
        console.error('Error creating room:', error);
        alert('Error creating room: ' + error.message);
    }
}

// Join an existing room
async function joinRoom() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        const roomCodeInput = document.getElementById('roomCode');
        if (!roomCodeInput) {
            alert('Room code input not found');
            return;
        }

        const roomCode = roomCodeInput.value.trim().toUpperCase();
        if (!roomCode) {
            alert('Please enter a room code');
            return;
        }

        // Find room with the given code
        const roomQuery = query(roomsCollection, where('code', '==', roomCode));
        const roomSnapshot = await getDocs(roomQuery);

        if (roomSnapshot.empty) {
            alert('Room not found');
            return;
        }

        const roomDoc = roomSnapshot.docs[0];
        const roomData = roomDoc.data();
        const roomId = roomDoc.id;

        // Check if user is already a member
        if (roomData.memberEmails.includes(currentUser.email)) {
            alert('You are already a member of this room');
            localStorage.setItem('currentRoomId', roomId);
            localStorage.setItem('roomCode', roomCode);
            window.location.href = 'expense.html';
            return;
        }

        // Get user's full profile data
        const userDoc = await getDoc(doc(usersCollection, currentUser.uid));
        const userData = userDoc.data() || {};

        // Add new member to room with enhanced details
        const newMember = {
            userId: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || 'Anonymous',
            role: 'member',
            joinedAt: new Date().toISOString(),
            status: 'active',
            totalPaid: 0,
            totalOwed: 0,
            profile: {
                phoneNumber: userData.phoneNumber || '',
                profileImageUrl: userData.profileImageUrl || '',
                lastSeen: new Date().toISOString(),
                preferences: userData.preferences || {
                    notifications: true,
                    emailUpdates: true
                }
            },
            statistics: {
                expensesAdded: 0,
                lastExpenseAdded: null,
                totalSettlements: 0,
                lastSettlement: null
            }
        };

        // Update room with new member
        await updateDoc(doc(roomsCollection, roomId), {
            members: [...roomData.members, newMember],
            memberEmails: [...roomData.memberEmails, currentUser.email],
            lastUpdated: new Date().toISOString(),
            memberCount: (roomData.memberCount || 0) + 1
        });

        // Save room reference in user's data with enhanced details
        await setDoc(doc(db, 'users', currentUser.uid, 'rooms', roomId), {
            roomId: roomId,
            roomCode: roomCode,
            joinedAt: new Date().toISOString(),
            role: 'member',
            lastVisited: new Date().toISOString(),
            status: 'active',
            notifications: {
                enabled: true,
                newExpense: true,
                settlement: true,
                memberJoined: true
            }
        });

        // Create or update room code document in room_codes collection
        const roomCodeRef = doc(roomCodesCollection, roomCode);
        const roomCodeDoc = await getDoc(roomCodeRef);

        const joiningRecord = {
            userId: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || 'Anonymous',
            joinedAt: new Date().toISOString(),
            role: 'member',
            status: 'active'
        };

        if (roomCodeDoc.exists()) {
            // Update existing room code document
            await updateDoc(roomCodeRef, {
                lastUpdated: new Date().toISOString(),
                totalJoins: increment(1),
                joiningHistory: arrayUnion(joiningRecord),
                currentMembers: arrayUnion({
                    userId: currentUser.uid,
                    email: currentUser.email,
                    name: currentUser.displayName || 'Anonymous',
                    joinedAt: new Date().toISOString(),
                    role: 'member',
                    status: 'active'
                })
            });
        } else {
            // Create new room code document
            await setDoc(roomCodeRef, {
                roomCode: roomCode,
                roomId: roomId,
                createdBy: {
                    userId: roomData.createdBy.userId,
                    email: roomData.createdBy.email,
                    name: roomData.createdBy.name
                },
                createdAt: roomData.createdAt,
                lastUpdated: new Date().toISOString(),
                totalJoins: 1,
                joiningHistory: [joiningRecord],
                currentMembers: [{
                    userId: currentUser.uid,
                    email: currentUser.email,
                    name: currentUser.displayName || 'Anonymous',
                    joinedAt: new Date().toISOString(),
                    role: 'member',
                    status: 'active'
                }],
                roomDetails: {
                    name: roomData.name || 'Unnamed Room',
                    status: roomData.status || 'active',
                    totalMembers: (roomData.memberCount || 0) + 1,
                    totalExpenses: roomData.totalExpenses || 0
                }
            });
        }

        // Update user's last activity
        await updateDoc(doc(usersCollection, currentUser.uid), {
            lastActive: new Date().toISOString(),
            'profile.lastSeen': new Date().toISOString()
        });

        // Store room info in localStorage
        localStorage.setItem('currentRoomId', roomId);
        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('userRole', 'member');

        alert('Successfully joined room!');
        window.location.href = 'expense.html';

    } catch (error) {
        console.error('Error joining room:', error);
        alert('Error joining room: ' + error.message);
    }
}

// Check if user is in any rooms on page load
async function checkUserRooms() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userRoomsRef = collection(db, 'users', currentUser.uid, 'rooms');
        const userRoomsSnapshot = await getDocs(userRoomsRef);

        if (!userRoomsSnapshot.empty) {
            const roomData = userRoomsSnapshot.docs[0].data();
            localStorage.setItem('currentRoomId', roomData.roomId);
            localStorage.setItem('roomCode', roomData.roomCode);
        }
    } catch (error) {
        console.error('Error checking user rooms:', error);
    }
}

// Function to fetch and display all rooms
async function displayAllRooms() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Get all rooms from Firestore
        const roomsSnapshot = await getDocs(roomsCollection);
        
        if (roomsSnapshot.empty) {
            console.log('No rooms found');
            return;
        }

        // Create a table to display room details
        const tableHTML = `
            <table class="rooms-table">
                <thead>
                    <tr>
                        <th>Room Code</th>
                        <th>Created By</th>
                        <th>Created At</th>
                        <th>Members</th>
                        <th>Status</th>
                        <th>Total Expenses</th>
                    </tr>
                </thead>
                <tbody>
        `;

        roomsSnapshot.forEach(doc => {
            const roomData = doc.data();
            const membersList = roomData.members.map(member => member.name).join(', ');
            
            tableHTML += `
                <tr>
                    <td>${roomData.code}</td>
                    <td>${roomData.createdBy.name}</td>
                    <td>${new Date(roomData.createdAt).toLocaleDateString()}</td>
                    <td>${membersList}</td>
                    <td>${roomData.status}</td>
                    <td>${roomData.totalExpenses}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        // Display the table in the room list container
        const roomListContainer = document.getElementById('roomListContainer');
        if (roomListContainer) {
            roomListContainer.innerHTML = tableHTML;
        }

        // Add event listeners to table rows
        const tableRows = document.querySelectorAll('.rooms-table tbody tr');
        tableRows.forEach(row => {
            row.addEventListener('click', () => {
                const roomCode = row.cells[0].textContent;
                document.getElementById('roomCode').value = roomCode;
                joinRoom();
            });
        });

    } catch (error) {
        console.error('Error fetching rooms:', error);
        alert('Error fetching rooms: ' + error.message);
    }
}

// Function to fetch room details by code
async function getRoomDetails(roomCode) {
    try {
        const roomQuery = query(roomsCollection, where('code', '==', roomCode));
        const roomSnapshot = await getDocs(roomQuery);

        if (roomSnapshot.empty) {
            return null;
        }

        const roomDoc = roomSnapshot.docs[0];
        return {
            id: roomDoc.id,
            ...roomDoc.data()
        };
    } catch (error) {
        console.error('Error fetching room details:', error);
        throw error;
    }
}

// Function to update all room codes
async function updateAllRoomCodes() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Get all rooms from Firestore
        const roomsSnapshot = await getDocs(roomsCollection);
        
        if (roomsSnapshot.empty) {
            console.log('No rooms found');
            return;
        }

        // Update each room's code
        const updatePromises = roomsSnapshot.docs.map(async (doc) => {
            const roomData = doc.data();
            const newRoomCode = generateRoomCode();
            
            // Update the room document with new code
            await updateDoc(doc.ref, {
                code: newRoomCode,
                lastUpdated: new Date().toISOString()
            });

            // Update the room reference in each member's data
            const memberUpdatePromises = roomData.members.map(async (member) => {
                const userRoomsRef = doc(db, 'users', member.userId, 'rooms', doc.id);
                await updateDoc(userRoomsRef, {
                    roomCode: newRoomCode,
                    lastUpdated: new Date().toISOString()
                });
            });

            await Promise.all(memberUpdatePromises);
            return { roomId: doc.id, newCode: newRoomCode };
        });

        const results = await Promise.all(updatePromises);
        console.log('Updated room codes:', results);
        alert('All room codes have been updated successfully!');
        
        // Refresh the room list display
        displayAllRooms();

    } catch (error) {
        console.error('Error updating room codes:', error);
        alert('Error updating room codes: ' + error.message);
    }
}

// Function to update all rooms in Firestore
async function updateAllRoomsInFirestore() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Get all rooms from Firestore
        const roomsSnapshot = await getDocs(roomsCollection);
        
        if (roomsSnapshot.empty) {
            console.log('No rooms found');
            return;
        }

        // Update each room with enhanced data structure
        const updatePromises = roomsSnapshot.docs.map(async (doc) => {
            const roomData = doc.data();
            
            // Enhanced room data structure
            const updatedRoomData = {
                ...roomData,
                lastUpdated: new Date().toISOString(),
                memberCount: roomData.members?.length || 0,
                totalExpenses: roomData.expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0,
                status: roomData.status || 'active',
                settings: {
                    allowNewMembers: true,
                    requireApproval: false,
                    defaultCurrency: 'USD',
                    expenseCategories: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Other'],
                    ...roomData.settings
                },
                statistics: {
                    totalExpenses: roomData.expenses?.length || 0,
                    totalSettlements: roomData.settlements?.length || 0,
                    lastActivity: new Date().toISOString(),
                    ...roomData.statistics
                }
            };

            // Update members with enhanced data
            if (roomData.members) {
                updatedRoomData.members = roomData.members.map(member => ({
                    ...member,
                    status: member.status || 'active',
                    totalPaid: member.totalPaid || 0,
                    totalOwed: member.totalOwed || 0,
                    profile: {
                        phoneNumber: member.profile?.phoneNumber || '',
                        profileImageUrl: member.profile?.profileImageUrl || '',
                        lastSeen: new Date().toISOString(),
                        preferences: {
                            notifications: true,
                            emailUpdates: true,
                            ...member.profile?.preferences
                        },
                        ...member.profile
                    },
                    statistics: {
                        expensesAdded: member.statistics?.expensesAdded || 0,
                        lastExpenseAdded: member.statistics?.lastExpenseAdded || null,
                        totalSettlements: member.statistics?.totalSettlements || 0,
                        lastSettlement: member.statistics?.lastSettlement || null,
                        ...member.statistics
                    }
                }));
            }

            // Update the room document
            await updateDoc(doc.ref, updatedRoomData);

            // Update room references in each member's data
            if (roomData.members) {
                const memberUpdatePromises = roomData.members.map(async (member) => {
                    const userRoomsRef = doc(db, 'users', member.userId, 'rooms', doc.id);
                    await updateDoc(userRoomsRef, {
                        roomId: doc.id,
                        roomCode: roomData.code,
                        joinedAt: member.joinedAt || new Date().toISOString(),
                        role: member.role || 'member',
                        lastVisited: new Date().toISOString(),
                        status: 'active',
                        notifications: {
                            enabled: true,
                            newExpense: true,
                            settlement: true,
                            memberJoined: true,
                            ...member.notifications
                        }
                    });
                });
                await Promise.all(memberUpdatePromises);
            }

            return { roomId: doc.id, status: 'updated' };
        });

        const results = await Promise.all(updatePromises);
        console.log('Updated rooms:', results);
        alert('All rooms have been updated successfully!');
        
        // Refresh the room list display
        displayAllRooms();

    } catch (error) {
        console.error('Error updating rooms:', error);
        alert('Error updating rooms: ' + error.message);
    }
}

// Function to display room codes history with enhanced details
async function displayRoomCodesHistory() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Get all room codes from Firestore
        const roomCodesSnapshot = await getDocs(roomCodesCollection);
        
        if (roomCodesSnapshot.empty) {
            console.log('No room codes found');
            return;
        }

        // Create a table to display room code history
        const tableHTML = `
            <table class="rooms-table">
                <thead>
                    <tr>
                        <th>Room Code</th>
                        <th>Created By</th>
                        <th>Created At</th>
                        <th>Current Members</th>
                        <th>Total Joins</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        roomCodesSnapshot.forEach(doc => {
            const roomCodeData = doc.data();
            const currentMembersList = roomCodeData.currentMembers
                .map(member => member.name)
                .join(', ');
            
            tableHTML += `
                <tr>
                    <td>${roomCodeData.roomCode}</td>
                    <td>${roomCodeData.createdBy.name}</td>
                    <td>${new Date(roomCodeData.createdAt).toLocaleDateString()}</td>
                    <td>${currentMembersList}</td>
                    <td>${roomCodeData.totalJoins}</td>
                    <td>${roomCodeData.roomDetails.status}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        // Display the table in the room list container
        const roomListContainer = document.getElementById('roomListContainer');
        if (roomListContainer) {
            roomListContainer.innerHTML = tableHTML;
        }

    } catch (error) {
        console.error('Error fetching room codes history:', error);
        alert('Error fetching room codes history: ' + error.message);
    }
}

// Function to initialize room_codes collection
async function initializeRoomCodesCollection() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Get all rooms from Firestore
        const roomsSnapshot = await getDocs(roomsCollection);
        
        if (roomsSnapshot.empty) {
            console.log('No rooms found to initialize room_codes collection');
            return;
        }

        // Create room_codes documents for each room
        const initializationPromises = roomsSnapshot.docs.map(async (roomDoc) => {
            const roomData = roomDoc.data();
            const roomCode = roomData.code;
            const roomId = roomDoc.id;

            // Create room code document
            const roomCodeRef = doc(roomCodesCollection, roomCode);
            const roomCodeDoc = await getDoc(roomCodeRef);

            if (!roomCodeDoc.exists()) {
                // Create new room code document
                await setDoc(roomCodeRef, {
                    roomCode: roomCode,
                    roomId: roomId,
                    createdBy: {
                        userId: roomData.createdBy.userId,
                        email: roomData.createdBy.email,
                        name: roomData.createdBy.name
                    },
                    createdAt: roomData.createdAt,
                    lastUpdated: new Date().toISOString(),
                    totalJoins: roomData.members.length,
                    joiningHistory: roomData.members.map(member => ({
                        userId: member.userId,
                        email: member.email,
                        name: member.name,
                        joinedAt: member.joinedAt || new Date().toISOString(),
                        role: member.role,
                        status: member.status || 'active'
                    })),
                    currentMembers: roomData.members.map(member => ({
                        userId: member.userId,
                        email: member.email,
                        name: member.name,
                        joinedAt: member.joinedAt || new Date().toISOString(),
                        role: member.role,
                        status: member.status || 'active'
                    })),
                    roomDetails: {
                        name: roomData.name || 'Unnamed Room',
                        status: roomData.status || 'active',
                        totalMembers: roomData.members.length,
                        totalExpenses: roomData.totalExpenses || 0
                    }
                });
                console.log(`Created room code document for ${roomCode}`);
            }
        });

        await Promise.all(initializationPromises);
        alert('Room codes collection has been initialized successfully!');
        
        // Refresh the room list display
        displayAllRooms();

    } catch (error) {
        console.error('Error initializing room_codes collection:', error);
        alert('Error initializing room_codes collection: ' + error.message);
    }
}

// Add event listener to display rooms when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            checkUserRooms();
            displayAllRooms(); // Display all rooms when user is logged in
        } else {
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('roomCode');
            localStorage.removeItem('userRole');
        }
    });

    // Add event listeners to buttons
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }

    const joinRoomBtn = document.getElementById('joinRoomBtn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', joinRoom);
    }

    // Add button for updating room codes
    const updateRoomCodesBtn = document.createElement('button');
    updateRoomCodesBtn.id = 'updateRoomCodesBtn';
    updateRoomCodesBtn.className = 'btn-secondary';
    updateRoomCodesBtn.textContent = 'Update All Room Codes';
    updateRoomCodesBtn.addEventListener('click', updateAllRoomCodes);
    
    const roomActions = document.querySelector('.room-actions');
    if (roomActions) {
        roomActions.appendChild(updateRoomCodesBtn);
    }

    // Add button for updating rooms
    const updateRoomsBtn = document.createElement('button');
    updateRoomsBtn.id = 'updateRoomsBtn';
    updateRoomsBtn.className = 'btn-secondary';
    updateRoomsBtn.textContent = 'Update All Rooms';
    updateRoomsBtn.addEventListener('click', updateAllRoomsInFirestore);
    
    if (roomActions) {
        roomActions.appendChild(updateRoomsBtn);
    }

    // Add button for viewing room codes history
    const viewHistoryBtn = document.createElement('button');
    viewHistoryBtn.id = 'viewHistoryBtn';
    viewHistoryBtn.className = 'btn-secondary';
    viewHistoryBtn.textContent = 'View Room Codes History';
    viewHistoryBtn.addEventListener('click', displayRoomCodesHistory);
    
    if (roomActions) {
        roomActions.appendChild(viewHistoryBtn);
    }

    // Add button for initializing room_codes collection
    const initializeRoomCodesBtn = document.createElement('button');
    initializeRoomCodesBtn.id = 'initializeRoomCodesBtn';
    initializeRoomCodesBtn.className = 'btn-secondary';
    initializeRoomCodesBtn.textContent = 'Initialize Room Codes Collection';
    initializeRoomCodesBtn.addEventListener('click', initializeRoomCodesCollection);
    
    if (roomActions) {
        roomActions.appendChild(initializeRoomCodesBtn);
    }
});

// Export functions for use in other files
window.createRoom = createRoom;
window.joinRoom = joinRoom; 
window.displayAllRooms = displayAllRooms;
window.getRoomDetails = getRoomDetails;
window.updateAllRoomCodes = updateAllRoomCodes;
window.updateAllRoomsInFirestore = updateAllRoomsInFirestore;
window.displayRoomCodesHistory = displayRoomCodesHistory;
window.initializeRoomCodesCollection = initializeRoomCodesCollection; 