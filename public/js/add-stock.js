class StockFormValidator {
    constructor() {
        this.form = document.getElementById('stockForm');
        this.successMessage = document.getElementById('successMessage');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.submitForm();
            } else {
                this.showAllErrors();
            }
        });
    }

    setupRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Validate on blur
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            // Remove error state on input
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Remove existing validation classes
        field.classList.remove('invalid', 'valid');

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = this.getRequiredErrorMessage(fieldName);
        } else if (value) {
            // Field-specific validation
            switch (fieldName) {
                case 'productName':
                case 'productType':
                case 'category':
                    if (value === '') {
                        isValid = false;
                        errorMessage = this.getRequiredErrorMessage(fieldName);
                    }
                    break;

                case 'costPrice':
                case 'sellingPrice':
                    if (parseFloat(value) <= 0 || isNaN(parseFloat(value))) {
                        isValid = false;
                        errorMessage = 'Please enter a valid price greater than 0';
                    }
                    break;

                case 'quantity':
                    if (parseInt(value) < 1 || isNaN(parseInt(value))) {
                        isValid = false;
                        errorMessage = 'Please enter a valid quantity (minimum 1)';
                    }
                    break;

                case 'supplierEmail':
                    if (value && !this.isValidEmail(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;

                case 'supplierContact':
                    if (value && !this.isValidPhone(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number';
                    }
                    break;

                case 'date':
                    if (!this.isValidDate(value)) {
                        isValid = false;
                        errorMessage = 'Please select a valid date';
                    }
                    break;

                case 'image':
                    if (field.files.length > 0) {
                        const file = field.files[0];
                        if (!this.isValidImage(file)) {
                            isValid = false;
                            errorMessage = 'Please select a valid image file (JPG, PNG, GIF, WebP, max 5MB)';
                        }
                    }
                    break;
            }
        }

        // Update field state
        if (!isValid) {
            field.classList.add('invalid');
            this.showError(field, errorMessage);
        } else {
            field.classList.add('valid');
            this.hideError(field);
        }

        return isValid;
    }

    getRequiredErrorMessage(fieldName) {
        const fieldLabels = {
            productName: 'product name',
            productType: 'product type',
            category: 'category',
            costPrice: 'cost price',
            sellingPrice: 'selling price',
            quantity: 'quantity',
            supplier: 'supplier name',
            supplierEmail: 'supplier email',
            supplierContact: 'supplier contact',
            supplierAddress: 'supplier address',
            date: 'date',
            quality: 'quality information',
            color: 'color information',
            measurement: 'measurement information',
            image: 'product image'
        };

        return `Please enter ${fieldLabels[fieldName] || 'this field'}`;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    isValidImage(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    showError(field, message) {
        const errorElement = document.getElementById(`${field.name}Error`) || 
                           field.parentNode.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError(field) {
        const errorElement = document.getElementById(`${field.name}Error`) || 
                           field.parentNode.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    showAllErrors() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            this.validateField(input);
        });

        // Scroll to first error
        const firstError = this.form.querySelector('.invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    async submitForm() {
        try {
            const formData = new FormData(this.form);
            
            // Show loading state
            const submitBtn = this.form.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Stock...';
            submitBtn.disabled = true;

            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showSuccessMessage();
                this.form.reset();
                this.resetValidationStates();
                
                // Reset image preview
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = '<div class="image-preview-placeholder"><i class="fas fa-camera"></i><p>No image selected</p></div>';
                
                // Reset date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').value = today;
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            this.showErrorMessage('Error adding product. Please try again.');
        } finally {
            // Reset button state
            const submitBtn = this.form.querySelector('.submit-btn');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showSuccessMessage() {
        this.successMessage.style.display = 'flex';
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 5000);
    }

    showErrorMessage(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'success-message';
        errorDiv.style.background = '#fef2f2';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.borderColor = '#fecaca';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
        
        this.successMessage.parentNode.insertBefore(errorDiv, this.successMessage);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    resetValidationStates() {
        const inputs = this.form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('invalid', 'valid');
            this.hideError(input);
        });
    }
}

// Initialize the validator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new StockFormValidator();
});