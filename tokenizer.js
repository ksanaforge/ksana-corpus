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


const tokenize=function(s){ //only accept \n
	const c2tt=this.code2TokenType;

	var i=0,out=[],tk,unknown=false;
	while (i<s.length) {
		tk="";
		if (s[i]=="\n") { //own token for linebreak
			out.push([s[i],i,TokenTypes.SPACE]);
			i++;
		}
		var type=c2tt[s.charCodeAt(i)];
		if (type==TokenTypes.SURROGATE) {
			tk=s.substr(i,2);
			out.push([tk,i,type]);
			i+=2;
			continue;
		} else if (type===TokenTypes.IDC) {
			var c=parseIDS(s.substr(i));
			tk=s.substr(i,c);
			out.push([tk,i,type]);
			i+=c;
			continue;
		} else if (type===TokenTypes.CJK || type===TokenTypes.PUNC) {
			tk=s.substr(i,1);
			out.push([tk,i,type]);
			i++;
			continue;
		} else if (type===TokenTypes.TIBETAN || type===TokenTypes.LATIN|| type===TokenTypes.NUMBER) {
			tk=s.substr(i,1);
			out.push([tk,i,type]);
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
			continue;
		} else {
			type=TokenTypes.SPACE;
		}
		if (type===TokenTypes.SPACE){
			var start=i;
			while (i<s.length) {
				tk+=s.substr(i,1);
				i++;
				var code=s.charCodeAt(i);
				var type=c2tt[code];
				if (type!==TokenTypes.SPACE || s[i]=="\n") break;
			}
			if (tk) out.push([tk,start,TokenTypes.SPACE]);
		}
	}	
	return out;
}

const createTokenizer=function(version){
	const code2TokenType=tt.getCode2TokenTypeMap(version);

	const isConcatable=function(str){
		if (!str)return true;
		const type=code2TokenType[str.charCodeAt(0)];
		return (type==TokenTypes.CJK||
			type==TokenTypes.TIBETAN||
			type==TokenTypes.IDC||
			type==TokenTypes.PUNC||
			type==TokenTypes.SPACE
		);
	}

	return {tokenize:tokenize, TokenTypes:TokenTypes , 
		version:version, code2TokenType:code2TokenType
		, isConcatable:isConcatable};
}

const concreteToken={};

concreteToken[TokenTypes.SURROGATE]=true;
concreteToken[TokenTypes.CJK]=true;
concreteToken[TokenTypes.NUMBER]=true;
concreteToken[TokenTypes.TIBETAN]=true;
concreteToken[TokenTypes.LATIN]=true;
concreteToken[TokenTypes.IDC]=true;


module.exports={createTokenizer:createTokenizer,parseIDS:parseIDS,latest:2
	,concreteToken:concreteToken
,};