class StockSubmissionValidator {
    constructor() {
        this.form = document.querySelector('.stock-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.createSuccessMessage();
            this.setupEventListeners();
            this.setupRealTimeValidation();
        }
    }

    createSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.id = 'successMessage';
        successMessage.style.cssText = `
            display: none;
            background: #dcfce7;
            color: #166534;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #bbf7d0;
            margin-bottom: 20px;
            align-items: center;
            gap: 10px;
        `;
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Stock request submitted successfully!</span>
        `;

        const formHeader = document.querySelector('.form-header');
        formHeader.parentNode.insertBefore(successMessage, formHeader.nextSibling);
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.submitForm();
            } else {
                this.showAllErrors();
                this.shakeInvalidFields();
            }
        });
    }

    setupRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            // Validate on blur
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            // Remove error state on input
            input.addEventListener('input', () => {
                if (this.isFieldInvalid(input)) {
                    this.validateField(input);
                }
            });

            // Add focus event for better UX
            input.addEventListener('focus', () => {
                this.removeFieldError(input);
            });
        });

        // Special validation for dependent fields
        const productType = document.getElementById('productType');
        if (productType) {
            productType.addEventListener('change', () => {
                this.validateProductDependencies();
            });
        }
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Validate optional fields if they have values
        const optionalInputs = this.form.querySelectorAll('input:not([required])');
        optionalInputs.forEach(input => {
            if (input.value.trim() !== '') {
                this.validateField(input);
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        this.removeFieldError(field);

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
                    } else if (fieldName === 'sellingPrice' && document.getElementById('costPrice')) {
                        const costPrice = parseFloat(document.getElementById('costPrice').value);
                        const sellingPrice = parseFloat(value);
                        if (sellingPrice < costPrice) {
                            isValid = false;
                            errorMessage = 'Selling price should not be less than cost price';
                        }
                    }
                    break;

                case 'quantity':
                    if (parseInt(value) < 1 || isNaN(parseInt(value))) {
                        isValid = false;
                        errorMessage = 'Please enter a valid quantity (minimum 1)';
                    }
                    break;

                case 'supplierEmail':
                    if (!this.isValidEmail(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;

                case 'supplierContact':
                    if (!this.isValidPhone(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number (e.g., +256712345678)';
                    }
                    break;

                case 'date':
                    if (!this.isValidDate(value)) {
                        isValid = false;
                        errorMessage = 'Please select a valid date';
                    } else if (this.isFutureDate(value)) {
                        isValid = false;
                        errorMessage = 'Date cannot be in the future';
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
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }

        return isValid;
    }

    validateProductDependencies() {
        const productType = document.getElementById('productType').value;
        const category = document.getElementById('category');
        
        if (productType === 'wood' && category.value === 'Finished Products') {
            this.showFieldError(category, 'Wood products are typically Raw Materials');
        } else if (productType === 'furniture' && category.value === 'Raw Materials') {
            this.showFieldError(category, 'Furniture products are typically Finished Products');
        }
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
            date: 'date'
        };

        return `Please select ${fieldLabels[fieldName] || 'this field'}`;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[256]{0,3}?[0-9\s\-\(\)]{9,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    isFutureDate(dateString) {
        const inputDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate > today;
    }

    isValidImage(file) {
        if (!file) return true; // Image is optional
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    showFieldError(field, message) {
        // Add invalid class to field
        field.classList.add('invalid');
        field.classList.remove('valid');

        // Create or update error message
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.8rem;
            margin-top: 5px;
            display: block;
        `;

        // Add error styling to parent form-group
        field.parentNode.classList.add('error');
    }

    showFieldSuccess(field) {
        field.classList.add('valid');
        field.classList.remove('invalid');
        this.removeFieldError(field);
        field.parentNode.classList.remove('error');
    }

    removeFieldError(field) {
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        field.parentNode.classList.remove('error');
    }

    isFieldInvalid(field) {
        return field.classList.contains('invalid');
    }

    showAllErrors() {
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        
        inputs.forEach(input => {
            this.validateField(input);
        });

        // Scroll to first error
        const firstError = this.form.querySelector('.invalid');
        if (firstError) {
            firstError.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            firstError.focus();
        }
    }

    shakeInvalidFields() {
        const invalidFields = this.form.querySelectorAll('.invalid');
        invalidFields.forEach(field => {
            field.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                field.style.animation = '';
            }, 500);
        });
    }

    async submitForm() {
        try {
            const formData = new FormData(this.form);
            
            // Show loading state
            const submitBtn = this.form.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
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
                if (preview) {
                    preview.innerHTML = '<div class="image-preview-placeholder"><i class="fas fa-camera"></i><p>No image selected</p></div>';
                }
                
                // Reset date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').value = today;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error');
            }
        } catch (error) {
            this.showErrorMessage(error.message || 'Error submitting stock request. Please try again.');
        } finally {
            // Reset button state
            const submitBtn = this.form.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Stock Request';
                submitBtn.disabled = false;
            }
        }
    }

    showSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'flex';
            
            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }
    }

    showErrorMessage(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'success-message';
        errorDiv.style.cssText = `
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
        
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.parentNode.insertBefore(errorDiv, successMessage);
        } else {
            const formHeader = document.querySelector('.form-header');
            formHeader.parentNode.insertBefore(errorDiv, formHeader.nextSibling);
        }
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    resetValidationStates() {
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.classList.remove('invalid', 'valid');
            this.removeFieldError(input);
            input.parentNode.classList.remove('error');
        });
    }
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .form-group.error input,
    .form-group.error select {
        border-color: #dc2626 !important;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
    
    .form-group input.valid,
    .form-group select.valid {
        border-color: #16a34a !important;
    }
    
    .form-group {
        position: relative;
    }
`;
document.head.appendChild(style);

// Initialize the validator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new StockSubmissionValidator();
    
    // Add any additional initialization here
    const today = new Date().toISOString().split('T')[0];
    const dateField = document.getElementById('date');
    if (dateField) {
        dateField.value = today;
    }
});