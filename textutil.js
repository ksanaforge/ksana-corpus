const bsearch=require("./bsearch");
const Ksanapos=require("./ksanapos");

const trimRight=function(str,chcount) {
	if (!str) return "";
	var c=chcount,dis=0,t,s=str;

	t=this.knext(s,c);
	dis+=t;
	/*
	s=s.substr(t);
	while (s.charCodeAt(0)<0x3400||s.charCodeAt(0)>0xdfff){
		s=s.substr(1);
		dis++;
	}	
	*/
	return str.substr(0,dis);
}
const trimLeft=function(str,chcount) {
	if (!str) return "";
	var c=chcount,dis=0,t,s=str;
	t=this.knext(s,c);
	dis+=t;
	s=s.substr(t);
	while (s.charCodeAt(0)<0x3400||s.charCodeAt(0)>0xdfff){
		s=s.substr(1);
		dis++;
	}
	return str.substr(dis);
}
const layoutText=function(text,startkpos,breaks){
		var page=0,prevpage=0,lines=[],linetext="";
		var linebreaks=[],pagebreaks=[],kpos=startkpos,nbreak=0;
		var nextkpos;//kpos of next line start
		
		for (var i=0;i<text.length;i++) {
			nextkpos=this.advanceLineChar(startkpos,i+1);
			page=this.pageOf(kpos);
			if (prevpage!==page) {
				while (lines.length>0&&!lines[lines.length-1].trim()) { 
					linebreaks.pop();
					lines.pop(); //remove extra tailing blank lines
				}
				pagebreaks.push(kpos); //show page break on screen
			}
			if (breaks) {
				if (nbreak<breaks.length&&nextkpos>breaks[nbreak]) {
					const leftpart=trimRight.call(this,text[i],breaks[nbreak]-kpos);
					lines.push(linetext+leftpart);
					linetext=text[i].substr(leftpart.length);
					nbreak++;
				} else {
					linetext+=text[i];
				}
			} else {
				lines.push(text[i]);
				linebreaks.push(kpos);
			}
			prevpage=page;
			kpos=nextkpos;
		}
		if (breaks) {
			linebreaks=breaks;
			linebreaks.unshift(startkpos);
			lines.push(linetext);
		}
		return {linebreaks,pagebreaks,lines};
}
const extractKPos=function(text){
	var out={},pat=this.addressPattern,fileOf=this.fileOf.bind(this);
	text.replace(this.addressRegex,function(m,m1){
		const kRange=Ksanapos.parse(m1,pat);
		if (typeof kRange!=="undefined") {
			var f=fileOf(kRange);
			if (!f.filename) return;
			if (!out[f.filename]) out[f.filename]=[];
			out[f.filename].push(kRange);
		}
	});
	return out;
}
/*
  add advline to kpos and return new kpos 
  advline can be more than maxChar
	crossing vol is not allowed
*/

const advanceLineChar=function(kpos,advline,linetext){
	const pat=this.addressPattern;
	kpos+=advline*pat.maxchar;
	
	if (linetext) {
		var arr=Ksanapos.unpack(kpos,pat);
		arr[3]=this.kcount(linetext);
		return Ksanapos.makeKPos(arr,pat);
	} else {
		return kpos;
	}
}
const parseRange=function(kRange,pat){
	if (typeof pat=="undefined") pat=this.addressPattern;
	if (typeof kRange=="string") {
		kRange=Ksanapos.parse(kRange,pat);
	}
	const r=Ksanapos.breakKRange(kRange,pat);
	
	const startarr=Ksanapos.unpack(r.start,pat);
	var endarr=Ksanapos.unpack(r.end,pat);
	return {startarr,endarr,start:r.start,end:r.end,kRange};
}

const toLogicalRange=function(linebreaks,address,getLine){ //find logical line
	krange=parseRange.call(this,address);

	var line=bsearch(linebreaks,krange.start,true)-1;
	var line2=bsearch(linebreaks,krange.end,true)-1;

	line=(line<0)?0:line;
	line2=(line2<0)?0:line2;

	var l1=getLine(line), l2=getLine(line2);

	var ch=this.knext(l1, krange.start-linebreaks[line]  );
	var ch2=this.knext(l2,krange.end - linebreaks[line2]);

	//skip puncuation, hacky
	var code=l1.charCodeAt(ch);
	while (ch<l1.length && (code<0x3400 || code>=0xdfff)) {
		ch++;
		code=l1.charCodeAt(ch);
	}
	
	start={line,ch};
	end={line:line2,ch:ch2};
	return {start,end};
}
const kPosUnpack=function(kpos,pat){
	pat=pat||this.addressPattern;
	const startarr=Ksanapos.unpack(kpos,pat);
	return startarr;
}

const bookOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[0];
}
const pageOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[1];
}
const lineOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[2];
}
const charOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[3];
}

module.exports={trimLeft,trimRight,parseRange,bookOf,pageOf,lineOf,charOf,
	layoutText,extractKPos,advanceLineChar,toLogicalRange};