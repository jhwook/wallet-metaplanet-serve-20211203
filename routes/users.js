var express = require("express");
var router = express.Router();
const {
  findone,
  findall,
  createrow,
  updaterow,
  countrows_scalar,
  createorupdaterow,
} = require("../utils/db");
const { updaterow: updaterow_mon } = require("../utils/dbmon");
const KEYS = Object.keys;
const {
  LOGGER,
  generaterandomstr,
  generaterandomstr_charset,
  gettimestr,
  convaj,
} = require("../utils/common");
const {
  respok,
  respreqinvalid,
  resperr,
  resperrwithstatus,
} = require("../utils/rest");
const { messages } = require("../configs/messages");
const { getuseragent, getipaddress } = require("../utils/session");
const {
  sendemail,
  sendemail_customcontents_withtimecheck,
} = require("../services/mailer");
const { validateemail } = require("../utils/validates");
const db = require("../models");
// const dbmon=require('../modelsmongo')
const { getusernamefromsession } = require("../utils/session");
// const { createrow:createrow_mon , updaterow : updaterow_mon }=require('../utils/dbmon')
const TOKENLEN = 48;
const { web3, createaccount } = require("../configs/configweb3");
//const { getWal letRecode } = require("../utils/wallet_recode");
const { getWalletRecode } = require("../utils/wallet_recode");
const { getMetaplanetRecode } = require("../utils/wallet_recode_metaplanet");
const { getPolygon } = require("../utils/get_polygon");
const { generateSlug } = require("random-word-slugs");
const { MAP_USER_ACTIONS } = require("../configs/configs");
const moment = require("moment");
const { NETTYPE }=require('../configs/net')
/* GET users listing. */

//getPolygon().then(resp=>{
//	console.log(resp);
//});

router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});
const MAP_USERPREFS_KEYS = {
  NOTIFY_TRANSACTIONS_INSIDE: "0",
  NOTIFY_TRANSACTIONS_OUTSIDE: "0",
  NOTIFY_NOTIFIES: "0",
  NOTIFY_PROMOEVENTS: "0",
};

router.get("/history/eth/:address/:pageNum/:pageSize", (req, res) => {
  const { address, pageNum, pageSize } = req.params;
  getWalletRecode(address, pageNum, pageSize).then((resp) => {
    respok(res, null, null, {
      payload: {
        getData: resp,
      },
    });
  });
});

router.get("/history/metaplanet/:address/:pageNum/:pageSize", (req, res) => {
  const { address, pageNum, pageSize } = req.params;
  getMetaplanetRecode(address, pageNum, pageSize).then((resp) => {
    respok(res, null, null, {
      payload: {
        getData: resp,
      },
    });
  });
});
/**** router.get('/polygon',(req,res)=>{
//	const { date1, date2 } = req.params;
	getPolygon().then(resp=>{
		respok ( res, null, null , {payload : {
			getData: resp
		}})
	});
}) */
router.get("/transactions/inside", (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN);
    return;
  }
  findall("transactionsinside", { username }).then((list) => {
    respok(res, null, null, { payload: { list } });
  });
});
router.get("/userprefs/notify", (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN);
    return;
  }
  findall("userprefs", { username, active: 1 }).then((list) => {
    if (list) {
      let jresp = convaj(list, "key_", "value_");
      let jdata = {};
      KEYS(MAP_USERPREFS_KEYS).forEach((elem) => {
        if (jresp[elem]) {
          jdata[elem] = jresp[elem];
        } else {
          jdata[elem] = MAP_USERPREFS_KEYS[elem];
        }
      });
      respok(res, null, null, {
        payload: {
          prefs: { ...jdata },
        },
      });
    } else {
      respok(res, null, null, {
        payload: {
          prefs: { ...MAP_USERPREFS_KEYS },
        },
      });
    }
  });
});
router.post("/userprefs/notify/toggle/:keyname", (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN);
    return;
  }
  let { keyname } = req.params;
  if (MAP_USERPREFS_KEYS[keyname]) {
  } else {
    resperr(res, messages.MSG_ARGINVALID, 38542);
    return;
  }
  findone("userprefs", { username, key_: keyname }).then((resp) => {
    if (resp) {
      let value_ = 1 ^ +resp.value_;
      updaterow("userprefs", { id: resp.id }, { value_ }).then((resp) => {
        respok(res, null, null, { payload: { aftertogglevalue: value_ } });
      });
    } else {
      let value_ = 1 ^ +MAP_USERPREFS_KEYS[keyname];
      createrow("userprefs", { username, key_: keyname, value_ }).then(
        (resp) => {
          respok(res, null, null, { payload: { aftertogglevalue: value_ } });
        }
      );
    }
  });
});
router.post("/userprefs/notify/:keyname/:value", (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN);
    return;
  }
  let { keyname, value } = req.params;
  if (MAP_USERPREFS_KEYS[keyname]) {
  } else {
    resperr(res, messages.MSG_ARGINVALID, 86627);
    return;
  }
  value = +value;
  if (value == 1 || value == 0) {
  } else {
    resperr(res, messages.MSG_ARGINVALID, 31686);
    return;
  }
  createorupdaterow(
    "userprefs",
    { username, key_: keyname },
    { value_: value }
  ).then((resp) => {
    respok(res, null, null, {
      payload: { aftertogglevalue: resp.dataValues.value_ },
    });
  });
});
const generate_token_and_store = (username, req) => {
  return new Promise((resolve, reject) => {
    const token = generaterandomstr(TOKENLEN);
    //		let username=address
    let ipaddress = getipaddress(req);
    createrow("sessionkeys", {
      username,
      token,
      useragent: getuseragent(req),
      ipaddress: getipaddress(req),
    }).then(async (resp) => {
      resolve(token);
      // 	respok(res ,null,null,{respdata:token })
    });
  });
};

const USER_LEVEL_DEF = 3;

router.post("/join", (req, res) => {
  let {
    username,
    nickname,
    pw,
    // email,
    dob,
    phonenumber,
    realname,
    currentBlockNumber,
  } = req.body;
  LOGGER("", req.body);
  if (username && pw) {
  } else {
    resperr(res, messages.MSG_ARGMISSING, 40761);
    return false;
  }
  findone("users", { username }).then((respuser) => {
    // email
    if (respuser) {
      resperr(res, messages.MSG_ID_DUP, 82532);
      return false;
    }
    createrow("users", {
      username,
      nickname: nickname ? nickname : generateSlug(3, { format: "camel" }),
      pw,
      ip: getipaddress(req),
      // email,
      active: 1,
      level: USER_LEVEL_DEF, //		, pwhash:hasher(pw)

      dob,
      phonenumber,
      realname,
    }); //    db.operations.findOne({raw:true,where:{key_:'CURRENCIES'}}).then(respcurr=>{      const currencies=JSON.parse(respcurr['value_'])
    let acct = createaccount();
    console.log("currentBlockNumber:");
    console.log(currentBlockNumber);
    createrow("accounts", {
      username: username,
      ...acct,
      privatekey: acct.privateKey,
      nettype : NETTYPE ,
      currentBlockNumber: currentBlockNumber,
      firstUsedBlockNumber: currentBlockNumber,
    }).then((resp) => {
      generate_token_and_store(username, req).then((token) => {
        respok(res, null, null, {
          payload: {
            address: acct.address,
            nettype : NETTYPE ,
            token,
          },
          currentBlockNumber: currentBlockNumber,
        });
      });
      createrow("logactions", {
        username,
        unixtime: moment().unix(),
        type: MAP_USER_ACTIONS["JOIN"],
        typestr: "JOIN",
        ipaddress: getipaddress(req),
      });
    });
    false && callhook({ name: username, path: "join" });
    return false;
  });
});
/** {
  address: '0x37BD824BD9ca792a76B2c0376DF8f937623432d0',
  privateKey: '0xcf8f3a4e03c59f9a5e255b1e8160cdbf088c403b930c4676a35fbdd7abbc0d51',
*/
const MAP_FIELDS_ALLOWED_TO_CHANGE = { pw: 1, nickname: 1 };
router.post("/user/myinfo", (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN);
    return;
  }
  LOGGER("8t6dIUoLNx", req.body);
  let jreqbody = { ...req.body };
  let akeys = KEYS(jreqbody);
  akeys.forEach((elem) => {
    if (jreqbody[elem]) {
    } else {
      delete jreqbody[elem];
    }
    if (MAP_FIELDS_ALLOWED_TO_CHANGE[elem]) {
    } else {
      delete jreqbody[elem];
    }
  });
  if (KEYS(jreqbody).length > 0) {
  } else {
    resperr(res, messages.MSG_ARGINVALID);
    return;
  }
  updaterow("users", { username }, { ...jreqbody });
  respok(res);

  let jlogaction = {};
  let unixtime = moment().unix();
  if (jreqbody["nickname"]) {
    jlogaction = {
      type: MAP_USER_ACTIONS["CHANGE-NICKNAME"],
      typestr: "CHANGE-NICKNAME",
    };
    createrow("logactions", {
      username,
      unixtime,
      ...jlogaction,
      ipaddress: getipaddress(req),
    });
  }
  if (jreqbody["pw"]) {
    jlogaction = {
      type: MAP_USER_ACTIONS["CHANGE-PW"],
      typestr: "CHANGE-PW",
    };
    createrow("logactions", {
      username,
      unixtime,
      ...jlogaction,
      ipaddress: getipaddress(req),
    });
  }

  updaterow_mon("users", { username }, { ...jreqbody })
    .then((resp) => {})
    .catch((err) => {
      resperr(res, messages.MSG_INTERNALERR);
    });
});

router.get("/user/crypto-account", (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN, 403);
    return;
  }
  findone("accounts", { username }).then((resp) => {
    respok(res, null, null, { payload: { account: resp } });
  });
});
/** username   | varchar(80)      | YES  |     | NULL                |                               |
| address    | varchar(80)      | YES  |     | NULL                |                               |
| privatekey | varchar(100)     | YES  |     | NULL                |                               |
| net type    | varchar(2
*/
router.get("/user/myinfo", async (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN, 403);
    return;
  }
  findone("users", { username }).then(async (resp) => {
    delete resp.pw;

    let respacct = await findone("accounts", { username });

    respok(res, null, null, {
      payload: {
        myinfo: resp,
        accounts: {
					address : respacct.address ,
					nettype : NETTYPE // "ETH-TESTNET": 
        },
      },
    });
  });
});
router.get("/user/myinfo/mongo", async (req, res) => {
  const username = getusernamefromsession(req);
  if (username) {
  } else {
    resperr(res, messages.MSG_PLEASELOGIN, 403);
    return;
  }
  dbmon.users.findOne({ username: username }, async (err, doc) => {
    if (err) {
      LOGGER("", err);
      resperr(res, messages.MSG_INTERNALERR, 500);
      return;
    }
    let countfavorites = await countrows_scalar("logfavorites", {
      username,
      status: 1,
    });
    query_user_market_acts(username).then((respusermarket) => {
      respok(res, null, null, {
        respdata: doc,
        payload: { ...respusermarket, countfavorites },
      });
    });
  });
});

router.get("/id/duplicatecheck/:id", (req, res) => {
  const { id } = req.params;
  findone("users", { username: id }).then((resp) => {
    if (resp)  res.status(406).send({ error: "이미 존재하는 아이디 입니다." });
    else res.status(200).send(id);
  });
});

router.post("/email/verifycode/:emailaddress/:code", (req, res) => {
  const { emailaddress, code } = req.params;
  findone("emailverifycode", { emailaddress: emailaddress }).then((resp) => {
    if (resp) {
    } else {
      resperrwithstatus(res, 412, messages.MSG_DATANOTFOUND);
      return;
    }
    if (resp["code"] == code) {
    } else {
      resperrwithstatus(res, 406, messages.MSG_VERIFYFAIL);
      return;
    }
    respok(res);
  });
});

router.get("/email/verifycode/:emailaddress", (req, res) => {
  const { emailaddress } = req.params;
  if (validateemail(emailaddress)) {
  } else {
    resperrwithstatus(res, 406, messages.MSG_ARGINVALID);
    return;
  }
  sendemail(emailaddress).then((resp) => {
    if (resp.status) {
      respok(res);
      return;
    } else {
      resperrwithstatus(res, 501, resp.reason);
      return;
    }
  });
});
router.post("/login", async (req, res) => {
  const { username, pw } = req.body;
  LOGGER("m9m9hptxoA", req.body); //  respok(res);return
  if (username && pw) {  } 
	else {    resperr(res, messages.MSG_ARGMISSING);
    return;
  }   //  let isaddressvalid = WAValidator.validate(address , cryptotype.toLowerCase() ) //  if(isaddressvalid){} else {   resperr(res , messaegs.MSG_ARGINVALID);return  //  }
  findone("users", { username, pw }).then(async (resp) => {
    if (resp) {
    } else {
      resperr(res, messages.MSG_VERIFYFAIL);
      LOGGER(messages.MSG_VERIFYFAIL);
      return;
    }
    let { icanlogin } = resp;
    if (icanlogin) {
    } else {
      resperr(res, messages.MSG_AUTH_FAILED);
      LOGGER(messages.MSG_AUTH_FAILED);
      return;
    }
    let respacct = await findone("accounts", { username });
    //		let jacct= {}
    //	jacct= { address : respacct.address , nett ype : 'ETH-TESTNET' }
    const token = generaterandomstr(TOKENLEN);
    let ipaddress = getipaddress(req);
		let resptokenenv = await findone ( 'tokens' , { nettype : NETTYPE , active:1 , istoken : 1 } )
    createrow("sessionkeys", {
      username,
      token,
      useragent: getuseragent(req).substr(0, 900),
      ipaddress,
    }).then(async (resp) => {
      respok(res, null, null, {
        respdata: token,
        payload: {
          token,
          accounts: {
            nettype : NETTYPE // "ETH-TESTNET": 
						, address :				respacct.address,
          },
					tokenenv : resptokenenv 	
        },
      });
      createrow("logactions", {
        username,
        unixtime: moment().unix(),
        type: MAP_USER_ACTIONS["LOGIN"],
        typestr: "LOGIN",
        ipaddress: getipaddress(req),
      });
    });
  });
});
router.post("/logout", (req, res) => {
  LOGGER("/logout", req.headers.token);
  if (req.headers.token) {
  } else {
    resperrwithstatus(res, 403, messages.MSG_PLEASELOGIN, 36632);
    return;
  }
  db.sessionkeys
    .findOne({ where: { token: req.headers.token } })
    .then((respfind) => {
      if (respfind && respfind.dataValues) {
      } else {
        resperrwithstatus(res, 403, messages.MSG_PLEASELOGIN);
        return;
      }
      if (respfind.dataValues.active) {
      } else {
        resperrwithstatus(res, 412, messages.MSG_SESSIONEXPIRED);
        return;
      }
      let { username } = respfind.dataValues;
      respfind
        .update({ active: 0 })
        .then((respupdate) => {
          respok(res);

          createrow("logactions", {
            username,
            unixtime: moment().unix(),
            type: MAP_USER_ACTIONS["LOGOUT"],
            typestr: "LOGOUT",
            ipaddress: getipaddress(req),
          });
          /**       let {dataValues}=respfind ;      if(dataValues.isoauth){} else {return}
      db.oauthsessions.findOne({where:{id:dataValues.idtooauthtable}}).then(respoauth=>{
        respupdate.update({active:0})
      }).catch(err=>{LOGGER('PCXENcujpp' ,err) ; resperr(res) })
*/
        })
        .catch((err) => {
          LOGGER("sHw1wZpAZ4", err);
          resperr(res);
        });
    })
    .catch((err) => {
      LOGGER("Cf9NiZEEY7", err);
      resperr(res);
    });
});

module.exports = router;
