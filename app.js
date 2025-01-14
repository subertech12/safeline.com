class PoliceApp {
    constructor() {
        this.currentUser = null;
        this.messages = [];
        this.initializeElements();
        this.addEventListeners();
        this.startAutoRefresh();
        this.policeResponses = [];
        this.loadResponses();
    }

    initializeElements() {
        // Forms
        this.registrationForm = document.getElementById('registrationForm');
        this.reportForm = document.getElementById('reportForm');
        
        // Dashboards
        this.citizenDashboard = document.getElementById('citizenDashboard');
        this.officerDashboard = document.getElementById('officerDashboard');
        
        // Role specific elements
        this.officerFields = document.getElementById('officerFields');
        this.roleSelect = document.getElementById('role');
        
        // Photo previews
        this.photoPreview = document.getElementById('photoPreview');
        this.incidentPhotoPreview = document.getElementById('incidentPhotoPreview');
        
        // Messages list
        this.messagesList = document.getElementById('messagesList');
        this.responsesContainer = document.getElementById('policeResponses');
    }

    addEventListeners() {
        // Registration form events
        this.roleSelect.addEventListener('change', () => this.toggleOfficerFields());
        this.registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));
        
        // Photo upload events
        document.getElementById('photo').addEventListener('change', (e) => this.handlePhotoUpload(e, this.photoPreview));
        document.getElementById('incidentPhoto').addEventListener('change', (e) => this.handlePhotoUpload(e, this.incidentPhotoPreview));
        
        // Emergency call buttons
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleEmergencyCall(btn.dataset.number));
        });
        
        // Report form
        this.reportForm.addEventListener('submit', (e) => this.handleReport(e));
    }

    toggleOfficerFields() {
        this.officerFields.classList.toggle('hidden', this.roleSelect.value !== 'officer');
    }

    async handleRegistration(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const userData = {
            id: Date.now(),
            role: formData.get('role'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (userData.role === 'officer') {
            const photoFile = formData.get('photo');
            if (photoFile) {
                userData.photoUrl = await this.getPhotoUrl(photoFile);
            }
        }

        // Clear previous data for new registration
        if (userData.role === 'citizen') {
            // Clear previous responses for new citizen
            localStorage.removeItem('policeResponses');
            this.policeResponses = [];
        } else if (userData.role === 'officer') {
            // Clear previous reports for new officer
            localStorage.removeItem('policeReports');
            this.messages = [];
        }

        // Save user data
        this.currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // Show appropriate dashboard
        this.showDashboard(userData.role);
    }

    async getPhotoUrl(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    handlePhotoUpload(event, previewElement) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                previewElement.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    handleEmergencyCall(number) {
        // In a real app, this would initiate a phone call
        const confirmCall = confirm(`Ma hubtaa inaad wacdo ${number}?`);
        if (confirmCall) {
            window.location.href = `tel:${number}`;
            this.saveCall(number);
        }
    }

    async handleReport(event) {
        event.preventDefault();
        
        const report = {
            id: Date.now(),
            type: document.getElementById('incidentType').value,
            details: document.getElementById('details').value,
            photo: this.incidentPhotoPreview.querySelector('img')?.src,
            timestamp: new Date().toISOString(),
            reporter: {
                ...this.currentUser,
                id: this.currentUser.id || Date.now()
            }
        };

        try {
            // Save report to localStorage
            const reports = JSON.parse(localStorage.getItem('policeReports') || '[]');
            reports.unshift(report);
            localStorage.setItem('policeReports', JSON.stringify(reports));

            // Add to current messages
            this.messages.unshift(report);
            this.updateMessages();
            
            // Reset form
            event.target.reset();
            this.incidentPhotoPreview.classList.add('hidden');
            
            alert('Warbixinta waa la diray. Police ayaa kula soo xiriiri doona.');
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Khalad ayaa dhacay. Fadlan mar kale isku day.');
        }
    }

    saveCall(number) {
        const call = {
            id: Date.now(),
            type: 'call',
            number: number,
            timestamp: new Date().toISOString(),
            caller: this.currentUser
        };

        try {
            // Save call to localStorage
            const reports = JSON.parse(localStorage.getItem('policeReports') || '[]');
            reports.unshift(call);
            localStorage.setItem('policeReports', JSON.stringify(reports));

            // Add to current messages
            this.messages.unshift(call);
            this.updateMessages();
        } catch (error) {
            console.error('Error saving call:', error);
        }
    }

    updateMessages() {
        if (!this.messagesList) return;

        this.messagesList.innerHTML = '';
        this.messages.forEach(message => {
            const card = this.createMessageCard(message);
            this.messagesList.appendChild(card);
        });
    }

    createMessageCard(message) {
        const card = document.createElement('div');
        card.className = 'message-card';
        
        if (message.type === 'call') {
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-type">
                        <i class="fas fa-phone"></i> Wicitaan
                    </span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    <p>Lambarka: ${message.number}</p>
                    <p>Wacay: ${message.caller.name}</p>
                </div>
                <div class="message-actions">
                    <button onclick="app.handleCallBack('${message.caller.phone}')" class="action-btn">
                        <i class="fas fa-phone"></i> Wac
                    </button>
                    <button onclick="app.deleteMessage(${message.id})" class="action-btn delete-btn">
                        <i class="fas fa-trash"></i> Tirtir
                    </button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-type">
                        <i class="fas fa-exclamation-triangle"></i> ${message.type}
                    </span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    <p>${message.details}</p>
                    ${message.photo ? `<img src="${message.photo}" alt="Incident Photo">` : ''}
                </div>
                <div class="message-actions">
                    <button onclick="app.handleCallBack('${message.reporter.phone}')" class="action-btn">
                        <i class="fas fa-phone"></i> Wac
                    </button>
                    <button onclick="app.handleRespond(${message.id})" class="action-btn">
                        <i class="fas fa-reply"></i> Jawaab
                    </button>
                    <button onclick="app.deleteMessage(${message.id})" class="action-btn delete-btn">
                        <i class="fas fa-trash"></i> Tirtir
                    </button>
                </div>
            `;
        }
        
        return card;
    }

    handleCallBack(phone) {
        window.location.href = `tel:${phone}`;
    }

    handleRespond(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            const response = prompt('Geli jawaabta:');
            if (response) {
                const policeResponse = {
                    id: Date.now(),
                    messageId: messageId,
                    response: response,
                    timestamp: new Date().toISOString(),
                    officer: this.currentUser,
                    reportType: message.type,
                    originalMessage: message.details || `Wicitaan - ${message.number}`,
                    reporterId: message.reporter.id || message.caller.id
                };

                try {
                    // Save response to localStorage
                    const responses = JSON.parse(localStorage.getItem('policeResponses') || '[]');
                    responses.unshift(policeResponse);
                    localStorage.setItem('policeResponses', JSON.stringify(responses));

                    // Update current responses
                    this.policeResponses.unshift(policeResponse);
                    
                    // Show success message
                    alert('Jawaabta waa la diray!');
                } catch (error) {
                    console.error('Error saving response:', error);
                    alert('Khalad ayaa dhacay. Fadlan mar kale isku day.');
                }
            }
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('so-SO');
    }

    showDashboard(role) {
        this.registrationForm.classList.add('hidden');
        
        if (role === 'citizen') {
            this.citizenDashboard.classList.remove('hidden');
            this.officerDashboard.classList.add('hidden');
            // Load responses for citizen
            this.loadResponses();
            // Start auto-refresh for responses
            this.startResponsesRefresh();
        } else {
            this.officerDashboard.classList.remove('hidden');
            this.citizenDashboard.classList.add('hidden');
            
            // Show officer photo in navbar
            if (this.currentUser.photoUrl) {
                const userPhoto = document.getElementById('userPhoto');
                userPhoto.src = this.currentUser.photoUrl;
                userPhoto.classList.remove('hidden');
            }

            // Load all reports when officer logs in
            this.loadReports();
        }
        
        document.getElementById('userName').textContent = this.currentUser.name;
        document.querySelector('.user-info').classList.remove('hidden');
    }

    // Add this new method to load reports when officer logs in
    loadReports() {
        const savedReports = localStorage.getItem('policeReports');
        if (savedReports) {
            this.messages = JSON.parse(savedReports);
            this.updateMessages();
        }
    }

    // Add auto-refresh for officer dashboard
    startAutoRefresh() {
        setInterval(() => {
            if (this.currentUser?.role === 'officer') {
                this.loadReports();
            }
        }, 5000); // Refresh every 5 seconds
    }

    loadResponses() {
        try {
            const savedResponses = localStorage.getItem('policeResponses');
            if (savedResponses) {
                this.policeResponses = JSON.parse(savedResponses);
                this.updateResponses();
            }
        } catch (error) {
            console.error('Error loading responses:', error);
        }
    }

    updateResponses() {
        if (!this.responsesContainer) return;

        if (this.policeResponses.length === 0) {
            this.responsesContainer.innerHTML = `
                <div class="no-responses">
                    <i class="fas fa-inbox"></i>
                    <p>Weli ma jiraan jawaabo</p>
                </div>
            `;
            return;
        }

        this.responsesContainer.innerHTML = '';
        // Filter responses for current user
        const userResponses = this.policeResponses.filter(
            response => response.reporterId === this.currentUser.id
        );

        userResponses.forEach(response => {
            const card = document.createElement('div');
            card.className = 'response-card';
            card.innerHTML = `
                <div class="response-header">
                    <span class="response-type">
                        <i class="fas fa-reply"></i>
                        Jawaab: ${response.reportType}
                    </span>
                    <span class="response-time">${this.formatTime(response.timestamp)}</span>
                </div>
                <div class="response-content">
                    <p><strong>Warbixintaadii:</strong> ${response.originalMessage}</p>
                    <p><strong>Jawaabta Police:</strong> ${response.response}</p>
                </div>
                <div class="response-footer">
                    <div class="response-officer">
                        ${response.officer.photoUrl ? 
                            `<img src="${response.officer.photoUrl}" alt="${response.officer.name}">` : 
                            '<i class="fas fa-user-shield"></i>'}
                        <span>${response.officer.name}</span>
                    </div>
                    <button onclick="app.deleteResponse(${response.id})" class="delete-btn">
                        <i class="fas fa-trash"></i> Tirtir
                    </button>
                </div>
            `;
            this.responsesContainer.appendChild(card);
        });
    }

    startResponsesRefresh() {
        // Clear any existing interval
        if (this.responsesInterval) {
            clearInterval(this.responsesInterval);
        }

        // Start new interval
        this.responsesInterval = setInterval(() => {
            if (this.currentUser?.role === 'citizen') {
                this.loadResponses();
            }
        }, 3000); // Check every 3 seconds
    }

    deleteMessage(messageId) {
        this.showConfirmDialog(
            'Ma hubtaa inaad tirtirto fariintan?',
            () => this.confirmDelete(messageId)
        );
    }

    showConfirmDialog(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="cancel-btn" onclick="this.closest('.overlay').remove()">
                    Maya
                </button>
                <button class="delete-btn" onclick="this.closest('.overlay').remove(); app.executeDelete(${onConfirm})">
                    Haa
                </button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    async confirmDelete(messageId) {
        try {
            // Remove from localStorage
            const reports = JSON.parse(localStorage.getItem('policeReports') || '[]');
            const updatedReports = reports.filter(report => report.id !== messageId);
            localStorage.setItem('policeReports', JSON.stringify(updatedReports));

            // Remove from current messages
            this.messages = this.messages.filter(message => message.id !== messageId);
            this.updateMessages();

            // Also remove any associated responses
            const responses = JSON.parse(localStorage.getItem('policeResponses') || '[]');
            const updatedResponses = responses.filter(response => response.messageId !== messageId);
            localStorage.setItem('policeResponses', JSON.stringify(updatedResponses));
            this.policeResponses = updatedResponses;
            this.updateResponses();

            alert('Fariinta waa la tirtiray');
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Khalad ayaa dhacay. Fadlan mar kale isku day.');
        }
    }

    deleteResponse(responseId) {
        this.showConfirmDialog(
            'Ma hubtaa inaad tirtirto jawaabtaan?',
            () => this.confirmDeleteResponse(responseId)
        );
    }

    async confirmDeleteResponse(responseId) {
        try {
            // Remove from localStorage
            const responses = JSON.parse(localStorage.getItem('policeResponses') || '[]');
            const updatedResponses = responses.filter(response => response.id !== responseId);
            localStorage.setItem('policeResponses', JSON.stringify(updatedResponses));

            // Update current responses
            this.policeResponses = updatedResponses;
            this.updateResponses();

            alert('Jawaabta waa la tirtiray');
        } catch (error) {
            console.error('Error deleting response:', error);
            alert('Khalad ayaa dhacay. Fadlan mar kale isku day.');
        }
    }

    handleLogout() {
        this.showConfirmDialog(
            'Ma hubtaa inaad ka baxdo?',
            () => this.confirmLogout()
        );
    }

    confirmLogout() {
        try {
            // Clear user data
            this.currentUser = null;
            localStorage.removeItem('currentUser');

            // Hide dashboards
            this.citizenDashboard.classList.add('hidden');
            this.officerDashboard.classList.add('hidden');

            // Show registration form
            this.registrationForm.classList.remove('hidden');

            // Hide user info in navbar
            document.querySelector('.user-info').classList.add('hidden');

            // Reset forms
            this.registrationForm.reset();
            this.photoPreview.classList.add('hidden');
            if (this.reportForm) {
                this.reportForm.reset();
            }
            if (this.incidentPhotoPreview) {
                this.incidentPhotoPreview.classList.add('hidden');
            }

            // Clear messages and responses
            this.messages = [];
            this.policeResponses = [];

            // Stop auto refresh intervals
            if (this.responsesInterval) {
                clearInterval(this.responsesInterval);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Khalad ayaa dhacay. Fadlan mar kale isku day.');
        }
    }

    showConfirmDialog(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="cancel-btn" onclick="this.closest('.overlay').remove()">
                    Maya
                </button>
                <button onclick="this.closest('.overlay').remove(); ${onConfirm && typeof onConfirm === 'function' ? onConfirm() : ''}" class="confirm-btn">
                    Haa
                </button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }
}

// Initialize app
const app = new PoliceApp(); 