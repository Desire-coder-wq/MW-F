const express = require('express');
const app = express();

const port =3000;

app.get('/', (req, res) => { // new
  res.send('Homepage! .');
});

app.get('/about', (req, res) => { // new
  res.send('About page. Nice.');
});


app.listen(port, () => console.log(`listening on port ${port}`));