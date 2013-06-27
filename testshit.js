// Dirty POC of browser based continuous testing 
// (C) 2013 Johan O
// SWL - Standard Whatever Licence 

// Best used with TINCR extension http://tin.cr/
// <script async data-test="App" data-suffix=".spec" src="testshit.js"></script>

// TODO: convert from hack to a scoped app, print timings, use CSS to format console

if (!console.group) console.group = console.groupEnd = function(t){ console.log(t)};

window.onerror = function(){
   codeRed();
}

window.specsIn = function (specName) {
   // require a spec file for a module
   if (window.bucket[specName]) return;
   requireSpec(specName);
}

function requireSpec(contextName, alreadyExistsFunc) {
   if (alreadyExistsFunc && alreadyExistsFunc() !== false) return void 0;
   var s = document.createElement("script");
   s.type = "text/javascript";
   s.async = true;
   s.setAttribute("data-spec", contextName);
   s.src = 'specs/' + contextName + (Testshit.SpecSuffix || '.spec') + '.js?t=' + new Date().getTime();
   (document.body || document.head).appendChild(s);
   s.onload = Testshit.digest;
   return s;
}

function removeShortcutIcons() {
   var linkTags = document.getElementsByTagName('link');
   for(var i = linkTags.length-1; i >= 0; i--) {
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
   linkTag.setAttribute('href', 'http://cdn.dustball.com/' + (window.bucket.allPassed && !window.error ? 'accept' : 'exclamation') + '.png');
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

!function () { 'use strict';

   var digest,
      knownshit = [],
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

   function isFuncNative(c) {
      return !scope.Testshit.AppRoot && !c.startsWith('webkit') && (  typeof scope[c] !== "function" || scope[c].toString().indexOf('[native code]') > -1 )
   }

   function tryLoadAll() {
      for( var c in scope.Testshit.AppRoot || scope ){
         if ( !isFuncNative(c) ){
             specsIn(c);
         }
      }
   }

   setTimeout(tryLoadAll,1500);

   digest.bind(this);

   scope.setInterval(digest, 1000 * INTERVAL_SECS);

   var config = { test:   document.querySelectorAll("script[data-test]"),
                  suffix: document.querySelectorAll("script[data-suffix]")};

   if(config.test.length)  scope.Testshit.AppRoot = scope[ config.test[0].getAttribute("data-test") ];

   if(config.suffix.length)  scope.Testshit.SpecSuffix = config.suffix[0].getAttribute("data-suffix");

}();
