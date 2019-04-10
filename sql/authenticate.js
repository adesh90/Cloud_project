exports.register = function (connection, req, res) {
	const reqBody = req.body;
  let state ={};  
  connection.query('INSERT INTO `users`(`username`, `password`, `email`, `address`, `contact`) VALUES ("'+reqBody.username+'","'+reqBody.password+'","'+reqBody.email+'","'+reqBody.address+'",'+reqBody.contact+')', function (error, results, fields) {
		if (error) { 
      state = {
        "code": 400,
        "flag": false,
        "reason": "error occurred in login process"
      };
      res.end('error');
		} else {
      state = {
        "code": 200,
        "flag": true,
        "reason": "user sucessfully registered"
      };
      res.end('done');
		}
  });
  return state;
}

exports.login = function(connection, req, res, ses) {
  ses.email = req.body.email;
  ses.password = req.body.password;
  const emailId = ses.email;
  const password = ses.password;
  console.log('email', emailId,'password', password);

  let state = {};
  connection.query("SELECT * FROM `users` WHERE `email` = '"+ emailId +"' and `password` = '"+ password +"' ", function (error, results, fields) {
  if (error) {
    // console.log("error ocurred",error);
    state = {
      "code": 400,
      "flag": false,
      "reason": "error occurred in login process"
    };
    res.end('error');
  }
  else {
    // console.log('The solution is: ', results);
    if(results.length > 0) {
      console.log('resumts,',results)
      if(results[0].password == password){
        state = {
          "code": 200,
          "flag": true,
          "reason": "user  is sucessfully logged in"
        };
       flag = true;
       res.end('done');
      }
      else {
        state = {
          "code": 204,
          "flag": false,
          "reason": "Combination of Email and password does not match"
        };
        res.end('error');
      }
    }
    else{
      state = {
        "code": 204,
        "flag": false,
        "reason": "Email does not exits, please try again"
      };
      res.end('error');
    }
  }
  });
  return state;
}