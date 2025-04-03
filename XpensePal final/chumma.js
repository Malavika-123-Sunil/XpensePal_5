let participants = [];
let expenseItems = [];
let payments = [];
let currentRoomCode = '';
let currentExpenseId = null;

// Initialize the page with room code and load existing expenses
function initializePage() {
    currentRoomCode = localStorage.getItem('currentRoom');
    if (!currentRoomCode) {
        alert('No room code found. Redirecting to dashboard...');
        window.location.href = 'dashboard.html';
        return;
    }

    loadRoomExpenses();
    renderParticipants();
    renderExpenseItems();
    updateSummary();
}

function loadRoomExpenses() {
    const roomData = JSON.parse(localStorage.getItem(`room_${currentRoomCode}`) || '{"expenses": []}');
    renderExpensesList(roomData.expenses);
}

function renderExpensesList(expenses) {
    const container = document.createElement('div');
    container.className = 'expenses-list';
    container.innerHTML = `
        <h2>Expenses in this Room</h2>
        <div class="expenses-grid">
            ${expenses.map(expense => `
                <div class="expense-card" data-id="${expense.id}">
                    <div class="expense-card-header">
                        <h3>${expense.title}</h3>
                        <div class="expense-actions">
                            <button onclick="editExpense('${expense.id}')" class="btn-edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                </svg>
                            </button>
                            <button onclick="deleteExpense('${expense.id}')" class="btn-delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="expense-card-content">
                        <p>Total: ₹${expense.totalAmount.toFixed(2)}</p>
                        <p>Date: ${new Date(expense.timestamp).toLocaleDateString()}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Insert the expenses list before the expense form
    const expenseForm = document.querySelector('.expense-form');
    expenseForm.parentNode.insertBefore(container, expenseForm);
}

function editExpense(expenseId) {
    const roomData = JSON.parse(localStorage.getItem(`room_${currentRoomCode}`) || '{"expenses": []}');
    const expense = roomData.expenses.find(e => e.id === expenseId);
    
    if (expense) {
        currentExpenseId = expenseId;
        document.getElementById('expenseTitle').value = expense.title;
        participants = [...expense.participants];
        expenseItems = [...expense.items];
        payments = expense.payments || [];
        
        renderParticipants();
        renderExpenseItems();
        updateSummary();
        
        // Scroll to the form
        document.querySelector('.expense-form').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        const roomData = JSON.parse(localStorage.getItem(`room_${currentRoomCode}`) || '{"expenses": []}');
        roomData.expenses = roomData.expenses.filter(e => e.id !== expenseId);
        localStorage.setItem(`room_${currentRoomCode}`, JSON.stringify(roomData));
        loadRoomExpenses();
    }
}

function goBack() {
    window.location.href = 'dashboard.html';
}

function addParticipant() {
    const name = prompt('Enter participant name:');
    if (name && name.trim()) {
        participants.push({
            name: name.trim(),
            totalPaid: 0,
            balance: 0,
            payments: []
        });
        renderParticipants();
        updatePayerSelections();
        updateSummary();
    }
}

function removeParticipant(index) {
    if (confirm('Remove this participant? Their payment history will be lost.')) {
    participants.splice(index, 1);
    renderParticipants();
        updatePayerSelections();
    updateSummary();
    }
}

function renderParticipants() {
    const list = document.getElementById('participantsList');
    list.innerHTML = participants.map((participant, index) => `
        <div class="participant-chip">
            <span>${participant.name}</span>
            <button onclick="removeParticipant(${index})" class="btn-remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `).join('');
}

function updatePayerSelections() {
    document.querySelectorAll('.payer-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">Select payer</option>
            ${participants.map(p => `
                <option value="${p.name}" ${currentValue === p.name ? 'selected' : ''}>
                    ${p.name}
                </option>
            `).join('')}
        `;
    });
}

function addExpenseItem() {
    const item = {
        id: Date.now(),
        description: '',
        amount: 0,
        payer: '',
        splitAmount: 0
    };
    expenseItems.push(item);
    renderExpenseItems();
}

function removeExpenseItem(id) {
    expenseItems = expenseItems.filter(item => item.id !== id);
    renderExpenseItems();
    updateSummary();
}

function updateExpenseItem(id, field, value) {
    const item = expenseItems.find(item => item.id === id);
    if (item) {
        item[field] = value;
        if (field === 'amount' || field === 'payer') {
            item.splitAmount = Number(item.amount) / participants.length;
        }
        updateSummary();
    }
}

function renderExpenseItems() {
    const container = document.getElementById('expenseItems');
    container.innerHTML = expenseItems.map(item => `
        <div class="expense-item">
            <div class="expense-item-header">
            <input
                type="text"
                placeholder="Description"
                value="${item.description}"
                onchange="updateExpenseItem(${item.id}, 'description', this.value)"
            >
            <input
                type="number"
                placeholder="Amount"
                value="${item.amount}"
                onchange="updateExpenseItem(${item.id}, 'amount', Number(this.value))"
                min="0"
                step="0.01"
            >
            <button onclick="removeExpenseItem(${item.id})" class="btn-remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            </div>
            <div class="expense-item-details">
                <select 
                    class="payer-select"
                    onchange="updateExpenseItem(${item.id}, 'payer', this.value)"
                >
                    <option value="">Select payer</option>
                    ${participants.map(p => `
                        <option value="${p.name}" ${item.payer === p.name ? 'selected' : ''}>
                            ${p.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
    `).join('');
}

function updateSummary() {
    const totalAmount = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const perPerson = participants.length ? totalAmount / participants.length : 0;

    // Calculate individual balances
    participants.forEach(participant => {
        const paid = expenseItems
            .filter(item => item.payer === participant.name)
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        
        // Add manual payments
        const manualPayments = participant.payments ? 
            participant.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
        
        participant.totalPaid = paid + manualPayments;
        participant.balance = participant.totalPaid - perPerson;
    });

    // Update summary section
    const summary = document.getElementById('expenseSummary');
    summary.innerHTML = `
        <div class="total-amount">
            <span>Total Amount:</span>
            <span class="amount">₹${totalAmount.toFixed(2)}</span>
        </div>
        <div class="per-person">
            <span>Per Person:</span>
            <span class="amount">₹${perPerson.toFixed(2)}</span>
        </div>
    `;

    // Update balances section
    const balancesList = document.getElementById('balancesList');
    balancesList.innerHTML = participants.map(participant => `
        <div class="balance-item">
            <div class="balance-info">
                <span>${participant.name}</span>
                <span class="amount ${participant.balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                    ${participant.balance >= 0 ? '₹' + participant.balance.toFixed(2) + ' (to receive)' : 
                    '₹' + Math.abs(participant.balance).toFixed(2) + ' (to pay)'}
                </span>
            </div>
            <button onclick="addManualPayment('${participant.name}')" class="btn-add-payment">
                Add Payment
            </button>
        </div>
    `).join('');

    // Calculate and display settlement
    const settlementSummary = document.getElementById('settlementSummary');
    const settlements = calculateSettlements();
    settlementSummary.innerHTML = `
        <h3>Settlement Plan</h3>
        ${settlements.map(settlement => `
            <div class="settlement-item">
                ${settlement.from} pays ₹${settlement.amount.toFixed(2)} to ${settlement.to}
            </div>
        `).join('')}
    `;

    // Update payments section
    renderPayments(settlements);
}

function addManualPayment(participantName) {
    const amount = prompt(`Enter payment amount for ${participantName}:`);
    if (amount && !isNaN(amount) && Number(amount) > 0) {
        const participant = participants.find(p => p.name === participantName);
        if (participant) {
            if (!participant.payments) {
                participant.payments = [];
            }
            participant.payments.push({
                amount: Number(amount),
                timestamp: new Date().toISOString()
            });
            updateSummary();
        }
    }
}

function calculateSettlements() {
    const settlements = [];
    const debtors = participants.filter(p => p.balance < 0)
        .sort((a, b) => a.balance - b.balance);
    const creditors = participants.filter(p => p.balance > 0)
        .sort((a, b) => b.balance - a.balance);

    debtors.forEach(debtor => {
        let remainingDebt = Math.abs(debtor.balance);
        creditors.forEach(creditor => {
            if (remainingDebt > 0 && creditor.balance > 0) {
                const amount = Math.min(remainingDebt, creditor.balance);
                if (amount > 0) {
                    settlements.push({
                        from: debtor.name,
                        to: creditor.name,
                        amount: amount,
                        status: 'pending'
                    });
                    remainingDebt -= amount;
                    creditor.balance -= amount;
                }
            }
        });
    });

    return settlements;
}

function renderPayments(settlements) {
    const paymentsList = document.getElementById('paymentsList');
    paymentsList.innerHTML = settlements.map((settlement, index) => `
        <div class="payment-item">
            <div>
                ${settlement.from} → ${settlement.to}: ₹${settlement.amount.toFixed(2)}
            </div>
            <div class="payment-status">
                ${settlement.status === 'pending' ? `
                    <span class="status-pending">Pending</span>
                    <button onclick="markPaymentComplete(${index})" class="btn-mark-paid">
                        Mark as Paid
                    </button>
                ` : `
                    <span class="status-completed">Completed</span>
                `}
            </div>
        </div>
    `).join('');
}

function markPaymentComplete(index) {
    const settlements = calculateSettlements();
    settlements[index].status = 'completed';
    
    // Add the payment to the participant's payment history
    const settlement = settlements[index];
    const payer = participants.find(p => p.name === settlement.from);
    if (payer) {
        if (!payer.payments) payer.payments = [];
        payer.payments.push({
            amount: settlement.amount,
            timestamp: new Date().toISOString(),
            to: settlement.to
        });
    }
    
    renderPayments(settlements);
    updateSummary();
}

function saveExpense() {
    const title = document.getElementById('expenseTitle').value;
    
    if (!title) {
        alert('Please enter an expense title');
        return;
    }
    
    if (participants.length === 0) {
        alert('Please add at least one participant');
        return;
    }
    
    if (expenseItems.length === 0) {
        alert('Please add at least one expense item');
        return;
    }

    if (expenseItems.some(item => !item.payer)) {
        alert('Please select a payer for all expense items');
        return;
    }

    const expense = {
        id: currentExpenseId || Date.now().toString(),
        title,
        participants,
        items: expenseItems,
        totalAmount: expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        settlements: calculateSettlements(),
        payments,
        timestamp: new Date().toISOString()
    };

    // Save to room storage
    const roomData = JSON.parse(localStorage.getItem(`room_${currentRoomCode}`) || '{"expenses": []}');
    
    if (currentExpenseId) {
        // Update existing expense
        const index = roomData.expenses.findIndex(e => e.id === currentExpenseId);
        if (index !== -1) {
            roomData.expenses[index] = expense;
        }
    } else {
        // Add new expense
        roomData.expenses.push(expense);
    }
    
    localStorage.setItem(`room_${currentRoomCode}`, JSON.stringify(roomData));

    alert('Expense saved successfully!');
    
    // Reset form for new expense
    currentExpenseId = null;
    document.getElementById('expenseTitle').value = '';
    participants = [];
    expenseItems = [];
    payments = [];
    
    // Reload expenses list
    loadRoomExpenses();
    renderParticipants();
    renderExpenseItems();
    updateSummary();
}

// Initialize the page
initializePage();

// Structure for tracking payments between participants
class PaymentTracker {
    constructor(roomId) {
        this.roomId = roomId;
        this.payments = new Map();
    }

    // Record a payment between participants
    async recordPayment(fromUserId, toUserId, amount) {
        try {
            const roomRef = doc(db, 'rooms', this.roomId);
            const roomSnap = await getDoc(roomRef);
            const roomData = roomSnap.data();

            const payment = {
                fromUserId,
                toUserId,
                amount,
                timestamp: new Date().toISOString(),
                status: 'completed'
            };

            // Add payment to payments collection
            await addDoc(collection(db, 'rooms', this.roomId, 'payments'), payment);

            // Update user balances
            await this.updateBalances(roomData, payment);
            
            // Check and update payment completion status
            await this.checkPaymentCompletion(roomData);

        } catch (error) {
            console.error('Error recording payment:', error);
            throw error;
        }
    }

    // Update balances after a payment
    async updateBalances(roomData, payment) {
        const updatedMembers = roomData.members.map(member => {
            if (member.userId === payment.fromUserId) {
                return {
                    ...member,
                    totalPaid: (member.totalPaid || 0) + payment.amount
                };
            }
            if (member.userId === payment.toUserId) {
                return {
                    ...member,
                    totalReceived: (member.totalReceived || 0) + payment.amount
                };
            }
            return member;
        });

        await updateDoc(doc(db, 'rooms', this.roomId), {
            members: updatedMembers,
            lastUpdated: new Date().toISOString()
        });
    }

    // Check if all payments are completed
    async checkPaymentCompletion(roomData) {
        const members = roomData.members;
        const expenses = roomData.expenses || [];
        
        // Calculate total owed per person
        const totalOwed = {};
        members.forEach(member => {
            totalOwed[member.userId] = 0;
        });

        expenses.forEach(expense => {
            const perPersonShare = expense.amount / members.length;
            members.forEach(member => {
                if (member.userId === expense.paidBy) {
                    totalOwed[member.userId] -= (expense.amount - perPersonShare);
                } else {
                    totalOwed[member.userId] += perPersonShare;
                }
            });
        });

        // Update payment status for each member
        const updatedMembers = members.map(member => ({
            ...member,
            paymentStatus: Math.abs(totalOwed[member.userId]) < 0.01 ? 'completed' : 'pending'
        }));

        await updateDoc(doc(db, 'rooms', this.roomId), {
            members: updatedMembers
        });
    }
}

// Function to update balance and payment display
async function updateBalanceAndPayments() {
    try {
        const currentRoomId = localStorage.getItem('currentRoomId');
        if (!currentRoomId) return;

        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomSnap = await getDoc(roomRef);
        const roomData = roomSnap.data();

        // Get all payments for this room
        const paymentsSnapshot = await getDocs(collection(db, 'rooms', currentRoomId, 'payments'));
        const payments = paymentsSnapshot.docs.map(doc => doc.data());

        const balancesList = document.getElementById('balancesList');
        if (!balancesList) return;

        balancesList.innerHTML = '<h3>Payment Status</h3>';

        // Calculate initial balances from expenses
        const balances = calculateBalances(roomData.expenses, roomData.members);
        
        // Create payment tracking object
        const paymentTracking = {};
        roomData.members.forEach(member => {
            paymentTracking[member.userId] = {
                owes: {},
                paid: {},
                totalOwed: 0,
                totalPaid: 0
            };
        });

        // Calculate who owes whom
        roomData.expenses.forEach(expense => {
            const perPersonShare = expense.amount / roomData.members.length;
            roomData.members.forEach(member => {
                if (member.userId !== expense.paidBy) {
                    paymentTracking[member.userId].owes[expense.paidBy] = 
                        (paymentTracking[member.userId].owes[expense.paidBy] || 0) + perPersonShare;
                    paymentTracking[member.userId].totalOwed += perPersonShare;
                }
            });
        });

        // Record all payments made
        payments.forEach(payment => {
            paymentTracking[payment.fromUserId].paid[payment.toUserId] = 
                (paymentTracking[payment.fromUserId].paid[payment.toUserId] || 0) + payment.amount;
            paymentTracking[payment.fromUserId].totalPaid += payment.amount;
        });

        // Display balances and payments for each member
        roomData.members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-payment-status';

            const tracking = paymentTracking[member.userId];
            const remainingTotal = tracking.totalOwed - tracking.totalPaid;

            // Create payment details for each person they owe
            const paymentDetails = Object.entries(tracking.owes).map(([owedToId, amount]) => {
                const paidAmount = tracking.paid[owedToId] || 0;
                const remaining = amount - paidAmount;
                const owedToMember = roomData.members.find(m => m.userId === owedToId);
                
                if (remaining <= 0) {
                    return `<div class="payment-detail completed">
                        <span>✓ Paid ${formatAmount(amount)} to ${owedToMember.name}</span>
                    </div>`;
                } else {
                    return `<div class="payment-detail pending">
                        <span>Owes ${formatAmount(remaining)} to ${owedToMember.name}</span>
                        <span class="paid-amount">Paid: ${formatAmount(paidAmount)}</span>
                    </div>`;
                }
            }).join('');

            memberDiv.innerHTML = `
                <div class="member-header">
                    <span class="member-name">${member.name}</span>
                    <span class="payment-status ${remainingTotal <= 0 ? 'completed' : 'pending'}">
                        ${remainingTotal <= 0 ? 
                            '✓ All Payments Completed' : 
                            `Remaining: ${formatAmount(remainingTotal)}`}
                    </span>
                </div>
                <div class="payment-details">
                    ${paymentDetails}
                </div>
            `;

            balancesList.appendChild(memberDiv);
        });

    } catch (error) {
        console.error('Error updating balance and payments:', error);
    }
}

// Function to record a payment
async function addManualPayment(event) {
    event.preventDefault();
    try {
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const toUserId = document.getElementById('paymentTo').value;
        const currentUser = auth.currentUser;
        const currentRoomId = localStorage.getItem('currentRoomId');

        if (!amount || !toUserId || !currentUser || !currentRoomId) {
            alert('Please fill all payment details');
            return;
        }

        const payment = {
            fromUserId: currentUser.uid,
            toUserId,
            amount,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };

        // Add payment to payments collection
        await addDoc(collection(db, 'rooms', currentRoomId, 'payments'), payment);

        // Reset form and update UI
        document.getElementById('paymentForm').reset();
        await updateBalanceAndPayments();
        
        alert('Payment recorded successfully');

    } catch (error) {
        console.error('Error adding payment:', error);
        alert('Error recording payment');
    }
}

// Function to update payment recipient select
function updatePaymentRecipientSelect() {
    const currentRoomId = localStorage.getItem('currentRoomId');
    if (!currentRoomId) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    getDoc(doc(db, 'rooms', currentRoomId)).then(roomSnap => {
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data();
        const paymentToSelect = document.getElementById('paymentTo');
        
        if (!paymentToSelect) return;

        paymentToSelect.innerHTML = '<option value="">Select recipient</option>' +
            roomData.members
                .filter(member => member.userId !== currentUser.uid) // Exclude current user
                .map(member => `
                    <option value="${member.userId}">${member.name}</option>
                `).join('');
    });
}

// Add to your document ready code
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...

    // Set up real-time updates for expenses and payments
    const currentRoomId = localStorage.getItem('currentRoomId');
    if (currentRoomId) {
        const roomRef = doc(db, 'rooms', currentRoomId);
        
        // Listen for room changes
        onSnapshot(roomRef, (doc) => {
            if (doc.exists()) {
                updateBalanceAndPayments();
                updatePaymentRecipientSelect();
            }
        });

        // Listen for payment changes
        onSnapshot(collection(db, 'rooms', currentRoomId, 'payments'), () => {
            updateBalanceAndPayments();
        });
    }

    // Initialize payment form
    updatePaymentRecipientSelect();
});

// Add this HTML for the payment form