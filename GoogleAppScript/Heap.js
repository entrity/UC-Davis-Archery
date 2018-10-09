// Holds priority queue of users
function Heap (arrayOfUsers) {
    var n = arrayOfUsers.length;
    this.arr = Array(n);
    this.last = -1;
    for (var i in arrayOfUsers) {
        this.push(arrayOfUsers[i]);
    }
}

(function () {
    function parentIdx (i) {
        return parseInt((i-1) / 2);
    }
    
    function leftChildIdx (i) {
        return i * 2 + 1;
    }
    
    function compare(a, b) {
        return (
            (a.registrations.length - b.registrations.length) // favour low ct
            || (a.timestamp - b.timestamp) // favour low timestamp
            || -(a.isMember - b.isMember) // favour members
        );
    }

    Heap.prototype.isEmpty = function () {
        return this.last < 0;
    }

    Heap.prototype.push = function (user) {
        var i = ++this.last;
        this.arr[i] = user;
        this.trickleUp(i);
    }
    
    Heap.prototype.pop = function () {
        var ret = this.arr[0];
        this.arr[0] = this.arr[this.last];
        this.last --;
        this.trickleDown(0);
    	return ret;
    }
    
    // Return true if element at idxA gets priority over element at idxB
    Heap.prototype.lt = function (idxA, idxB) {
        return compare(this.arr[idxA], this.arr[idxB]) < 0;
    }
    
    Heap.prototype.swap = function (idxA, idxB) {
        var tmp = this.arr[idxA];
        this.arr[idxA] = this.arr[idxB];
        this.arr[idxB] = tmp;
    }
    
    Heap.prototype.trickleUp = function (i) {
        var parI = parentIdx(i);
        if (this.lt(i, parI)) {
            this.swap(i, parI);
            this.trickleUp(parI);
        }
    }
    
    Heap.prototype.trickleDown = function (i) {
        var childI;
        var lI = leftChildIdx(i);
        if (lI > this.last) return;
        var rI = lI + 1;
        if (rI > this.last)
            childI = lI;
        else
            childI = this.arr[lI] < this.arr[rI] ? lI : rI;
        if (this.lt(childI, i)) {
            this.swap(i, childI);
            this.trickleDown(childI);
        }
    }
})();

// var a = [1,4,8,3,8,0,5,3,2,7,99,2,5,31,7];
// var h = new Heap(a);
// while (!h.isEmpty()) {
//     console.log(h.pop())
// }
