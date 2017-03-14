const assert=require("assert");
const tokenizer=require("./tokenizer").createTokenizer();
var e;



//console.log(JSON.stringify(e))


e=tokenizer.tokenize("༼ཁ༽ ༄༅། ༈ །འདུལ་བ་ལུང་བཞུགས་སོ། །律師戒行經第二部")


e=tokenizer.tokenize("abc efg");
assert.equal(e.length,3,JSON.stringify(e))
assert.equal(e[0][0],"abc",JSON.stringify(e))
assert.equal(e[1][0]," ",JSON.stringify(e))
assert.equal(e[2][0],"efg",JSON.stringify(e))


e=tokenizer.tokenize("中文");
assert.equal(e.length,2,JSON.stringify(e))

e=tokenizer.tokenize("aa中  bb");

assert.equal(e.length,4,JSON.stringify(e))
assert.equal(e[0][0],"aa",JSON.stringify(e))
assert.equal(e[1][0],"中",JSON.stringify(e))
assert.equal(e[2][0],"  ",JSON.stringify(e))
assert.equal(e[3][0],"bb",JSON.stringify(e))

e=tokenizer.tokenize("⿰中中⿲中中中⿳中中中");
assert.equal(e.length,3,JSON.stringify(e))

e=tokenizer.tokenize("孔𠀉孔");
assert.equal(e.length,3,JSON.stringify(e))


e=tokenizer.tokenize("　　　　　　　┌發心菩提─┐");
assert.equal(e.length,6,JSON.stringify(e))
//romanize Sanskrit and Pali are treated as LATIN
e=tokenizer.tokenize("aĀĪŪṚṜḶḸṂḤṆṄṆÑŚṢĒŌṀḐṬṚḺz zāīūṛṝḷḹṃḥṇṅṇñśṣēōṁḑṭṛḻz");
assert.equal(e.length,3,JSON.stringify(e))
console.log(e.map(function(item){return item[0]}).join("|"))
