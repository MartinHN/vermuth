   var testing = require('testing');
   import * as ofl from 'OFLImport'
   let tests = []
   tests = tests.concat(Object.values(ofl))
   /**
     * Run package tests.
     */
    exports.test = function(callback)
    {   
        

        testing.run(tests, callback);
    };  
        
    // run tests if invoked directly
    if (__filename == process.argv[1])
    {   
        // console.log(tests)

        exports.test(testing.show);
    }