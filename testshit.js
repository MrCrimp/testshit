// Dirty concept of browser based continuous testing (shitty code I know.. it was originally just a quick test to see if closure scopes could be modified from the outside.)
// (C) 2013 Johan O
// SWL - Standard Whatever Licence 

// Best used with TINCR extension http://tin.cr/

window.onerror = function(){
   codeRed();
}

Function.prototype.specsIn = window.specsIn = function (specName) {
   // require a spec file for a module
   if (window.bucket[specName]) return;
   requireSpec(specName);
}

function requireSpec(contextName, alreadyExistsFunc) {
   if (alreadyExistsFunc && alreadyExistsFunc() !== false) return void 0;
   var s = document.createElement("script");
   s.type = "text/javascript";
   s.async = true;
   s.src = 'specs/' + contextName + '.js?t=' + new Date().getTime();
   (document.body || document.head).appendChild(s);
   s.onload = Testshit.digest;
   return s;
}

function removeShortcutIcons() {
   linkTags = document.getElementsByTagName('link');
   for(i = linkTags.length-1; i >= 0; i--) {
      var linkTag = linkTags[i];
      if(linkTag.getAttribute('rel') == 'test icon') {
         linkTag.parentNode.removeChild(linkTag);
      }
   }
}

function setShortcutIcon() {
   removeShortcutIcons();
   var head = document.getElementsByTagName('HEAD')[0]
   var linkTag = document.createElement('LINK');
   linkTag.setAttribute('rel', 'test icon');
   linkTag.setAttribute('type', 'image/x-icon');
   linkTag.setAttribute('href', 'http://cdn.dustball.com/' + (window.bucket.allPassed ? 'accept' : 'exclamation') + '.png');
   head.appendChild(linkTag);
}

function setStatus() {
   setShortcutIcon();
}

function codeRed() {
   window.bucket.allPassed = false;
   setStatus();
}

function codeGreen() {
   window.bucket.allPassed = !!window.bucket.allPassed;
   if (!window.bucket.allPassed) return codeRed();
   return setStatus();
}

function getStack(err, i){
   var stack = (err.stacktrace||err.stack||'\n').split('\n');
   return stack[1].indexOf('Error') > -1 ? stack[4] : stack[1];
}

!function () {
   'use strict';

   var digest,
      runSpec,
      scope = window,
      scenarioFailed = false,
      INTERVAL_SECS = 10;

   runSpec = function (spec, name) {
      console.group('Running spec ' + name);
      try {
         spec.run();
      }
      catch (err) {
         scenarioFailed = true;
         codeRed();
         console.error(err.message);
         console.log(getStack(err));
      }
      finally {
         console.groupEnd()
      }
   };

   scope.expect = function (cond, text, dontThrow, expectThrow) {
      var source = text || arguments,
         describe = source instanceof String ? source.toLowerCase() : source[0].toLowerCase(),
         description = describe.startsWith('should') ? describe : 'should ' + describe ;

      function throwIt() {
         if (!expectThrow)  throw Error(description + ' >> FAILED' );
         else throw Error(description + ' >> Error expected but never thrown' );
      }

      function passIt() {
         if (expectThrow) throw Error(target + ' >> Error expected but never thrown');
         console.log(description + ' >> ok');
      }

      try {
         if (cond && !scenarioFailed) {
            passIt();
            return codeGreen();
         }
      } catch (err) {
         if (expectThrow) {
            passIt();
            return codeGreen();
         }
      }
      codeRed();
      //if (dontThrow) debugger;
      //else 
      throwIt();
   };

   scope.fail = function (cond, text) {
      expect(cond, text);
      scenarioFailed = true;
      window.bucket.allPassed = true;
   }

   scope.expectErr = function (cond, text) {
      expect(cond, text, false, true);
   };

   scope.bucket = {allPassed: true};

   scope.Testshit = function (innerScope) {
      this.currentScope = {};
      innerScope.bind(this.__proto__);
      this.userSpec = function(){         
         innerScope.apply(this.__proto__);
      } ;
   };

   scope.spec = function (name, func) {
      try {
         setStatus();
         scope.bucket[name] = new Testshit(func);
      } catch (x) {
         codeRed();
      }
   }

   scope.Testshit.prototype.run = function () {
      this.userSpec.apply(this);
   };

   scope.Testshit.prototype.it = scope.Testshit.prototype.should = function (name, thenScope) {
      var prevScope = this.currentScope;
      if (!scenarioFailed) this.currentScope = thenScope.apply(this.currentScope, [name]) || prevScope;      
      return this;
   };

   scope.Testshit.prototype.when = scope.Testshit.prototype.that = function (name, givenScope) {
      console.debug('When ' + name);
      scenarioFailed = false;
      this.currentScope = givenScope.apply({});
      return this;
   }

   scope.Testshit.digest = digest = function () {
      for (var item in scope.bucket) {
         var test = scope.bucket[item];
         if (test && test instanceof Testshit) {
            runSpec(test, item);
         }
      }
   }

   digest.bind(this);

   scope.setInterval(digest, 1000 * INTERVAL_SECS);

   console.group('Testshit running');

}();

// dog food
specsIn('specShit');