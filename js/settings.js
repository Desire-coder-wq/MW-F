// Save business info
document.getElementById("businessForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("companyName").value;
  const email = document.getElementById("companyEmail").value;
  const phone = document.getElementById("companyPhone").value;

  alert(`Business info saved!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`);
});

// Theme settings
document.getElementById("themeForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const theme = document.getElementById("theme").value;

  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
});
