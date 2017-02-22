const tt=require("./tokentypes");
const TokenTypes=tt.TokenTypes;

var parseIDS=function(str){ //return number of char used by one IDS
	var count=0,i=0;
	while (count!==1&&i<str.length) {
		var code=str.charCodeAt(i);
		if (code>=0x2ff0 && code<=0x2ffb) {
			count--;//two operands
			if (code===0x2ff2 || code===0x2ff3) count--; //three operands
		} else count++;
		i++;
	}
	return i;
}
/* break a string into tokens 
each token 
['trimmed token','raw token',offset,tokentype]
*/
const tokenize=function(s){
	const c2tt=this.code2TokenType;

	var i=0,out=[],tk,unknown=false;
	while (i<s.length) {
		tk="";
		var type=c2tt[s.charCodeAt(i)];
		if (type==TokenTypes.SURROGATE) {
			tk=s.substr(i,2);
			out.push([tk,null,i,type]);
			i+=2;
			type=c2tt[s.charCodeAt(i)];
		} else if (type===TokenTypes.IDC) {
			var c=parseIDS(s.substr(i));
			tk=s.substr(i,c);
			out.push([tk,null,i,type]);
			i+=c;
			type=c2tt[s.charCodeAt(i)];
		} else if (type===TokenTypes.CJK || type===TokenTypes.PUNC) {
			tk=s.substr(i,1);
			out.push([tk,null,i,type]);
			i++;
			type=c2tt[s.charCodeAt(i)];
		} else if (type===TokenTypes.TIBETAN || type===TokenTypes.LATIN|| type===TokenTypes.NUMBER) {
			tk=s.substr(i,1);
			out.push([tk,null,i,type]);
			i++;
			var leadtype=type;
			while (i<s.length) {
				var code=s.charCodeAt(i);
				var type=c2tt[code];
				if (type!=leadtype) break;
				tk+=s.substr(i,1);
				i++;
			}
			out[out.length-1][0]=tk;
		} else {
			unknown=true;
		}
		
		if (type===TokenTypes.SPACE)	{
			if (tk==="") out.push([tk,null,i,type]);
			while (i<s.length) {
				tk+=s.substr(i,1);
				i++;
				var code=s.charCodeAt(i);
				var type=c2tt[code];
				if (type!==TokenTypes.SPACE) break;
			}
		} else if (unknown) i++;
		out.length&&(out[out.length-1][1]=tk);//token with tailing spaces
	}
	return out;
}

const createTokenizer=function(version){
	const code2TokenType=tt.getCode2TokenTypeMap(version);
	return {tokenize:tokenize, TokenTypes:TokenTypes , version:version, code2TokenType:code2TokenType};
}

module.exports={createTokenizer:createTokenizer,parseIDS:parseIDS,latest:1};