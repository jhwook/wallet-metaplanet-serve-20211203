var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
let {findone , updatetable }=require('./utils/db')
const {getipaddress}=require('./utils/session')
const adminrouter=require('./routes/admin')
const tickersrouter=require('./routes/tickers')
const balancesrouter=require('./routes/balances')
const contentsrouter=require('./routes/contents')
const transactionsrouter=require('./routes/transactions')
const cors=require('cors')
var app = express();
const wrap = asyncFn => {
  return (async (req, res, next) => {
    try {      return await asyncFn(req, res, next) }
    catch (error) {      return next(error) }
  })
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(wrap(async(req,res,next)=>{let token=req.headers.token
  if (token){     const resp=await findone('sessionkeys',{token:token,active:1})
    // LOGGER('bXcKR6bgGp',resp)
    if(resp){
			let { username } =resp
			req.username=username // ;req.userlevel=resp.level	//      req.userdata = resp
			let lastactive= gettimestr()
      updatetable('sessionkeys'	,{id:resp.id },{ lastactive }) // token:token,active:1
      updatetable('users' 			, { username },{ lastactive }) // token:token,active:1
    }
    else {  // req.userlevel=null
    }
  }
  LOGGER('3fX8T5ZBmQ',req.username,getipaddress(req) , req.connection.remotePort)
  next()
}))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminrouter);
app.use('/tickers', tickersrouter);
app.use('/balances', balancesrouter);
app.use('/contents', contentsrouter);
app.use('/transactions', transactionsrouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
let {gettimestr}=require('./utils/common')
let moment=require('moment')
let cron = require('node-cron')
const LOGGER=console.log
cron.schedule('* * * * *', _=>{
	LOGGER(gettimestr())
})
