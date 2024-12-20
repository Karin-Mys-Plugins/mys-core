const version = { cn: '2.70.1', os: '1.5.0' }

const app_id = 2 //崩三 1 未定 2 原神 4 崩二 7 崩铁 8 绝区零 12

const salt = {
	os: '6cqshh5dhw73bzxn20oexa9k516chk7s',
	'4X': 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs',
	'6X': 't0qEgfub6cvueAPgR5m9aQWWVciEer7v',
	K2: 'S9Hrn38d2b55PamfIR9BNA3Tx9sQTOem',
	LK2: 'sjdNFJB7XxyDWGIAk0eTV8AOCfMJmyEo',
	PROD: 'JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS'
}

export const MysApp = {
	version,
	app_id,
	salt
}