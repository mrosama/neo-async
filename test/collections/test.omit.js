/* global it */
'use strict';

var domain = require('domain');

var assert = require('power-assert');
var parallel = require('mocha.parallel');

var async = global.async || require('../../');
var delay = require('../config').delay;
var util = require('../util');

function omitIterator(order) {

  return function(num, callback) {

    var self = this;

    setTimeout(function() {

      if (self && self.round) {
        num = self.round(num);
      }
      order.push(num);
      callback(null, num % 2);
    }, num * delay);
  };
}

function omitIteratorWithKey(order) {

  return function(num, key, callback) {

    var self = this;

    setTimeout(function() {

      if (self && self.round) {
        num = self.round(num);
      }
      order.push([num, key]);
      callback(null, num % 2);
    }, num * delay);
  };
}

parallel('#omit', function() {

  it('should execute iterator by collection of array', function(done) {

    var order = [];
    var collection = [1, 3, 2, 4];
    async.omit(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '2': 2,
        '3': 4
      });
      assert.deepEqual(order, [1, 2, 3, 4]);
      done();
    });
  });

  it('should execute iterator by collection of array with passing index', function(done) {

    var order = [];
    var collection = [1, 3, 2, 4];
    async.omit(collection, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '2': 2,
        '3': 4
      });
      assert.deepEqual(order, [
        [1, 0],
        [2, 2],
        [3, 1],
        [4, 3]
      ]);
      done();
    });
  });

  it('should execute iterator by collection of object', function(done) {

    var order = [];
    var collection = {
      a: 4,
      b: 3,
      c: 2
    };
    async.omit(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [2, 3, 4]);
      done();
    });
  });

  it('should execute iterator by collection of object with passing key', function(done) {

    var order = [];
    var collection = {
      a: 4,
      b: 3,
      c: 2
    };
    async.omit(collection, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [
        [2, 'c'],
        [3, 'b'],
        [4, 'a']
      ]);
      done();
    });
  });

  it('should execute iterator by collection of Map', function(done) {

    var order = [];
    var collection = new util.Map();
    collection.set('a', 4);
    collection.set('b', 3);
    collection.set('c', 2);
    async.omit(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [2, 3, 4]);
      done();
    });
  });

  it('should execute iterator by collection of Map with passing key', function(done) {

    var order = [];
    var collection = new util.Map();
    collection.set('a', 4);
    collection.set('b', 3);
    collection.set('c', 2);
    async.omit(collection, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [
        [2, 'c'],
        [3, 'b'],
        [4, 'a']
      ]);
      done();
    });
  });

  it('should execute iterator without binding', function(done) {

    var order = [];
    var collection = {
      a: 1.1,
      b: 3.5,
      c: 2.6
    };

    async.omit(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1.1, 2.6, 3.5]);
      done();
    }, Math);
  });

  it('should throw error', function(done) {

    var order = [];
    var collection = [1, 3, 2, 4];
    var iterator = function(num, callback) {
      setTimeout(function() {
        order.push(num);
        callback(num === 3, num % 2);
      }, num * delay);
    };

    async.omit(collection, iterator, function(err, res) {
      assert.ok(err);
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '2': 2
      });
      assert.deepEqual(order, [1, 2, 3]);
      done();
    });
  });

  it('should throw error', function(done) {

    var order = [];
    var collection = {
      a: 1,
      b: 3,
      c: 2,
      d: 4
    };
    var iterator = function(num, callback) {
      setTimeout(function() {
        order.push(num);
        callback(num === 3, num % 2);
      }, num * delay);
    };

    async.omit(collection, iterator, function(err, res) {
      assert.ok(err);
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        c: 2
      });
      assert.deepEqual(order, [1, 2, 3]);
      done();
    });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = [2, 1, 3];
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omit(collection, iterator);
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = [2, 1, 3];
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omit(collection, iterator, function(err, res) {
          if (err) {
            return done(err);
          }
          assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
          assert.deepEqual(res, {
            '0': 2,
            '1': 1,
            '2': 3
          });
        });
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = {
          a: 4,
          b: 3,
          c: 2
        };
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omit(collection, iterator);
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = {
          a: 4,
          b: 3,
          c: 2
        };
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omit(collection, iterator, function(err, res) {
          if (err) {
            return done(err);
          }
          assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
          assert.deepEqual(res, {
            a: 4,
            b: 3,
            c: 2
          });
        });
      });
  });

  it('should return response immediately if array is empty', function(done) {

    var order = [];
    var array = [];
    async.omit(array, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if object is empty', function(done) {

    var order = [];
    var object = {};
    async.omit(object, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is function', function(done) {

    var order = [];
    async.omit(function() {}, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is undefined', function(done) {

    var order = [];
    async.omit(undefined, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is null', function(done) {

    var order = [];
    async.omit(null, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

});

parallel('#omitSeries', function() {

  it('should execute iterator to series by collection of array', function(done) {

    var order = [];
    var collection = [1, 3, 2, 4];
    async.omitSeries(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '2': 2,
        '3': 4
      });
      assert.deepEqual(order, [1, 3, 2, 4]);
      done();
    });
  });

  it('should execute iterator to series by collection of array with passing index', function(done) {

    var order = [];
    var collection = [1, 3, 2, 4];
    async.omitSeries(collection, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '2': 2,
        '3': 4
      });
      assert.deepEqual(order, [
        [1, 0],
        [3, 1],
        [2, 2],
        [4, 3]
      ]);
      done();
    });
  });

  it('should execute iterator to series by collection of object', function(done) {

    var order = [];
    var collection = {
      a: 4,
      b: 3,
      c: 2
    };
    async.omitSeries(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [4, 3, 2]);
      done();
    });
  });

  it('should execute iterator to series by collection of object with passing key', function(done) {

    var order = [];
    var collection = {
      a: 4,
      b: 3,
      c: 2
    };
    async.omitSeries(collection, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [
        [4, 'a'],
        [3, 'b'],
        [2, 'c']
      ]);
      done();
    });
  });

  it('should execute iterator to series by collection of Map', function(done) {

    var order = [];
    var collection = new util.Map();
    collection.set('a', 4);
    collection.set('b', 3);
    collection.set('c', 2);
    async.omitSeries(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [4, 3, 2]);
      done();
    });
  });

  it('should execute iterator to series by collection of Map with passing key', function(done) {

    var order = [];
    var collection = new util.Map();
    collection.set('a', 4);
    collection.set('b', 3);
    collection.set('c', 2);
    async.omitSeries(collection, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        a: 4,
        c: 2
      });
      assert.deepEqual(order, [
        [4, 'a'],
        [3, 'b'],
        [2, 'c']
      ]);
      done();
    });
  });

  it('should execute iterator to series without binding', function(done) {

    var order = [];
    var collection = {
      a: 1.1,
      b: 3.5,
      c: 2.6
    };

    async.omitSeries(collection, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1.1, 3.5, 2.6]);
      done();
    }, Math);
  });

  it('should execute on asynchronous', function(done) {

    var sync = true;
    var collection = {
      a: 1,
      b: 3,
      c: 2
    };
    var iterator = function(n, key, callback) {
      callback(null, n % 2);
    };
    async.omitSeries(collection, iterator, function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(sync, false);
      assert.deepEqual(res, {
        c: 2
      });
      done();
    });
    sync = false;
  });

  it('should throw error', function(done) {

    var order = [];
    var collection = [1, 3, 2, 4];
    var iterator = function(num, callback) {
      setTimeout(function() {
        order.push(num);
        callback(num === 3, num % 2);
      }, num * delay);
    };

    async.omitSeries(collection, iterator, function(err, res) {
      assert.ok(err);
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1, 3]);
      done();
    });
  });

  it('should throw error', function(done) {

    var order = [];
    var collection = {
      a: 1,
      b: 3,
      c: 2,
      d: 4
    };
    var iterator = function(num, callback) {
      setTimeout(function() {
        order.push(num);
        callback(num === 3, num % 2);
      }, num * delay);
    };

    async.omitSeries(collection, iterator, function(err, res) {
      assert.ok(err);
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1, 3]);
      done();
    });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = [2, 1, 3];
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitSeries(collection, iterator);
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = [2, 1, 3];
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitSeries(collection, iterator, function(err, res) {
          if (err) {
            return done(err);
          }
          assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
          assert.deepEqual(res, {
            '0': 2,
            '1': 1,
            '2': 3
          });
        });
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = {
          a: 4,
          b: 3,
          c: 2
        };
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitSeries(collection, iterator);
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = {
          a: 4,
          b: 3,
          c: 2
        };
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitSeries(collection, iterator, function(err, res) {
          if (err) {
            return done(err);
          }
          assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
          assert.deepEqual(res, {
            a: 4,
            b: 3,
            c: 2
          });
        });
      });
  });

  it('should return response immediately if array is empty', function(done) {

    var order = [];
    var array = [];
    async.omitSeries(array, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.deepEqual(res, []);
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if object is empty', function(done) {

    var order = [];
    var object = {};
    async.omitSeries(object, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is function', function(done) {

    var order = [];
    async.omitSeries(function() {}, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is undefined', function(done) {

    var order = [];
    async.omitSeries(undefined, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is null', function(done) {

    var order = [];
    async.omitSeries(null, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

});

parallel('#omitLimit', function() {

  it('should execute iterator in limited by collection of array', function(done) {

    var order = [];
    var collection = [1, 5, 3, 2, 4];

    async.omitLimit(collection, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '3': 2,
        '4': 4
      });
      assert.deepEqual(order, [1, 3, 5, 2, 4]);
      done();
    });
  });

  it('should execute iterator in limited by collection of array with passing index', function(done) {

    var order = [];
    var collection = [1, 5, 3, 2, 4];

    async.omitLimit(collection, 2, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '3': 2,
        '4': 4
      });
      assert.deepEqual(order, [
        [1, 0],
        [3, 2],
        [5, 1],
        [2, 3],
        [4, 4]
      ]);
      done();
    });
  });

  it('should execute iterator in limited by collection of object', function(done) {

    var order = [];
    var collection = {
      a: 1,
      b: 5,
      c: 3,
      d: 2,
      e: 4
    };
    async.omitLimit(collection, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        d: 2,
        e: 4
      });
      assert.deepEqual(order, [1, 3, 5, 2, 4]);
      done();
    });
  });

  it('should execute iterator in limited by collection of object with passing key', function(done) {

    var order = [];
    var collection = {
      a: 1,
      b: 5,
      c: 3,
      d: 2,
      e: 4
    };
    async.omitLimit(collection, 2, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        d: 2,
        e: 4
      });
      assert.deepEqual(order, [
        [1, 'a'],
        [3, 'c'],
        [5, 'b'],
        [2, 'd'],
        [4, 'e']
      ]);
      done();
    });
  });

  it('should execute iterator in limited by collection of Map', function(done) {

    var order = [];
    var collection = new util.Map();
    collection.set('a', 1);
    collection.set('b', 5);
    collection.set('c', 3);
    collection.set('d', 2);
    collection.set('e', 4);
    async.omitLimit(collection, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        d: 2,
        e: 4
      });
      assert.deepEqual(order, [1, 3, 5, 2, 4]);
      done();
    });
  });

  it('should execute iterator in limited by collection of Map with passing key', function(done) {

    var order = [];
    var collection = new util.Map();
    collection.set('a', 1);
    collection.set('b', 5);
    collection.set('c', 3);
    collection.set('d', 2);
    collection.set('e', 4);
    async.omitLimit(collection, 2, omitIteratorWithKey(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        d: 2,
        e: 4
      });
      assert.deepEqual(order, [
        [1, 'a'],
        [3, 'c'],
        [5, 'b'],
        [2, 'd'],
        [4, 'e']
      ]);
      done();
    });
  });

  it('should execute iterator to series without binding', function(done) {

    var order = [];
    var collection = {
      a: 1.1,
      b: 3.5,
      c: 2.7
    };

    async.omitLimit(collection, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1.1, 3.5, 2.7]);
      done();
    }, Math);
  });

  it('should execute like parallel if limit is Infinity', function(done) {

    var order = [];
    var collection = [1, 3, 4, 2, 3, 1, 3];

    async.omitLimit(collection, Infinity, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {
        '2': 4,
        '3': 2
      });
      assert.deepEqual(order, [1, 1, 2, 3, 3, 3, 4]);
      done();
    });
  });

  it('should execute on asynchronous', function(done) {

    var sync = true;
    var collection = {
      a: 1,
      b: 3,
      c: 2,
      d: 4,
      e: 5
    };
    var iterator = function(n, key, callback) {
      callback(null, n % 2);
    };
    async.omitLimit(collection, 2, iterator, function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(sync, false);
      assert.deepEqual(res, {
        c: 2,
        d: 4
      });
      done();
    });
    sync = false;
  });

  it('should throw error', function(done) {

    var order = [];
    var collection = {
      a: 2,
      b: 1,
      c: 3
    };
    var iterator = function(num, callback) {
      setTimeout(function() {
        order.push(num);
        callback(num === 2, num);
      }, num * delay);
    };
    async.omitLimit(collection, 4, iterator, function(err, res) {
      assert.ok(err);
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1, 2]);
      done();
    });
  });

  it('should throw error', function(done) {

    var order = [];
    var collection = [2, 1, 3];
    var iterator = function(num, callback) {
      setTimeout(function() {
        order.push(num);
        callback(num === 2, num);
      }, num * delay);
    };
    async.omitLimit(collection, 4, iterator, function(err, res) {
      assert.ok(err);
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, [1, 2]);
      done();
    });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = [2, 1, 3];
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitLimit(collection, 4, iterator);
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = [2, 1, 3];
        var iterator = function(item, index, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitLimit(collection, 4, iterator, function(err, res) {
          if (err) {
            return done(err);
          }
          assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
          assert.deepEqual(res, {
            '0': 2,
            '1': 1,
            '2': 3
          });
        });
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = {
          a: 2,
          b: 1,
          c: 3
        };
        var iterator = function(item, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitLimit(collection, 4, iterator);
      });
  });

  it('should throw error if double callback', function(done) {

    var errorCallCount = 0;
    setTimeout(function() {
      assert.strictEqual(errorCallCount, 3);
      done();
    }, delay);

    domain.create()
      .on('error', util.errorChecker)
      .on('error', function() {
        errorCallCount++;
      })
      .run(function() {
        var collection = {
          a: 2,
          b: 1,
          c: 3
        };
        var iterator = function(item, index, callback) {
          process.nextTick(callback);
          process.nextTick(callback);
        };
        async.omitLimit(collection, 4, iterator, function(err, res) {
          if (err) {
            return done(err);
          }
          assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
          assert.deepEqual(res, {
            a: 2,
            b: 1,
            c: 3
          });
        });
      });
  });

  it('should return response immediately if array is empty', function(done) {

    var order = [];
    var array = [];
    async.omitLimit(array, 3, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if object is empty', function(done) {

    var order = [];
    var object = {};
    async.omitLimit(object, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is function', function(done) {

    var order = [];
    async.omitLimit(function() {}, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is undefined', function(done) {

    var order = [];
    async.omitLimit(undefined, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if collection is null', function(done) {

    var order = [];
    async.omitLimit(null, 2, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if limit is zero', function(done) {

    var order = [];
    var collection = [1, 3, 2];
    async.omitLimit(collection, 0, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

  it('should return response immediately if limit is undefined', function(done) {

    var order = [];
    var collection = [1, 3, 2];
    async.omitLimit(collection, undefined, omitIterator(order), function(err, res) {
      if (err) {
        return done(err);
      }
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepEqual(res, {});
      assert.deepEqual(order, []);
      done();
    });
  });

});