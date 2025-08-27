app.post('/submit', (req, res) => {
  const { name, email, message } = req.body;
  console.log(name, email, message);
  res.send("Form data received!");
});



function typeWriter(elementId, text, speed = 100) {
  let i = 0;
  const el = document.getElementById(elementId);
  el.textContent = '';

  function typing() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

window.onload = () => {
  typeWriter('heading', 'Welcome to MAYONDO WOOD & FURNITURE', 100);
  setTimeout(() => {
    typeWriter('paragraph', 'THE BEST FURNITURE COMPANY WITH BEST QUALITY PRODUCTS', 50);
  }, 100 * 35);
};
