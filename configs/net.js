
let NETTYPE='ETH-TESTNET'
//	let NETTYPE='ETH-MAINNET'
let tokeninfo = {
		TOKENNAME : 'META'
	, TOKENDECIMALS : 6
}
module.exports ={ 
	NETTYPE
	, ... tokeninfo
//	, TOKENNAME
	//, TOKENDECIMALS
}
