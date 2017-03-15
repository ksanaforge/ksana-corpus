/*
	given a string , return count
*/
const concreteToken=require("./tokenizer").concreteToken;

const getCounter=function(tokenizer){
	return function(str){
		const tokenized=tokenizer.tokenize(str);
		var out=0;
		for (var i=0;i<tokenized.length;i++) {
			if (concreteToken[tokenized[i][2]])out++;
		}
		return out;
	}
}
const getNext=function(tokenizer){
	return function(str,ch){
		if (!str)return 0;
		const tokenized=tokenizer.tokenize(str);
		var i=0;

		while (i<tokenized.length && !concreteToken[tokenized[i][2]]){
			i++;
		}

		while (ch&&i<tokenized.length){
			if (concreteToken[tokenized[i][2]])ch--;
			i++;
		}

		while (i<tokenized.length && !concreteToken[tokenized[i][2]]){
			i++;
		}

		if (i<tokenized.length) return tokenized[i][1];
		return tokenized[tokenized.length-1][1]+tokenized[tokenized.length-1].length;
	}
}
module.exports={getCounter:getCounter,getNext:getNext};