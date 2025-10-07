// Settings Management System
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.initEventListeners();
        this.applySettings();
    }

    // Load settings from localStorage
    loadSettings() {
        const defaultSettings = {
            theme: {
                primaryColor: '#0b880b',
                secondaryColor: '#3b82f6',
                backgroundColor: '#f8fafc',
                mode: 'light'
            },
            typography: {
                fontSize: 16,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400
            },
            invoice: {
                companyName: 'Mayondo Wood & Furniture Ltd',
                companyAddress: 'Nairobi, Kenya',
                companyPhone: '+254 700 000 000',
                companyEmail: 'info@mwf.co.ke',
                logo: '/images/logo 2.png',
                invoiceFormat: 'MWF-{year}-{sequence}',
                transportFee: 5
            },
            system: {
                autoLogout: 30,
                dateFormat: 'DD/MM/YYYY',
                language: 'en'
            }
        };

        const savedSettings = localStorage.getItem('mwfSettings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('mwfSettings', JSON.stringify(this.settings));
        this.applySettings();
        this.showNotification('Settings saved successfully!', 'success');
    }

    // Reset to default settings
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            localStorage.removeItem('mwfSettings');
            this.settings = this.loadSettings();
            this.updateFormValues();
            this.applySettings();
            this.showNotification('Settings reset to default!', 'success');
        }
    }

    // Apply settings to the document
    applySettings() {
        this.applyTheme();
        this.applyTypography();
        this.applySystemPreferences();
    }

    // Apply theme settings
    applyTheme() {
        const { theme } = this.settings;
        
        // Set CSS variables
        document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
        document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
        
        // Apply theme mode
        document.body.className = '';
        if (theme.mode === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme.mode === 'auto') {
            // Auto mode based on system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-theme');
            }
        }
    }

    // Apply typography settings
    applyTypography() {
        const { typography } = this.settings;
        
        document.body.style.fontSize = `${typography.fontSize}px`;
        document.body.style.fontFamily = typography.fontFamily;
        document.body.style.fontWeight = typography.fontWeight;
    }

    // Apply system preferences
    applySystemPreferences() {
        const { system } = this.settings;
        
        // Auto-logout timer would be implemented in the main application
        console.log('Auto-logout set to:', system.autoLogout, 'minutes');
        
        // Date format would be used throughout the application
        console.log('Date format:', system.dateFormat);
    }

    // Update form values with current settings
    updateFormValues() {
        const { theme, typography, invoice, system } = this.settings;

        // Theme settings
        document.getElementById('primaryColor').value = theme.primaryColor;
        document.getElementById('secondaryColor').value = theme.secondaryColor;
        document.getElementById('backgroundColor').value = theme.backgroundColor;
        
        // Update theme mode buttons
        document.querySelectorAll('.theme-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === theme.mode);
        });

        // Typography settings
        document.getElementById('fontSizeSlider').value = typography.fontSize;
        document.querySelector('.font-size-value').textContent = `${typography.fontSize}px`;
        document.getElementById('fontFamily').value = typography.fontFamily;
        document.getElementById('fontWeight').value = typography.fontWeight;

        // Invoice settings
        document.getElementById('companyName').value = invoice.companyName;
        document.getElementById('companyAddress').value = invoice.companyAddress;
        document.getElementById('companyPhone').value = invoice.companyPhone;
        document.getElementById('companyEmail').value = invoice.companyEmail;
        document.getElementById('invoiceFormat').value = invoice.invoiceFormat;
        document.getElementById('transportFee').value = invoice.transportFee;

        // System settings
        document.getElementById('autoLogout').value = system.autoLogout;
        document.getElementById('dateFormat').value = system.dateFormat;
        document.getElementById('language').value = system.language;
    }

    // Initialize event listeners
    initEventListeners() {
        // Save settings button
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // Reset settings button
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());

        // Preview invoice button
        document.getElementById('previewInvoice').addEventListener('click', () => this.previewInvoice());

        // Color pickers
        document.getElementById('primaryColor').addEventListener('input', (e) => {
            this.settings.theme.primaryColor = e.target.value;
            this.updateColorValue('primaryColor', e.target.value);
            this.applyTheme();
        });

        document.getElementById('secondaryColor').addEventListener('input', (e) => {
            this.settings.theme.secondaryColor = e.target.value;
            this.updateColorValue('secondaryColor', e.target.value);
            this.applyTheme();
        });

        document.getElementById('backgroundColor').addEventListener('input', (e) => {
            this.settings.theme.backgroundColor = e.target.value;
            this.updateColorValue('backgroundColor', e.target.value);
            this.applyTheme();
        });

        // Theme mode buttons
        document.querySelectorAll('.theme-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.theme.mode = e.target.dataset.mode;
                this.applyTheme();
            });
        });

        // Font size controls
        document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
            this.settings.typography.fontSize = parseInt(e.target.value);
            document.querySelector('.font-size-value').textContent = `${e.target.value}px`;
            this.applyTypography();
        });

        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slider = document.getElementById('fontSizeSlider');
                let currentSize = parseInt(slider.value);
                
                if (e.target.hasAttribute('decrease')) {
                    currentSize = Math.max(12, currentSize - 1);
                } else {
                    currentSize = Math.min(24, currentSize + 1);
                }
                
                slider.value = currentSize;
                this.settings.typography.fontSize = currentSize;
                document.querySelector('.font-size-value').textContent = `${currentSize}px`;
                this.applyTypography();
            });
        });

        // Font family and weight
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.settings.typography.fontFamily = e.target.value;
            this.applyTypography();
        });

        document.getElementById('fontWeight').addEventListener('change', (e) => {
            this.settings.typography.fontWeight = parseInt(e.target.value);
            this.applyTypography();
        });

        // Invoice settings
        document.getElementById('companyName').addEventListener('change', (e) => {
            this.settings.invoice.companyName = e.target.value;
        });

        document.getElementById('companyAddress').addEventListener('change', (e) => {
            this.settings.invoice.companyAddress = e.target.value;
        });

        document.getElementById('companyPhone').addEventListener('change', (e) => {
            this.settings.invoice.companyPhone = e.target.value;
        });

        document.getElementById('companyEmail').addEventListener('change', (e) => {
            this.settings.invoice.companyEmail = e.target.value;
        });

        document.getElementById('invoiceFormat').addEventListener('change', (e) => {
            this.settings.invoice.invoiceFormat = e.target.value;
        });

        document.getElementById('transportFee').addEventListener('change', (e) => {
            this.settings.invoice.transportFee = parseFloat(e.target.value);
        });

        // Logo upload
        document.getElementById('logoUpload').addEventListener('change', (e) => {
            this.handleLogoUpload(e.target.files[0]);
        });

        // System settings
        document.getElementById('autoLogout').addEventListener('change', (e) => {
            this.settings.system.autoLogout = parseInt(e.target.value);
        });

        document.getElementById('dateFormat').addEventListener('change', (e) => {
            this.settings.system.dateFormat = e.target.value;
        });

        document.getElementById('language').addEventListener('change', (e) => {
            this.settings.system.language = e.target.value;
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('invoicePreviewModal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('invoicePreviewModal')) {
                document.getElementById('invoicePreviewModal').style.display = 'none';
            }
        });
    }

    // Update color value display
    updateColorValue(inputId, value) {
        const colorValueElement = document.querySelector(`#${inputId}`).nextElementSibling;
        colorValueElement.textContent = value;
    }

    // Handle logo upload
    handleLogoUpload(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.settings.invoice.logo = e.target.result;
                document.getElementById('logoPreview').src = e.target.result;
                this.showNotification('Logo updated successfully!', 'success');
            };
            reader.readAsDataURL(file);
        }
    }

    // Preview invoice
    previewInvoice() {
        const invoicePreview = document.getElementById('invoicePreview');
        const { invoice } = this.settings;
        
        const sampleInvoice = this.generateSampleInvoice();
        invoicePreview.innerHTML = sampleInvoice;
        
        document.getElementById('invoicePreviewModal').style.display = 'flex';
    }

    // Generate sample invoice for preview
    generateSampleInvoice() {
        const { invoice } = this.settings;
        const currentDate = new Date().toLocaleDateString();
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
        
        return `
            <div class="invoice-template">
                <div class="invoice-header">
                    <div class="company-info">
                        <img src="${invoice.logo}" alt="Company Logo" style="height: 60px; margin-bottom: 15px;">
                        <h2>${invoice.companyName}</h2>
                        <p>${invoice.companyAddress}</p>
                        <p>Phone: ${invoice.companyPhone} | Email: ${invoice.companyEmail}</p>
                    </div>
                    <div class="invoice-meta">
                        <h1>INVOICE</h1>
                        <p><strong>Invoice No:</strong> MWF-2024-0001</p>
                        <p><strong>Date:</strong> ${currentDate}</p>
                        <p><strong>Due Date:</strong> ${dueDate}</p>
                    </div>
                </div>
                
                <div class="invoice-body">
                    <div class="billing-info">
                        <div class="bill-to">
                            <h3>Bill To:</h3>
                            <p><strong>Construction Solutions Ltd</strong></p>
                            <p>123 Business Avenue</p>
                            <p>Nairobi, Kenya</p>
                            <p>Phone: +254 711 000 000</p>
                        </div>
                        <div class="ship-to">
                            <h3>Ship To:</h3>
                            <p>Same as billing address</p>
                        </div>
                    </div>
                    
                    <table class="invoice-items">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Timber</td>
                                <td>Premium Hardwood Timber 2x4</td>
                                <td>50</td>
                                <td>KSH 1,500</td>
                                <td>KSH 75,000</td>
                            </tr>
                            <tr>
                                <td>Poles</td>
                                <td>Construction Poles 6m</td>
                                <td>30</td>
                                <td>KSH 800</td>
                                <td>KSH 24,000</td>
                            </tr>
                            <tr>
                                <td>Transport</td>
                                <td>Delivery Service</td>
                                <td>1</td>
                                <td>KSH ${(75000 + 24000) * (invoice.transportFee / 100)}</td>
                                <td>KSH ${(75000 + 24000) * (invoice.transportFee / 100)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" style="text-align: right;"><strong>Subtotal:</strong></td>
                                <td><strong>KSH 99,000</strong></td>
                            </tr>
                            <tr>
                                <td colspan="4" style="text-align: right;"><strong>Transport (${invoice.transportFee}%):</strong></td>
                                <td><strong>KSH ${(75000 + 24000) * (invoice.transportFee / 100)}</strong></td>
                            </tr>
                            <tr>
                                <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                                <td><strong>KSH ${99000 + (75000 + 24000) * (invoice.transportFee / 100)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="payment-terms">
                        <h3>Payment Terms</h3>
                        <p>Payment due within 30 days. Please make payment to:</p>
                        <p><strong>Bank:</strong> Kenya Commercial Bank</p>
                        <p><strong>Account Name:</strong> Mayondo Wood & Furniture Ltd</p>
                        <p><strong>Account Number:</strong> 1234567890</p>
                    </div>
                    
                    <div class="invoice-footer">
                        <p>Thank you for your business!</p>
                        <div class="signature">
                            <p>Authorized Signature</p>
                            <p>_________________________</p>
                            <p>John Doe, Manager</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show notification
    showNotification(message, type) {
        // You can implement a toast notification system here
        alert(message);
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const settingsManager = new SettingsManager();
    settingsManager.updateFormValues();
    
    // Set user name
    const userName = document.getElementById('userName').getAttribute('data-user-name');
    document.getElementById('userName').textContent = userName;
});