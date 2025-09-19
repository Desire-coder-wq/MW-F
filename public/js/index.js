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


let slideIndex = 1;
showSlides(slideIndex);

function changeSlide(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active-dot");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].classList.add("active-dot");
}

// Optional: Auto change slides every 5 seconds
setInterval(() => {
  changeSlide(1);
}, 3000);