// Record Management System - Main JavaScript File

class RecordManager {
    constructor() {
        this.records = [];
        this.editingId = null;
        this.currentRecordId = 1;
        this.currentPasswordAction = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateRecordCount();
        this.renderTable();
        this.setAutoSerialNumber();
        
        // Set default values on page load
        this.setDefaultValues();
        
        // Apply user preference for automatic token detection
        this.initializeAutoTokenDetection();
        
        // Initialize UI animations
        this.initializeAnimations();
    }

    // Initialize automatic token detection based on user preference
    initializeAutoTokenDetection() {
        // Check for token in various places automatically
        this.detectAndSetToken();
        
        // Set up periodic token detection
        setInterval(() => {
            this.detectAndSetToken();
        }, 5000); // Check every 5 seconds
    }

    initializeAnimations() {
        // Add staggered animation to form groups
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            group.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Add hover animations to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', this.addButtonGlow);
            btn.addEventListener('mouseleave', this.removeButtonGlow);
        });
        
        // Add focus animations to inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', this.addInputFocus);
            input.addEventListener('blur', this.removeInputFocus);
        });
        
        // Add mobile number validation
        const mobileInput = document.getElementById('mobileNumber');
        if (mobileInput) {
            mobileInput.addEventListener('input', this.validateMobileNumber.bind(this));
            mobileInput.addEventListener('keypress', this.restrictMobileInput.bind(this));
        }
        
        // Add loading animation to table during operations
        this.setupTableAnimations();
    }
    
    addButtonGlow(e) {
        const btn = e.target;
        btn.style.transform = 'translateY(-2px) scale(1.02)';
        btn.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    
    removeButtonGlow(e) {
        const btn = e.target;
        btn.style.transform = 'translateY(0) scale(1)';
    }
    
    addInputFocus(e) {
        const input = e.target;
        input.style.transform = 'scale(1.02)';
        input.style.transition = 'all 0.3s ease';
        
        // Add ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(0, 123, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        const rect = input.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width - size) / 2 + 'px';
        ripple.style.top = (rect.height - size) / 2 + 'px';
        
        input.style.position = 'relative';
        input.parentNode.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    removeInputFocus(e) {
        const input = e.target;
        input.style.transform = 'scale(1)';
    }
    
    validateMobileNumber(e) {
        const input = e.target;
        const value = input.value.replace(/\D/g, ''); // Remove non-digits
        
        // Update input value to only contain digits
        input.value = value;
        
        // Check if exactly 11 digits
        if (value.length === 11) {
            input.classList.add('valid-mobile');
            input.classList.remove('invalid-mobile');
        } else {
            input.classList.remove('valid-mobile');
            if (value.length > 0) {
                input.classList.add('invalid-mobile');
            } else {
                input.classList.remove('invalid-mobile');
            }
        }
    }
    
    restrictMobileInput(e) {
        // Only allow digits
        const char = String.fromCharCode(e.which);
        if (!/[0-9]/.test(char)) {
            e.preventDefault();
        }
        
        // Prevent input if already 11 digits
        if (e.target.value.length >= 11) {
            e.preventDefault();
        }
    }
    
    setupTableAnimations() {
        // Add CSS for ripple animation if not exists
        if (!document.querySelector('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                
                .table-row-enter {
                    animation: tableRowSlide 0.3s ease-out;
                }
                
                .button-click {
                    animation: buttonClick 0.2s ease-out;
                }
                
                @keyframes buttonClick {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    detectAndSetToken() {
        try {
            // Check localStorage for various token keys
            const tokenKeys = ['authToken', 'token', 'accessToken', 'jwt', 'sessionToken'];
            let foundToken = null;

            for (const key of tokenKeys) {
                try {
                    const token = localStorage.getItem(key);
                    if (token && token.trim()) {
                        foundToken = token;
                        break;
                    }
                } catch (e) {
                    // Ignore localStorage access errors
                }
            }

            // Check sessionStorage as well
            if (!foundToken) {
                for (const key of tokenKeys) {
                    try {
                        const token = sessionStorage.getItem(key);
                        if (token && token.trim()) {
                            foundToken = token;
                            break;
                        }
                    } catch (e) {
                        // Ignore sessionStorage access errors
                    }
                }
            }

            // Check URL parameters
            if (!foundToken) {
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    for (const key of tokenKeys) {
                        const token = urlParams.get(key);
                        if (token && token.trim()) {
                            foundToken = token;
                            break;
                        }
                    }
                } catch (e) {
                    // Ignore URL parsing errors
                }
            }

            // Password field reference update for automatic token detection
            const passwordField = document.getElementById('loginPassword');
            if (foundToken && passwordField && (passwordField.value === '123456' || !passwordField.value)) {
                passwordField.value = foundToken;
            }
            // Note: When no token is found, field keeps default value without showing error messages
        } catch (error) {
            // Silently handle any unexpected errors in token detection
            console.debug('Token detection error:', error);
        }
    }

    bindEvents() {
        // Form submission
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Form reset - set default values
        document.getElementById('recordForm').addEventListener('reset', () => {
            this.cancelEdit();
            // Set default values after reset
            setTimeout(() => {
                this.setDefaultValues();
            }, 10);
        });

        // Cancel edit
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Print
        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterRecords();
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.filterRecords();
        });

        // Filters
        document.getElementById('centerFilter').addEventListener('change', () => {
            this.filterRecords();
        });

        document.getElementById('dateFrom').addEventListener('change', () => {
            this.filterRecords();
        });

        document.getElementById('dateTo').addEventListener('change', () => {
            this.filterRecords();
        });

        document.getElementById('applyFilters').addEventListener('click', () => {
            this.filterRecords();
        });

        // Import/Export
        document.getElementById('downloadTemplate').addEventListener('click', () => {
            this.downloadTemplate();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('csvImport').click();
        });

        document.getElementById('csvImport').addEventListener('change', (e) => {
            this.handleCSVImport(e);
        });

        document.getElementById('bulkPasteBtn').addEventListener('click', () => {
            this.showBulkPasteModal();
        });

        document.getElementById('exportCsv').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcelHTML();
        });

        // Clear all records - with password protection
        document.getElementById('clearAllRecords').addEventListener('click', () => {
            console.log('Clear All button clicked');
            this.showPasswordModal('clear all records', () => {
                console.log('Executing clear all records');
                this.performClearAllRecords();
            });
        });

        // Password controls - only copy functionality (removed toggle)
        document.getElementById('copyPassword').addEventListener('click', () => {
            this.copyPasswordToClipboard();
        });
        
        // Email password copy functionality
        document.getElementById('copyEmailPassword').addEventListener('click', () => {
            this.copyEmailPasswordToClipboard();
        });

        // Bulk paste modal
        document.getElementById('processBulkPaste').addEventListener('click', () => {
            this.processBulkPaste();
        });

        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.target.closest('#bulkPasteModal')) {
                    this.closeBulkPasteModal();
                } else if (e.target.closest('#passwordModal')) {
                    this.closePasswordModal();
                }
            });
        });

        document.getElementById('bulkPasteModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('bulkPasteModal')) {
                this.closeBulkPasteModal();
            }
        });
        
        document.getElementById('passwordModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('passwordModal')) {
                this.closePasswordModal();
            }
        });
        
        // Password confirmation
        document.getElementById('confirmPasswordBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handlePasswordConfirmation();
        });
        
        // Allow Enter key for password confirmation
        document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handlePasswordConfirmation();
            }
        });

        // Message close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message')) {
                e.target.remove();
            }
        });
    }

    handleFormSubmit() {
        const formData = new FormData(document.getElementById('recordForm'));
        const record = {};
        
        // Get form data
        for (let [key, value] of formData.entries()) {
            record[key] = value.trim();
        }

        // Validate required fields
        if (!this.validateRecord(record)) {
            return;
        }

        // Check for duplicates
        const duplicateCheck = this.checkForDuplicates(record, this.editingId);
        if (duplicateCheck.hasDuplicate) {
            this.showMessage(`Duplicate found: ${duplicateCheck.message}`, 'warning');
            return;
        }

        // Add timestamp
        record.createdAt = new Date().toISOString();
        
        if (this.editingId) {
            // Update existing record
            const index = this.records.findIndex(r => r.id === this.editingId);
            if (index !== -1) {
                record.id = this.editingId;
                record.updatedAt = new Date().toISOString();
                this.records[index] = record;
                this.showMessage('Record updated successfully!', 'success');
            }
            this.cancelEdit();
        } else {
            // Add new record
            record.id = Date.now(); // Unique ID
            this.records.push(record);
            this.showMessage('Record added successfully!', 'success');
            
            // Update current record ID for next auto-increment
            const slNo = parseInt(record.slNo);
            if (slNo >= this.currentRecordId) {
                this.currentRecordId = slNo + 1;
            }
        }

        this.saveToStorage();
        this.renderTable();
        this.updateRecordCount();
        document.getElementById('recordForm').reset();
        this.setAutoSerialNumber();
        // Set default values after reset
        setTimeout(() => {
            this.setDefaultValues();
        }, 10);
    }

    validateRecord(record) {
        // Required field validation - updated for new fields
        const requiredFields = ['slNo', 'email', 'mobileNumber', 'loginPassword', 'assignedPerson', 'ivacCenter', 'totalBgdFile', 'fileStartingDate'];
        for (let field of requiredFields) {
            if (!record[field]) {
                this.showMessage(`${this.getFieldLabel(field)} is required!`, 'error');
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(record.email)) {
            this.showMessage('Please enter a valid email address!', 'error');
            return false;
        }

        // Mobile number validation - must be exactly 11 digits
        const mobileDigits = record.mobileNumber.replace(/\D/g, '');
        if (mobileDigits.length !== 11) {
            this.showMessage('Mobile number must be exactly 11 digits!', 'error');
            return false;
        }

        // Date validation
        const fileStartingDate = new Date(record.fileStartingDate);
        if (isNaN(fileStartingDate.getTime())) {
            this.showMessage('Please enter a valid file starting date!', 'error');
            return false;
        }

        // File success date validation (if provided)
        if (record.fileSuccessDate && record.fileSuccessDate.trim()) {
            const fileSuccessDate = new Date(record.fileSuccessDate);
            if (isNaN(fileSuccessDate.getTime())) {
                this.showMessage('Please enter a valid file success date!', 'error');
                return false;
            }
            
            // Check if success date is after starting date
            if (fileSuccessDate < fileStartingDate) {
                this.showMessage('File success date must be after file starting date!', 'error');
                return false;
            }
        }

        // Serial number validation
        const slNo = parseInt(record.slNo);
        if (isNaN(slNo) || slNo < 1) {
            this.showMessage('Serial number must be a positive number!', 'error');
            return false;
        }

        // Total BGD file validation
        const totalBgdFile = parseInt(record.totalBgdFile);
        if (isNaN(totalBgdFile) || totalBgdFile < 1) {
            this.showMessage('Total BGD file must be a positive number!', 'error');
            return false;
        }

        return true;
    }

    checkForDuplicates(record, excludeId = null) {
        const duplicates = this.records.filter(r => {
            if (excludeId && r.id === excludeId) return false;
            return r.email.toLowerCase() === record.email.toLowerCase() || 
                   r.mobileNumber === record.mobileNumber;
        });

        if (duplicates.length > 0) {
            const duplicate = duplicates[0];
            let message = '';
            if (duplicate.email.toLowerCase() === record.email.toLowerCase()) {
                message = `Email "${record.email}" already exists`;
            } else if (duplicate.mobileNumber === record.mobileNumber) {
                message = `Mobile number "${record.mobileNumber}" already exists`;
            }
            return { hasDuplicate: true, message, record: duplicate };
        }

        return { hasDuplicate: false };
    }

    getFieldLabel(field) {
        const labels = {
            slNo: 'Serial Number',
            email: 'Email',
            mobileNumber: 'Mobile Number',
            loginPassword: 'Login Password',
            emailPassword: 'Email Password',
            assignedPerson: 'Assigned person for this BGD file',
            ivacCenter: 'IVAC Center',
            totalBgdFile: 'Total BGD File',
            fileStartingDate: 'File Starting Date',
            fileSuccessDate: 'File Success Date',
            note: 'Note'
        };
        return labels[field] || field;
    }

    setAutoSerialNumber() {
        document.getElementById('slNo').value = this.currentRecordId;
    }

    editRecord(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;

        this.editingId = id;
        
        // Populate form
        Object.keys(record).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = record[key];
                // Trigger mobile validation if it's the mobile number field
                if (key === 'mobileNumber') {
                    this.validateMobileNumber({ target: element });
                }
            }
        });

        // Show cancel button
        document.getElementById('cancelEdit').style.display = 'inline-flex';
        
        // Change submit button text
        const submitBtn = document.querySelector('#recordForm button[type="submit"]');
        submitBtn.textContent = 'Update Record';
        
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        this.showMessage('Editing record. Make changes and click Update Record.', 'info');
    }

    deleteRecord(id) {
        console.log('deleteRecord called with id:', id);
        this.showPasswordModal('delete this record', () => {
            console.log('Executing delete for id:', id);
            this.performDeleteRecord(id);
        });
    }
    
    performDeleteRecord(id) {
        console.log('performDeleteRecord called with id:', id);
        this.records = this.records.filter(r => r.id !== id);
        this.saveToStorage();
        this.renderTable();
        this.updateRecordCount();
        this.showMessage('Record deleted successfully!', 'success');
        console.log('Record deletion completed');
    }

    duplicateRecord(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;

        const newRecord = { ...record };
        delete newRecord.id;
        delete newRecord.createdAt;
        delete newRecord.updatedAt;
        
        // Increment serial number
        newRecord.slNo = this.currentRecordId.toString();
        this.currentRecordId++;
        
        // Add unique identifier to email to avoid duplicates
        const emailParts = newRecord.email.split('@');
        newRecord.email = `${emailParts[0]}_copy@${emailParts[1]}`;
        
        // Add copy suffix to mobile number
        newRecord.mobileNumber = newRecord.mobileNumber + '_copy';
        
        newRecord.id = Date.now();
        newRecord.createdAt = new Date().toISOString();
        
        this.records.push(newRecord);
        this.saveToStorage();
        this.renderTable();
        this.updateRecordCount();
        this.showMessage('Record duplicated successfully! Please update email and mobile number to remove duplicate markers.', 'info');
    }

    setDefaultValues() {
        document.getElementById('email').value = '@gmail.com';
        document.getElementById('loginPassword').value = '123456';
        
        // Reset mobile number validation classes
        const mobileInput = document.getElementById('mobileNumber');
        if (mobileInput) {
            mobileInput.classList.remove('valid-mobile', 'invalid-mobile');
        }
    }

    cancelEdit() {
        this.editingId = null;
        document.getElementById('cancelEdit').style.display = 'none';
        
        // Reset submit button text
        const submitBtn = document.querySelector('#recordForm button[type="submit"]');
        submitBtn.textContent = 'Add Record';
        
        document.getElementById('recordForm').reset();
        this.setAutoSerialNumber();
        // Set default values after reset
        setTimeout(() => {
            this.setDefaultValues();
        }, 10);
    }

    renderTable() {
        const tbody = document.getElementById('recordsTableBody');
        const filteredRecords = this.getFilteredRecords();
        
        // Add loading animation
        const tableContainer = document.querySelector('.table-container');
        tableContainer.classList.add('table-loading');
        
        setTimeout(() => {
            if (filteredRecords.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; padding: 40px; color: var(--secondary-color); font-style: italic;">📋 No records found. Add some records to get started!</td></tr>';
                tableContainer.classList.remove('table-loading');
                this.updateScrollIndicator(0); // Remove indicator when no records
                return;
            }

            tbody.innerHTML = filteredRecords.map((record, index) => `
                <tr class="table-row-enter" style="animation-delay: ${index * 0.05}s">
                    <td>${record.slNo}</td>
                    <td>${this.escapeHtml(record.email)}</td>
                    <td>${this.escapeHtml(record.mobileNumber)}</td>
                    <td>${this.escapeHtml(record.loginPassword || '123456')}</td>
                    <td>${this.escapeHtml(record.emailPassword || '')}</td>
                    <td>${this.escapeHtml(record.ivacCenter)}</td>
                    <td>${this.escapeHtml(record.assignedPerson || '')}</td>
                    <td>${record.totalBgdFile || ''}</td>
                    <td>${this.formatDate(record.fileStartingDate)}</td>
                    <td>${record.fileSuccessDate ? this.formatDate(record.fileSuccessDate) : ''}</td>
                    <td>${this.escapeHtml(record.note || '')}</td>
                    <td>${this.getStatusBadge(record)}</td>
                    <td class="actions no-print">
                        <button class="btn btn-small btn-primary" onclick="recordManager.editRecord(${record.id}); this.classList.add('button-click');">Edit</button>
                        <button class="btn btn-small btn-secondary" onclick="recordManager.duplicateRecord(${record.id}); this.classList.add('button-click');">Duplicate</button>
                        <button class="btn btn-small btn-danger" onclick="recordManager.deleteRecord(${record.id}); this.classList.add('button-click');">Delete</button>
                    </td>
                </tr>
            `).join('');
            
            tableContainer.classList.remove('table-loading');
            
            // Add scroll indicator if more than 10 records
            this.updateScrollIndicator(filteredRecords.length);
        }, 300);
    }

    getFilteredRecords() {
        let filtered = [...this.records];
        
        // Search filter - updated for new fields
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(record => 
                record.email.toLowerCase().includes(searchTerm) ||
                record.mobileNumber.includes(searchTerm) ||
                record.ivacCenter.toLowerCase().includes(searchTerm) ||
                record.loginPassword.toLowerCase().includes(searchTerm)
            );
        }

        // Center filter
        const centerFilter = document.getElementById('centerFilter').value;
        if (centerFilter) {
            filtered = filtered.filter(record => record.ivacCenter === centerFilter);
        }

        // Date range filter - updated to use file starting date
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        
        if (dateFrom) {
            filtered = filtered.filter(record => record.fileStartingDate >= dateFrom);
        }
        
        if (dateTo) {
            filtered = filtered.filter(record => record.fileStartingDate <= dateTo);
        }

        // Sort by serial number in descending order (latest first)
        filtered.sort((a, b) => parseInt(b.slNo) - parseInt(a.slNo));

        return filtered;
    }

    filterRecords() {
        this.renderTable();
        this.updateRecordCount();
    }

    updateScrollIndicator(recordCount) {
        const tableContainer = document.querySelector('.table-container');
        const existingIndicator = document.querySelector('.scroll-indicator');
        
        // Remove existing indicator
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add scroll indicator if more than 10 records
        if (recordCount > 10) {
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '↓ Scroll to see more records ↓';
            tableContainer.parentNode.appendChild(indicator);
        }
    }

    updateRecordCount() {
        const filteredCount = this.getFilteredRecords().length;
        const totalCount = this.records.length;
        
        const countText = filteredCount === totalCount ? 
            totalCount : 
            `${filteredCount} of ${totalCount}`;
            
        document.getElementById('recordCount').textContent = countText;
    }

    clearAllRecords() {
        this.performClearAllRecords();
    }
    
    performClearAllRecords() {
        console.log('performClearAllRecords called');
        this.records = [];
        this.currentRecordId = 1;
        this.saveToStorage();
        this.renderTable();
        this.updateRecordCount();
        this.setAutoSerialNumber();
        this.showMessage('All records cleared successfully!', 'success');
        console.log('Clear all records completed');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        this.showMessage(`Switched to ${newTheme} mode`, 'info');
    }

    async copyPasswordToClipboard() {
        const passwordField = document.getElementById('loginPassword');
        if (!passwordField.value) {
            this.showMessage('No password to copy!', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(passwordField.value);
            this.showMessage('Password copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            passwordField.select();
            document.execCommand('copy');
            this.showMessage('Password copied to clipboard!', 'success');
        }
    }
    
    async copyEmailPasswordToClipboard() {
        const emailPasswordField = document.getElementById('emailPassword');
        if (!emailPasswordField.value) {
            this.showMessage('No email password to copy!', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(emailPasswordField.value);
            this.showMessage('Email password copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            emailPasswordField.select();
            document.execCommand('copy');
            this.showMessage('Email password copied to clipboard!', 'success');
        }
    }

    saveToStorage() {
        localStorage.setItem('recordManagerData', JSON.stringify({
            records: this.records,
            currentRecordId: this.currentRecordId
        }));
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('recordManagerData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.records = data.records || [];
                this.currentRecordId = data.currentRecordId || 1;
            } catch (e) {
                console.error('Error loading data from storage:', e);
                this.records = [];
                this.currentRecordId = 1;
            }
        }

        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    formatMobileForExport(mobile) {
        if (!mobile) return '';
        
        // Remove any non-digit characters
        const digitsOnly = mobile.replace(/\D/g, '');
        
        // If it's 11 digits and doesn't start with 0, add 0 at the beginning
        if (digitsOnly.length === 11 && !digitsOnly.startsWith('0')) {
            return '="0' + digitsOnly + '"'; // Excel formula format to preserve leading zero
        }
        
        // If it's 10 digits, add 0 at the beginning
        if (digitsOnly.length === 10) {
            return '="0' + digitsOnly + '"'; // Excel formula format to preserve leading zero
        }
        
        // For other cases, add 0 if it doesn't start with 0
        if (digitsOnly.length > 0) {
            const formattedNumber = digitsOnly.startsWith('0') ? digitsOnly : '0' + digitsOnly;
            return '="' + formattedNumber + '"'; // Excel formula format to preserve leading zero
        }
        
        return mobile;
    }
    
    formatMobileForExportHTML(mobile) {
        if (!mobile) return '';
        
        // Remove any non-digit characters
        const digitsOnly = mobile.replace(/\D/g, '');
        
        // If it's 11 digits and doesn't start with 0, add 0 at the beginning
        if (digitsOnly.length === 11 && !digitsOnly.startsWith('0')) {
            return '0' + digitsOnly;
        }
        
        // If it's 10 digits, add 0 at the beginning
        if (digitsOnly.length === 10) {
            return '0' + digitsOnly;
        }
        
        // For other cases, add 0 if it doesn't start with 0
        if (digitsOnly.length > 0) {
            return digitsOnly.startsWith('0') ? digitsOnly : '0' + digitsOnly;
        }
        
        return mobile;
    }

    getStatusBadge(record) {
        if (record.fileSuccessDate && record.fileSuccessDate.trim()) {
            return '<span class="status-badge status-done">✅ Done</span>';
        } else {
            return '<span class="status-badge status-processing">⏳ Processing</span>';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        // Add custom animation based on type
        if (type === 'success') {
            messageEl.style.background = 'linear-gradient(135deg, var(--success-color), #34ce57)';
        } else if (type === 'error') {
            messageEl.style.background = 'linear-gradient(135deg, var(--danger-color), #e74c3c)';
            messageEl.style.animation = 'messageSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), errorShake 0.5s ease-out 0.5s';
        } else if (type === 'warning') {
            messageEl.style.background = 'linear-gradient(135deg, var(--warning-color), #f39c12)';
        } else {
            messageEl.style.background = 'linear-gradient(135deg, var(--info-color), #3498db)';
        }
        
        messageContainer.appendChild(messageEl);
        
        // Add click to dismiss
        messageEl.addEventListener('click', () => {
            messageEl.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Import/Export functionality
    downloadTemplate() {
        const headers = ['Sl No', 'Email', 'Mobile Number', 'Login Password', 'Email Password', 'IVAC Center', 'Assigned Person', 'Total BGD File', 'File Starting Date', 'File Success Date', 'Note', 'Status'];
        const sampleData = [
            ['1', 'user1@gmail.com', '+8801234567890', '123456', 'email123', 'Dhaka', 'John Doe', '5', '2024-01-15', '2024-01-20', 'Sample note', 'Done'],
            ['2', 'user2@gmail.com', '+8801987654321', '123456', 'email456', 'Chittagong', 'Jane Smith', '3', '2024-01-16', '', 'Another note', 'Processing']
        ];
        
        let csvContent = '\ufeff'; // UTF-8 BOM for Excel compatibility
        csvContent += headers.join(',') + '\n';
        csvContent += sampleData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        this.downloadFile(csvContent, 'bgd_records_template.csv', 'text/csv');
        this.showMessage('Template CSV downloaded!', 'success');
    }

    handleCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    this.showMessage('CSV file must contain headers and at least one data row!', 'error');
                    return;
                }

                const headers = this.parseCSVRow(lines[0]);
                const dataRows = lines.slice(1).map(line => this.parseCSVRow(line));
                
                this.importCSVData(headers, dataRows);
            } catch (error) {
                this.showMessage('Error reading CSV file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file, 'UTF-8');
        event.target.value = ''; // Reset file input
    }

    parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    importCSVData(headers, dataRows) {
        const fieldMapping = {
            'sl no': 'slNo',
            'serial no': 'slNo',
            'serial number': 'slNo',
            'email': 'email',
            'email address': 'email',
            'mobile': 'mobileNumber',
            'mobile number': 'mobileNumber',
            'phone': 'mobileNumber',
            'phone number': 'mobileNumber',
            'login password': 'loginPassword',
            'password': 'loginPassword',
            'email password': 'emailPassword',
            'assigned person': 'assignedPerson',
            'assigned person for this bgd file': 'assignedPerson',
            'ivac center': 'ivacCenter',
            'center': 'ivacCenter',
            'total bgd file': 'totalBgdFile',
            'bgd file': 'totalBgdFile',
            'file starting date': 'fileStartingDate',
            'starting date': 'fileStartingDate',
            'start date': 'fileStartingDate',
            'file success date': 'fileSuccessDate',
            'success date': 'fileSuccessDate',
            'end date': 'fileSuccessDate',
            'note': 'note',
            'notes': 'note'
        };

        const mappedHeaders = headers.map(header => 
            fieldMapping[header.toLowerCase()] || header.toLowerCase()
        );

        let importedCount = 0;
        let skippedCount = 0;
        const errors = [];

        dataRows.forEach((row, index) => {
            if (row.length === 0 || row.every(cell => !cell.trim())) {
                skippedCount++;
                return;
            }

            const record = {};
            mappedHeaders.forEach((header, i) => {
                if (row[i] !== undefined) {
                    record[header] = row[i].trim();
                }
            });

            // Validate required fields for import
            if (!record.slNo || !record.email || !record.mobileNumber || !record.loginPassword || 
                !record.ivacCenter || !record.totalBgdFile || !record.fileStartingDate) {
                errors.push(`Row ${index + 2}: Missing required fields`);
                skippedCount++;
                return;
            }

            // Check for duplicates
            const duplicateCheck = this.checkForDuplicates(record);
            if (duplicateCheck.hasDuplicate) {
                errors.push(`Row ${index + 2}: ${duplicateCheck.message}`);
                skippedCount++;
                return;
            }

            // Add record
            record.id = Date.now() + index;
            record.createdAt = new Date().toISOString();
            this.records.push(record);
            importedCount++;

            // Update current record ID
            const slNo = parseInt(record.slNo);
            if (slNo >= this.currentRecordId) {
                this.currentRecordId = slNo + 1;
            }
        });

        this.saveToStorage();
        this.renderTable();
        this.updateRecordCount();
        this.setAutoSerialNumber();

        let message = `Import completed: ${importedCount} records imported`;
        if (skippedCount > 0) {
            message += `, ${skippedCount} records skipped`;
        }
        
        this.showMessage(message, importedCount > 0 ? 'success' : 'warning');
        
        if (errors.length > 0) {
            console.error('Import errors:', errors);
            this.showMessage(`${errors.length} errors occurred during import. Check console for details.`, 'warning');
        }
    }

    showBulkPasteModal() {
        document.getElementById('bulkPasteModal').style.display = 'block';
        document.getElementById('bulkPasteText').focus();
    }

    showPasswordModal(action, callback) {
        console.log('showPasswordModal called with action:', action, 'callback type:', typeof callback);
        
        if (!callback || typeof callback !== 'function') {
            this.showMessage('Invalid action provided!', 'error');
            return;
        }
        
        this.currentPasswordAction = callback;
        
        const modalMessage = document.getElementById('passwordModalMessage');
        const modal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('confirmPassword');
        
        if (!modalMessage || !modal || !passwordInput) {
            this.showMessage('Password modal not available. Please refresh the page.', 'error');
            return;
        }
        
        modalMessage.textContent = `Please enter password to ${action}:`;
        passwordInput.value = '';
        modal.style.display = 'block';
        
        // Following memory: Use 100ms timeout for modal focus to prevent conflicts
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
    }
    
    closePasswordModal() {
        const modal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('confirmPassword');
        
        if (modal) {
            modal.style.display = 'none';
        }
        
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        this.currentPasswordAction = null;
    }
    
    handlePasswordConfirmation() {
        const passwordInput = document.getElementById('confirmPassword');
        if (!passwordInput) {
            this.showMessage('Password input not found!', 'error');
            return;
        }
        
        const enteredPassword = passwordInput.value.trim();
        const correctPassword = '123456';
        
        if (enteredPassword === correctPassword) {
            const actionToExecute = this.currentPasswordAction;
            this.closePasswordModal();
            
            if (actionToExecute && typeof actionToExecute === 'function') {
                try {
                    actionToExecute();
                } catch (error) {
                    console.error('Error executing action:', error);
                    this.showMessage('Error executing action!', 'error');
                }
            } else {
                console.error('No valid action to perform:', actionToExecute);
                this.showMessage('No action to perform!', 'warning');
            }
        } else {
            this.showMessage('Incorrect password! Please try again.', 'error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    closeBulkPasteModal() {
        document.getElementById('bulkPasteModal').style.display = 'none';
        document.getElementById('bulkPasteText').value = '';
    }

    processBulkPaste() {
        const text = document.getElementById('bulkPasteText').value.trim();
        if (!text) {
            this.showMessage('Please paste some data first!', 'warning');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const dataRows = lines.map(line => {
            // Split by tab first, then by comma if no tabs
            const cells = line.includes('\t') ? 
                line.split('\t') : 
                this.parseCSVRow(line);
            return cells.map(cell => cell.trim());
        });

        // Use default headers for bulk paste - updated field order
        const headers = ['slNo', 'email', 'mobileNumber', 'loginPassword', 'emailPassword', 'ivacCenter', 'assignedPerson', 'totalBgdFile', 'fileStartingDate', 'fileSuccessDate', 'note'];
        
        this.importCSVData(headers, dataRows);
        this.closeBulkPasteModal();
    }

    exportToCSV() {
        if (this.records.length === 0) {
            this.showMessage('No records to export!', 'warning');
            return;
        }

        const headers = ['Sl No', 'Email', 'Mobile Number', 'Login Password', 'Email Password', 'IVAC Center', 'Assigned Person', 'Total BGD File', 'File Starting Date', 'File Success Date', 'Note', 'Status'];
        const filteredRecords = this.getFilteredRecords();
        
        let csvContent = '\ufeff'; // UTF-8 BOM for Excel compatibility
        csvContent += headers.join(',') + '\n';
        
        csvContent += filteredRecords.map(record => {
            const row = [
                record.slNo,
                record.email,
                this.formatMobileForExport(record.mobileNumber), // Already formatted with Excel formula
                record.loginPassword || '',
                record.emailPassword || '',
                record.ivacCenter,
                record.assignedPerson || '',
                record.totalBgdFile || '',
                record.fileStartingDate,
                record.fileSuccessDate || '',
                record.note || '',
                record.fileSuccessDate && record.fileSuccessDate.trim() ? 'Done' : 'Processing'
            ];
            
            // Handle mobile number separately since it's already formatted
            return row.map((field, index) => {
                if (index === 2) { // Mobile number column
                    return field; // Already formatted with Excel formula
                }
                return `"${String(field).replace(/"/g, '""')}"`;
            }).join(',');
        }).join('\n');
        
        const filename = `bgd_records_export_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadFile(csvContent, filename, 'text/csv');
        this.showMessage(`${filteredRecords.length} records exported to CSV!`, 'success');
    }

    exportToExcelHTML() {
        if (this.records.length === 0) {
            this.showMessage('No records to export!', 'warning');
            return;
        }

        const filteredRecords = this.getFilteredRecords();
        
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BGD Records Export</title>
    <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .date { mso-number-format: "dd/mm/yyyy"; }
    </style>
</head>
<body>
    <h1>BGD Records Export</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <table>
        <thead>
            <tr>
                <th>Sl No</th>
                <th>Email</th>
                <th>Mobile Number</th>
                <th>Login Password</th>
                <th>Email Password</th>
                <th>IVAC Center</th>
                <th>Assigned Person</th>
                <th>Total BGD File</th>
                <th>File Starting Date</th>
                <th>File Success Date</th>
                <th>Note</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
`;
        
        filteredRecords.forEach(record => {
            htmlContent += `
            <tr>
                <td>${this.escapeHtml(record.slNo)}</td>
                <td>${this.escapeHtml(record.email)}</td>
                <td style="mso-number-format:'\@'">${this.escapeHtml(this.formatMobileForExportHTML(record.mobileNumber))}</td>
                <td>${this.escapeHtml(record.loginPassword || '')}</td>
                <td>${this.escapeHtml(record.emailPassword || '')}</td>
                <td>${this.escapeHtml(record.ivacCenter)}</td>
                <td>${this.escapeHtml(record.assignedPerson || '')}</td>
                <td>${this.escapeHtml(record.totalBgdFile || '')}</td>
                <td class="date">${record.fileStartingDate}</td>
                <td class="date">${record.fileSuccessDate || ''}</td>
                <td>${this.escapeHtml(record.note || '')}</td>
                <td>${record.fileSuccessDate && record.fileSuccessDate.trim() ? 'Done' : 'Processing'}</td>
            </tr>`;
        });
        
        htmlContent += `
        </tbody>
    </table>
</body>
</html>`;
        
        const filename = `bgd_records_export_${new Date().toISOString().split('T')[0]}.html`;
        this.downloadFile(htmlContent, filename, 'text/html');
        this.showMessage(`${filteredRecords.length} records exported to Excel-compatible HTML!`, 'success');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the application
let recordManager;

document.addEventListener('DOMContentLoaded', function() {
    recordManager = new RecordManager();
    console.log('Record Management System initialized successfully!');
});