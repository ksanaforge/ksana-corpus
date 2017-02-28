const buildAddressPattern=function(b,column){
	const bookbits=b[0],pagebits=b[1],linebits=b[2], charbits=b[3];
	if (charbits*2+linebits*2+pagebits*2+bookbits>53) {
		throw "address has more than 53 bits";
	}
	if (linebits>6 || charbits>8) {
		console.log(linebits,charbits)
		throw "max line/char bits is 6 and 8";
	}
	const maxchar=1<<(charbits);
	const maxline=1<<(linebits);
	const maxpage=1<<(pagebits);
	const maxbook=1<<(bookbits);
	var rangebits=charbits+linebits+pagebits;
	const maxrange=1<<(rangebits);
	const bits=[bookbits,pagebits,linebits,charbits];
	const kposbits=bookbits+pagebits+linebits+charbits;
	return {maxbook:maxbook,maxpage:maxpage,maxline:maxline,maxchar:maxchar
		,maxrange:maxrange,bits:bits,kposbits:kposbits,
					bookbits:bookbits,pagebits:pagebits,linebits:linebits,charbits:charbits,rangebits:rangebits,column:column};
}
var checknums=function(nums,pat){
	if (nums[3]>=pat.maxchar) {
		console.error(nums[3],"exceed maxchar",pat.maxchar)
		return 0;
	}
	if (nums[2]>=pat.maxline) {
		console.error(nums[2],"exceed maxline",pat.maxline)
		return 0;
	}
	if (nums[1]>=pat.maxpage) {
		console.error(nums[1],"exceed maxpage",pat.maxpage)
		return 0;
	}
	if (nums[0]>=pat.maxbook) {
		console.error(nums[0],"exceed maxbook",pat.maxbook)
		return 0;
	}
	return 1;
}
var makeKPos=function(nums,pat){
	var i,mul=1, kpos=0;
	for (i=0;i<nums.length;i++) {
		if (nums[i]<0) {
			console.error("negative value",nums[i],nums);
			return -1;
		}
	}
	var checknumerror=false;
	if(!checknums(nums,pat)) {
		//auto fix line and char,normally book and page will not exceed
		checknumerror=true;
		if (nums[2]>=pat.maxline) {
			nums[2]=pat.maxline-1;
		}
		if (nums[3]>=pat.maxchar) {
			nums[3]=pat.maxchar-1;
		}		
	}

	kpos=nums[3];       mul*=Math.pow(2,pat.charbits);
	kpos+= nums[2]*mul; mul*=Math.pow(2,pat.linebits);
	kpos+= nums[1]*mul; mul*=Math.pow(2,pat.pagebits);
	kpos+= nums[0]*mul;

	if (checknumerror) {
		console.error("kpos trimmed",stringifyKPos(kpos,pat),nums);
	}

	return kpos;
}
//kstart might be zero if book=0,page=0,line=0,ch=0
const breakRange=function(range,pat,forceRange){
	if (forceRange||isRange(range,pat)){
		var r=Math.pow(2,pat.rangebits);
		var dis=Math.floor(range%r);
		start=Math.floor(range/r);
		end=start+dis;		
		return {start:start,end:end};
	} else {
		return {start:range,end:range};
	}
}
const makeRange=function(startkpos,endkpos,pat){
	if (isNaN(startkpos)||isNaN(endkpos)) {
		return 0;
	}
	
	if (startkpos>endkpos) {
		const t=startkpos;
		startkpos=endkpos;
		endkpos=t;
	}

	var r=endkpos-startkpos;
	if (r>pat.maxrange) {
		//throw "range too far "+ r;
		r=pat.maxrange-1;
	}
	const maxrange=Math.pow(2,pat.rangebits);
	if (r>=maxrange) r=maxrange-1;
	return startkpos*maxrange+r;
}
var unpack=function(kpos,pat){
//	kpos--;
	var ch=kpos%pat.maxchar;
	var line=Math.floor((kpos/pat.maxchar)%pat.maxline);
	var page=Math.floor((kpos/ Math.pow(2,pat.charbits+pat.linebits)) %pat.maxpage);
	var vol=Math.floor((kpos/Math.pow(2,pat.charbits+pat.linebits+pat.pagebits))%pat.maxbook);

	var r=[vol,page,line,ch];
	return r;
}
const stringifyKPos=function(kpos,pat){
	const parts=unpack(kpos,pat);
	var s= (parts[0])+'p';
	if (pat.column){//for taisho
		s+=Math.floor(parts[1]/pat.column)+1;	
		s+=String.fromCharCode((parts[1]%pat.column)+0x61);
	} else {
		s+=(parts[1]+1);
		s+='.';
	}
	line='0'+(parts[2]+1);
	s+=line.substr(line.length-2);
	if (pat.charbits>6) {
		ch='0'+ (parts[3]).toString(16).toUpperCase();
	} else {
		ch='0'+ (parts[3]);
	}
	s+=ch.substr(ch.length-2);
	return s;
}
//not valid if kpos_start==0
const isRange=function(k,pat){
	return (k/Math.pow(2,pat.kposbits))>1;
}
const stringify=function(krange_kpos,pat){
	if (isRange(krange_kpos,pat)) {
		const r=breakRange(krange_kpos,pat);
		var e=stringifyKPos(r.end,pat);
		var at=e.indexOf("p");
		e=e.substr(at+1); //remove vol
		const s=stringifyKPos(r.start,pat);
		const sarr=unpack(r.start,pat), earr=unpack(r.end,pat);

		if (sarr[1]!==earr[1]) { //different page
			if (pat.column) {
				if (Math.floor(sarr[1]/pat.column)==Math.floor(earr[1]/pat.column)) {
					return s+'-'+e.substr(e.length-5);//end page is omitted
				}
			}
			return s+'-'+e;
		} else if (sarr[2]!==earr[2]) { //diffrent line
			return s+'-'+e.substr(e.length-4);
		} else if (sarr[3]!==earr[3])	{ //different char
			return s+'-'+e.substr(e.length-2);
		}
		return s;
	} else {
		return stringifyKPos(krange_kpos,pat);
	}
}

/* convert human readible address to an integer*/
const parseLineChar=function(arr,linech,remain,pat){
	if (linech.length<3) {
		var base=10;
		if (remain &&pat.charbits >6 ){
			base=16;
		}
		arr[remain?3:2]=parseInt(linech,base)- (remain?0:1) ;// if remain part, it is ch, otherwise line
	} else {
		arr[2]=parseInt(linech.substr(0,2),10)-1;  //first two is line
		arr[3]=parseInt(linech.substr(2,2),pat.charbits>6?16:10); //ch is one or two byte
	}
}
const regexFollow1=/(\d+)([a-d\.])([A-F]\d+)/
const regexFollow2=/([a-d])([A-F]\d+)/
const regexFollow3=/([A-F]\d+)/
const parseRemain=function(remain,pat,arr){ //arr=[book,page,col,line,ch]
	var m=remain.match(regexFollow1);
	var start=makeKPos(arr,pat);

	if (!m) {
		m=remain.match(regexFollow2); // have column and line and ch
		if (!m) {
			m=remain.match(regexFollow3); //only have line and ch
			if (!m) return start;

			parseLineChar(arr,m[1],true,pat);
		} else {
			arr[1]=Math.floor(arr[1]/3);
			arr[1]=arr[1]*pat.column+(parseInt(m[1],36)-10);

			parseLineChar(arr,m[2],true,pat);
		}
	} else { //has page, col
		arr[1]=parseInt(m[1],10)-1;  //page start from 0
		if (pat.column) {
			arr[1]=arr[1]*pat.column+(parseInt(m[2],36)-10);
		}
		parseLineChar(arr,m[3],false,pat);
	}

	var end=makeKPos(arr,pat);
	if (end<start) {
		console.error("end bigger than start",arr);
		return start+1;
	}
	return end;
}
const regexAddress=/(\d+)p(\d+)([a-d\.])([A-F\d]+)/
const regexAddressShort=/(\d+)p(\d+)([a-d]?)/

const parse=function(address,pat){
	var m=address.match(regexAddress);
	if (!m) {
		m=address.match(regexAddressShort);
	}
	if (!m) return null;
	var arr=[0,0,0,0];//book,page,col,line,ch

	arr[0]=parseInt(m[1],10); 
	arr[1]=parseInt(m[2],10)-1;
	if (pat.column) {
		var c=(m[3]=="."||!m[3])?"a":m[3];
		arr[1]=arr[1]*pat.column+(parseInt(c,36)-10);
	}
	
	if (m.length>4){
		parseLineChar(arr,m[4],false,pat);
	}
	var start=makeKPos(arr,pat);
	var end=start;

	const at=address.indexOf("-");
	if (at>-1) {
		remain=address.substr(at+1);
		end=parseRemain(remain,pat,arr);
	}
	//} else {
	//	end+=1;
	//}
	
	return makeRange(start,end,pat);
}
const bookStartPos=function(kpos,pat){
	var arr=unpack(kpos,pat);
	arr[2]=0,arr[3]=0;
	return makeKPos(arr,pat);
}
module.exports={parse:parse,buildAddressPattern:buildAddressPattern,makeKPos:makeKPos,isRange:isRange,
	makeRange:makeRange,breakRange:breakRange,unpack:unpack,stringify:stringify,bookStartPos:bookStartPos};