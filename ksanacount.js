/*
	given a string , return count
*/
const concreteToken=require("./tokenizer").concreteToken;
const PUNC=require("./tokentypes").TokenTypes.PUNC;

// return number of kpos unit in a string
const getCount=function(tokenizer){
	return function(str){
		const tokenized=tokenizer.tokenize(str);
		var out=0;
		for (var i=0;i<tokenized.length;i++) {
			if (concreteToken[tokenized[i][2]])out++;
		}
		return out;
	}
}
//advance nToken and return kpos offset
const getSkipToken=function(tokenizer,removePunc) {
	return function(line,tokencount){
		//related with ksana-corpus-builder/inverted.js::putToken
		//when puncAsToken, a Puncuation will increase tpos and kpos
		//otherwise, a Puncuation will not increase kpos and tpos
		//puncuation will not be indexed
		const tokenized=tokenizer.tokenize(line);
		var i=0,koffset=0;
		while (tokencount && i<tokenized.length){
			const token=tokenized[i];
			if (concreteToken[token[2]] ) {
				koffset++;
				tokencount--;
			}
			//if not removePunc, a punc will increase tpos
			if (!removePunc && token[2]==PUNC){
				tokencount--;
			}
			i++;
		}
		return koffset;
	}
}
//return string offset given number of token, 
//set tailing true to eat up following non-concreate tokens.
const getOffset=function(tokenizer){
//return offset of n token
	return function(str,ntoken,tailing){
		if (!str)return 0;
		const tokenized=tokenizer.tokenize(str);
		var i=0;

		while (i<tokenized.length &&!concreteToken[tokenized[i][2]]) {
			i++;
		}

		while (ntoken&&i<tokenized.length){
			if (concreteToken[tokenized[i][2]]) ntoken--;
			i++;
		}

		while (tailing&&i<tokenized.length && !concreteToken[tokenized[i][2]]){
			i++;
		}

		if (i<tokenized.length) return tokenized[i][1];
		return tokenized[tokenized.length-1][1]+tokenized[tokenized.length-1].length;
	}
}
module.exports={getCount:getCount,getOffset:getOffset,getSkipToken:getSkipToken};