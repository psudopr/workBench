var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express Starter Pack' });
});

router.get('/test-page', function(req, res, next) {
  res.send('This is a dumb test page.')  
});

module.exports = router;
