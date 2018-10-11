// Holds prioirity queue of anything
function PriorityQueue (lessThanFunction, n) {
    this.arr = Array(n);
    this.last = -1;
    this.lt = lessThanFunction; // Return true if element at idxA gets priority over element at idxB
}

(function () {

    function parentIdx (i) {
        return parseInt((i-1) / 2);
    }

    function leftChildIdx (i) {
        return i * 2 + 1;
    }

    Object.defineProperties(PriorityQueue.prototype, {
        'isEmpty': {
            value: function () {
                return this.last < 0;
            },
        },
        'push': {
            value: function (user) {
                var i = ++this.last;
                this.arr[i] = user;
                this.trickleUp(i);
            },
        },
        'pop': {
            value: function () {
                var ret = this.arr[0];
                this.arr[0] = this.arr[this.last];
                this.last --;
                this.trickleDown(0);
                return ret;
            },
        },
        'swap': {
            value: function (idxA, idxB) {
                var tmp = this.arr[idxA];
                this.arr[idxA] = this.arr[idxB];
                this.arr[idxB] = tmp;
            },
        },
        'trickleUp': {
            value: function (i) {
                var parI = parentIdx(i);
                if (this.lt(i, parI)) {
                    this.swap(i, parI);
                    this.trickleUp(parI);
                }
            },
        },
        'trickleDown': {
            value: function (i) {
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
            },
        },
    });

})();


var a = [1,4,8,3,8,0,5,3,2,7,99,2,5,31,7];
var h = new PriorityQueue(function  (idxA, idxB) {
           return this.arr[idxA] - this.arr[idxB] < 0;
      
}, a.length);
for (var i in a)
    h.push(a[i]);
while (!h.isEmpty()) {
    console.log(h.pop())
}
