angular.module("App", ["ng"]).
  factory("calcTest", function(){
    var onlyPositive = function(i){ return _.max([i, 0]); };

    return function(seekChar, oldText, newText){
      console.log(arguments);
      var r = new RegExp(seekChar, "g"),
          oldSeekCount = oldText.match(r) ? oldText.match(r).length : 0,
          newSeekCount = newText.match(r) ? newText.match(r).length : 0,
          correctDeleted = oldSeekCount - newSeekCount,
          oldTotalCount = oldText.length,
          newTotalCount = newText.length,
          incorrectCount = onlyPositive(oldTotalCount - correctDeleted * seekChar.length - newTotalCount),
          K = (oldSeekCount - (newSeekCount + incorrectCount))/oldSeekCount,
          I = K * oldTotalCount;

      return {
        a: oldSeekCount,
        b: newSeekCount,
        c: incorrectCount,
        d: oldTotalCount,
        K: K,
        I: I
      };
    };
  }).
  directive("noise", function(){
    var startNoiseAnimation = function(element) {
      function loop(){
        var x = "" + (Math.floor(Math.random() * 90) + 2) + '%',
            y = "" + (Math.floor(Math.random() * 90) + 2) + '%';

        return element.animate({ left: x, top: y }, "fast" , loop);
      }

      return loop();
    };

    return {
      restrict: "A",
      link: function(scope, element, attr) {
        element.addClass("noise");
        startNoiseAnimation(element);
      }
    };
  }).
  directive("focusable", function(){
    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        scope.$watch(attrs.focusable, function(newValue){
          if (newValue){
            element.focus();
          } else {
            element.blur();
          }
        });
      }
    };
  }).
  controller("AppController", function($scope, $http, $timeout, calcTest){
    var copy = angular.copy;

    $scope.isDisabled = true;
    $scope.iteration  = 0;
    $scope.seconds    = 30;
    $scope.time       = $scope.seconds;
    $scope.timer      = null;
    $scope.saved      = null;
    $scope.results    = [];
    $scope.seekChar   = "о";
    $scope.started    = false;

    $scope.noiseEnabled = function(){
      return ($scope.iteration >= 20) && ($scope.iteration <= 25);
    };

    $scope.$watch("seconds", function(){
      $scope.syncTime();
    });

    $scope.syncTime = function(){
      $scope.time = $scope.seconds;
    };

    $scope.loadDefaultText = function(){
      $http.get("text.txt").then(function(result){
        $scope.userText = $.trim(result.data);
      });
    };

    $scope.start = function(){
      $scope.started = true;
    };


    $scope.startIteration = function(){
      console.log("start");
      $scope.isDisabled = false;
      $scope.saveData();
      $scope.tick();
    };

    $scope.stopIteration = function(){
      console.log("stop");
      if($scope.timer) $timeout.cancel($scope.timer);
      $scope.isDisabled = true;
      $scope.syncTime();
      $scope.trackResults();
      $scope.restoreData();
      $scope.iteration++;
    };

    $scope.ended = function(){
      return $scope.iteration == 38;
    };

    $scope.reset = function(){
      $scope.iteration = 0;
    };

    $scope.tick = function(){
      $scope.time--;
      if($scope.time === 0){
        $scope.timer = null;
        $scope.stopIteration();
      } else {
        $scope.timer = $timeout($scope.tick, 1000);
      }
    };

    $scope.saveData = function(){
      console.log("saving, dude");
      $scope.saved = copy( $scope.userText );
    };

    $scope.trackResults = function(){
      console.log("okay");
      var resObj = calcTest($scope.seekChar, $scope.saved, $scope.userText);
      resObj.iteration = $scope.iteration;
      resObj.seekChar = $scope.seekChar;
      resObj.className = $scope.className();

      $scope.results.push(resObj);
    };

    $scope.restoreData = function(){
      $scope.userText = $scope.saved;
    };

    $scope.classModificator = function(){
      return ($scope.iteration >= 26) && ($scope.iteration <= 29);
    };

    function itClass(i){
      return "iteration-" + (i + 1);
    }

    var slicesLength = [ 20, 6, 4, 8 ];

    function minR(items){
      return _.min(items, function(item){
        return item.K;
      });
    }
    function maxR(items){
      return _.max(items, function(item){
        return item.K;
      });
    }

    function extForSlice(n){
      var prev, current, starts = _.reduce(slicesLength, function(memo, count){
          memo[0].push(memo[1]);
          memo[1] += count;
          return memo;
        }, [[], 0])[0],
        extr = function(results){
          return [ minR(results), maxR(results) ];
        },
        slicedR = function(i){
          return $scope.results.slice( starts[i], starts[i] + slicesLength[ i ]);
        };

      return extr( slicedR(n) );
      // if(n === 0) {
      // } else {
      //   prev = slicedR(n-1);
      //   return extr( prev );
      // }
    }

    $scope.testRun = function(){
      _.defer(function(){
        $scope.$apply(function(){
          _(38).times(function(t){
            $scope.startIteration();
            $scope.stopIteration();
          });
        });
      });
    };

    function itKClass(n, i, modifier){
      var r = extForSlice(n)[ i % 2 ].className;
      if(_.isFunction(modifier)) r += " " + modifier(i);
      return r;
    }

    function sizeModifier(i){
      var s = ["8", "10", "12"][ i%3 ];
      return "size-" + s;
    }

    function ssModifier(i){
      var s = ["8", "12"][ i%2 ];
      return "size-" + s;
    }

    function fontModifier(i){
      var f = ["times", "arial", "courrier", "comit"][ i%4 ];
      return "font-" + f;
    }

    $scope.className = function(){
      var i = $scope.iteration;
      if (i <= 19) return itClass(i);
      if (i <= 25) return itKClass(0, i, sizeModifier);
      if (i <= 29) return itKClass(1, i, ssModifier);
      if (i <= 37) return itKClass(2, i, fontModifier);
      return "";
    };
  });