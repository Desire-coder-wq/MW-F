// Save button
document.getElementById('saveSettings').addEventListener('click', async () => {
    const data = {
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value,
        backgroundColor: document.getElementById('backgroundColor').value,
        themeMode: document.querySelector('.theme-mode-btn.active').dataset.mode,
        fontSize: document.getElementById('fontSizeSlider').value,
        fontFamily: document.getElementById('fontFamily').value,
        fontWeight: document.getElementById('fontWeight').value,
        companyName: document.getElementById('companyName').value,
        companyAddress: document.getElementById('companyAddress').value,
        companyPhone: document.getElementById('companyPhone').value,
        companyEmail: document.getElementById('companyEmail').value,
        invoiceFormat: document.getElementById('invoiceFormat').value,
        transportFee: document.getElementById('transportFee').value,
        autoLogout: document.getElementById('autoLogout').value,
        dateFormat: document.getElementById('dateFormat').value,
        language: document.getElementById('language').value
    };

    const res = await fetch("/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);
});

// Reset button
document.getElementById('resetSettings').addEventListener('click', async () => {
    if (!confirm("Reset all settings to default?")) return;

    const res = await fetch("/settings/reset", { method: "POST" });
    const result = await res.json();
    alert(result.message);
    window.location.reload();
});

// Logo upload
document.getElementById('logoUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/settings/upload-logo", { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
        document.getElementById('logoPreview').src = result.logoUrl;
        alert("Logo uploaded successfully!");
    }
});
