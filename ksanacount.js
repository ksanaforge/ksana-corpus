/*
	given a string , return count
*/
var {parseIDS}=require("./tokenizer");

const isWestern=function(c){
return (c>=0x41&&c<=0x5a) ||(c>=0x61&&c<=0x7a)
			|| (c>=0x100&&c<=0x17f) ||(c>=0x1e00&&c<=0x1eff)
}
const pali=function(t) {
	var i=0,r=0,c,wlen;
	while (i<t.length) {
		wlen=0;
		c=t.charCodeAt(i);
		while (i<t.length&&!isWestern(c)) {
			i++;
			c=t.charCodeAt(i);
		}
		while (i<t.length&&isWestern(c)) {
			i++;
			c=t.charCodeAt(i);
			wlen++;
		}
		if (wlen) r++;
	}
	return r;
}
const cjk_nopunc=function(t){
	var i=0,r=0;
	while (i<t.length) {
		var code=t.charCodeAt(i);
		if ((code>=0x3400 && code<=0x9fff)
			||(code>=0x3040 && code<=0x30FF) //kana
			||(code>=0xE000 && code<=0xFAFF) //pua && supplement
			||(code>=0x2e80 && code<=0x2fff) //radicals
			||(code>=0x3100 && code<=0x31BF) //bopomofo
			) {
			r++;
		} else if (code>=0xd800&&code<=0xdfff) {
			r++;
			i++;
		} else if (code>=0x2ff0&&code<=0x2fff) {

			throw "ids not supported yet"
		}

		i++;
	}
	return r;
}
var cjk_next=function(t){
	var r=0,i=0;
	if (!t)return 0;
	while (!r && i<t.length){
		code=t.charCodeAt(i);
		if (code>=0xd800&&code<=0xdfff) {
			r++;
			i++;
		} else if (code>=0x2ff0&&code<=0x2fff) {
			var c=parseIDS(t.substr(i));
			r++;
			i+=c;
		} else if (code>=0x3400 && code<=0x9fff) {
			r++;
		}
		i++;		
	}
	return i;
}
var cjk=function(t){
	var i=0,r=0;
	while (i<t.length){
		code=t.charCodeAt(i);
		if (code>=0xd800&&code<=0xdfff) {
			r++;
			i++;
		} else if (code>=0x2ff0&&code<=0x2fff) {
			var c=parseIDS(t.substr(i));
			r++;
			i+=c;
		} else if (code>=0x3400 && code<=0x9fff) {
			r++;
		}
		i++;
	}
	return r;
}
/*
const getRawToken=function(obj){
	var i=0,r=0;
	var t=obj.str;
	code=t.charCodeAt(i);
	if ((code>=0x3400 && code<=0x9fff)
			||(code>=0x3040 && code<=0x30FF) //kana
			||(code>=0xE000 && code<=0xFAFF) //pua && supplement
			||(code>=0x2e80 && code<=0x2fff) //radicals
			||(code>=0x3100 && code<=0x31BF) //bopomofo
			|| (code>=0xd800&&code<=0xdfff)) {
		i++;
		if (code>=0xd800&&code<=0xdfff) i++;
	} else if (code>=0x2ff0&&code<=0x2fff) {
		var c=parseIDS(t.substr(i));
		i+=c;
	} else if (code>0x20 && code<1024 ) {
		i++;
		while (i<t.length && t.charCodeAt(i)<1024) {
			i++;
		}
	} else {
		i++;
	}

	//tailing blank
	while (i<t.length && (t.charCodeAt(i)<=32 || t[i]==="　"))i++;

	obj.str=t.substr(i);
	return t.substr(0,i);
}*/
const getCounter=function(language){
	if (language==="classical_chinese") {
		return cjk_nopunc;
	} else if (language==="pali") {
		return pali;
	}
	return cjk;
}
const getNext=function(language) {
	if (language==="classical_chinese") {
		return cjk_next;
	}
	return cjk_next;	
}
module.exports={cjk,cjk_nopunc,parseIDS,getCounter,getNext};