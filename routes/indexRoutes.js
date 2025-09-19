const express = require('express');
const router = express.Router();




router.get('/', (req, res) => { 
  res.render("index",{title:"home page"})
});
router.post('/index', (req, res) => { 
  console.log(req.body)
});

module.exports = router
