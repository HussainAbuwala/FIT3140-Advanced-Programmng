  //Chai is a BDD / TDD assertion library  for node and the browser that can be delightfully paired with any javascript testing framework.  */

   var chai = require('chai');
    var expect = chai.expect; // Expect also allows you to include arbitrary messages to prepend to any failed assertions that might occur.
    var assert = chai.assert;
      var Watson = require('./test');  //describe() is merely for grouping, which you can nest as deep 

      describe('Watson', function() {      
      //it() is a test case

     it('getTotalFaces() should be able identify a single face',
      function(done) { 
           this.timeout(60000);
           var watson = new Watson('dd.jpg')
           watson.getTotalFaces(function (faces) {
              expect(faces).to.equal(1);
              done();
            })
      });

     it('getTotalFaces() should be able to identify a group of faces',
      function(done) { 
           this.timeout(60000);
           var watson = new Watson('grp.jpg')
           watson.getTotalFaces(function (faces) {
              expect(faces).to.equal(5);
              done();
            })
      });

     it('getTotalFaces() should return false if path is not a string',
      function(done) { 
           this.timeout(60000);
           var watson = new Watson(1)
           watson.getTotalFaces(function (faces) {
              expect(faces).to.equal(false);
              done();
            })
      });

     it('getAverageAges() should return the average age to be > 50 for the old man',
      function(done) { 
           this.timeout(60000);
           var watson = new Watson('old.jpg')
           watson.getAverageAges(function (ages) {
              assert.isAbove(ages[0],50);
              //expect(ages).to.deep.equal([31.5]);
              done();
            })
      });
     
     it('getAverageAges() should return the average age to be < 10 for the child',
      function(done) { 
           this.timeout(60000);
           var watson = new Watson('child.jpg')
           watson.getAverageAges(function (ages) {
              assert.isBelow(ages[0],10);
              //expect(ages).to.deep.equal([31.5]);
              done();
            })
      });
   }); 