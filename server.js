const express = require('express')

const port = 9001

var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const path = require('path');

var authenticate = require('./sql/authenticate');

app.set('views', __dirname + '/views/pages');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);

app.use(session({ secret: 'madmax' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var ses;

const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ARDyJYqcpAeP-_NdziNqdR5M3p-yt9I0-LKdSfto-rJ1_lNo0rh3EU310haZGHIoyS7N6kGZkj1VMv-c',
    'client_secret': 'EIEhOf6X_0Y7USekJ1UscPO6FGHOLlNmh2bBgv06zVniJS-DVfET4w8D2wcytQ8_J9KeWUtwJHaeOTEW'
});

let totalCost;
app.post('/pay', (req, res) => {
   totalCost = req.body.prodPrice * req.body.prodQuantity;
  const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:9001/success",
          "cancel_url": "http://localhost:9001/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                "name": req.body.prodName,
                "sku": req.body.prodId,
                "price": req.body.prodPrice,
                "currency": "USD",
                "quantity": req.body.prodQuantity
              }]
          },
          "amount": {
              "currency": "USD",
              "total": totalCost
          },
          "description": "The Best cakes in town."
      }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for(let i=0; i<payment.links.length; i++) {
              if(payment.links[i].rel === 'approval_url') {
                  let link = payment.links[i].href
                  console.log(link)
                  res.redirect(link);
              }
          }
      }
  });
});


app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": 'USD',
              "total": totalCost
          }
      }]
  }

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
        var paymentDetail = payment
          
        var payerInfo = paymentDetail.payer.payer_info.shipping_address;
        var address = payerInfo.line1 + ' ';
        address += payerInfo.city + ' ';
        address += payerInfo.state + ' ';
        address += payerInfo.postal_code + ' ';
        address += payerInfo.country_code;

          
        connection.query('INSERT INTO `summary`(`username`, `email`, `cakename`, `time`, `address`, `quantity`, `cost`) VALUES ("'+ paymentDetail.payer.payer_info.shipping_address.recipient_name+'", "'+ses.email+'" ,"'+paymentDetail.transactions[0].item_list.items[0].name+'", "'+paymentDetail.create_time.substring(0, 10)+'", "'+ address +'", "'+paymentDetail.transactions[0].item_list.items[0].quantity+'", "'+paymentDetail.transactions[0].amount.total+'")', function (error, results, fields) {
              if (error) { 
                res.end('error');
              } else {
              res.render('index.ejs',{title: 'The Cakery', isLoggedIn: false });            
          }
        });
      
      }
  });
})

app.get('/cancel', (req,res) => {
  res.send('cancel')
})

const ms = require('mysql');
let connection = ms.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'thecakery'
});

connection.connect((err) => {
  if(err) {console.log(err)}
  let str = '';
  str = !err ? "Database is connected": "Error connecting database";
  console.log(str);
});

app.post('/validateLogin', function (req, res) {
  ses = req.session;
  ses.email = req.body.email;
  const emailId = ses.email;
  let status = authenticate.login(connection, req, res, ses)
  if (status.flag) {
    //console.log(status)
    res.end('done');
  }
});

app.post('/registerUser', function (req, res) {
  ses = req.session;
  ses.email = req.body.email;
  console.log(req.session);
  console.log(req.session.email);
  let status = authenticate.register(connection, req, res)
  if (status.flag) {
    console.log('abc')
    //console.log(status)
    res.end('done');
  }
});

app.get('/login', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.redirect('/');
  }
  else {
    res.render('login.ejs', { title: 'Login Form', isLoggedIn: false });
  }
});

app.get('/register', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.redirect('/');
  }
  else {
    res.render('registration.ejs', { title: 'Registration Form', isLoggedIn: false });
  }
});

app.get('/home', function (req, res) {
  res.redirect('/');
});

app.get('/', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('index.ejs', { title: 'The Cakery', isLoggedIn: true });
  } else {
    res.render('index.ejs', { title: 'The Cakery', isLoggedIn: false });
  }
});

app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});

app.get('/summary', function (req, res) {
  ses = req.session;
  let data;
  console.log('sesssion', ses)
  if (ses.email) {
  connection.query('SELECT * FROM `summary` WHERE email  = "'+ ses.email +'"', function (error, results, fields) {
      if (error) { 
        res.end('error');
      } else { 
        console.log('summary',results);
        res.render('summary.ejs', { title: 'Summary', isLoggedIn: true, data: results });
      }
    });
  } else {
    res.redirect('/');
  }
});

app.get('/products', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('products.ejs', { title: 'Products', isLoggedIn: true });
  } else {
    res.render('products.ejs', { title: 'Products', isLoggedIn: false });
  }
});

app.get('/specials', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('specials.ejs', { title: 'Specials', isLoggedIn: true });
  } else {
    res.render('specials.ejs', { title: 'Specials', isLoggedIn: false });
  }
});

app.get('/contact_us', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('contactus.ejs', { title: 'Contact Us', isLoggedIn: true });
  } else {
    res.render('contactus.ejs', { title: 'Contact Us', isLoggedIn: false });
  }
});

app.get('/about_us', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('aboutus.ejs', { title: 'About Us', isLoggedIn: true });
  } else {
    res.render('aboutus.ejs', { title: 'About Us', isLoggedIn: false });
  }
});

app.get('/find_us', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('findus.ejs', { title: 'Find Us Here', isLoggedIn: true });
  } else {
    res.render('findus.ejs', { title: 'Find Us Here', isLoggedIn: false });
  }
});

app.get('/faq', function (req, res) {
  ses = req.session;
  if (ses.email) {
    res.render('faq.ejs', { title: 'FAQ', isLoggedIn: false });
  } else {
    res.render('faq.ejs', { title: 'FAQ', isLoggedIn: true });
  }
});


app.post('/submitfeedback', function (req, res) {
  console.log(req.body.name);
  console.log(req.body.email);
  connection.query('INSERT INTO `feedback`(`name`, `email`, `feedback`) VALUES ("'+ req.body.name +'", "'+ req.body.email +'", "'+ req.body.feedback +'")', function (error, results, fields) {
    if (error) { 
      res.end('error');
    } else {
      res.end('done');
    }
});
  
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))