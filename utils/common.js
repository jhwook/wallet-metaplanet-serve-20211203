
const moment=require('moment')
const KEYS=Object.keys
function generaterandomstr (length) {
  var result           = '';	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {		 result += characters.charAt(Math.floor(Math.random() * charactersLength))	}
  return result
}
const generaterandomhex=(length , type)=>{
	var result           = '';	var characters       = 'abcdef0123456789'
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {		 result += characters.charAt(Math.floor(Math.random() * charactersLength))	}
	return result
}
const TIMEFORMATSTR='YYYY-MM-DDTHH:mm:ss'
const TIMEFORMATSTR_RAW='YYYYMMDDHHmmss'
const gettimestr=_=>moment().format(TIMEFORMATSTR)
const gettimestr_raw=_=>moment().format(TIMEFORMATSTR_RAW)
const cyrb53 = function(str, seed = 0) {
	let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
			ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
	h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
	return 4294967296 * (2097151 & h2) + (h1>>>0);
}
function hashFnv32a(str, asString, seed) {	/*jshint bitwise:false */
	var i, l,			hval = (seed === undefined) ? 0x811c9dc5 : seed;
	for (i = 0, l = str.length; i < l; i++) {
			hval ^= str.charCodeAt(i);
			hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
	}
	if( asString ){			// Convert to 8 digit hex string
			return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
	}
	return hval >>> 0;
}
const gettimestrwithspace=_=>moment().format('YYYY-MM-DD HH:mm:ss')
/**  const crypto = require('crypto')
const configsha256=require('../configs/config-sha256')
const hashviasha256=_data=>{return crypto.createHmac('sha256', configsha256.secret ).update(configsha256.password ).digest('hex') }
*/
const sha256 = require('js-sha256').sha256
const hashviasha256=str=>sha256(str)

const filter_json_by_nonnull_criteria=jdata=>{
	KEYS(jdata).forEach(key=>{		if(jdata[key]){} else {delete jdata[key]}		
	})
	return jdata
}
const generaterandomstr_charset=(length,charsetcode)=>{let characters
       if(charsetcode=='base58') {characters='123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'}
  else if (charsetcode=='numbers'){characters='0123456789'}
  else if (charsetcode=='lower'){characters='abcdefghijklmnopqrstuvwxyz'}
  else if (charsetcode=='hex')  {characters='abcdef0123456789'}
  else if (charsetcode=='notconfusing'){characters='2345679BCDEGHKLQSUZadehiopqstu'}
	else {characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'}
	
  var charactersLength = characters.length;let result=''
  for ( var i = 0; i < length; i++ ) {		 result += characters.charAt(Math.floor(Math.random() * charactersLength))	}
  return result
}

// => 594ae48dcdc55777fdc05ceea4b40c45ec5118946a12797228dd8106e8f1e5fb
module.exports={generaterandomhex, LOGGER:console.log , cyrb53 , hash53:cyrb53 , hashFnv32a,gettimestr ,gettimestr_raw , gettimestrwithspace , hashviasha256 
	, filter_json_by_nonnull_criteria
	, generaterandomstr
	, generaterandomstr_charset
}

const main=_=>{
	let { generaterandomhex , hashFnv32a , hash53}=require('./common')
	let arr=[]
	for (let i=0;i<10;i++){arr.push(generaterandomhex(100))}
	let arr1= arr.map(elem=>hashFnv32a(elem,1))
	let arr2= arr.map(elem=>hash53(elem))
	arr2[0].toString(16).padStart(16 , 0)
	
}
