'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));
var React = require('react');

var isBrowser = typeof document !== "undefined";

// React currently throws a warning when using useLayoutEffect on the server.
var useIsomorphicLayoutEffect =  isBrowser ? React.useLayoutEffect : React.useEffect;

function reducer() {
  return true;
}

function LazyHydrate(props) {
  var childRef = React.useRef(null); // Always render on server

  var _React$useReducer = React.useReducer(reducer, !( isBrowser)),
      hydrated = _React$useReducer[0],
      hydrate = _React$useReducer[1];

  var noWrapper = props.noWrapper,
      ssrOnly = props.ssrOnly,
      whenIdle = props.whenIdle,
      whenVisible = props.whenVisible,
      promise = props.promise,
      _props$on = props.on,
      on = _props$on === void 0 ? [] : _props$on,
      whenScroll = props.whenScroll,
      children = props.children,
      didHydrate = props.didHydrate,
      rest = _objectWithoutPropertiesLoose(props, ["noWrapper", "ssrOnly", "whenIdle", "whenVisible", "promise", "on", "whenScroll", "children", "didHydrate"]);

  if ('production' !== process.env.NODE_ENV && !ssrOnly && !whenIdle && !whenVisible && !on.length && !promise && !whenScroll) {
    console.error("LazyHydration: Enable atleast one trigger for hydration.\n" + "If you don't want to hydrate, use ssrOnly");
  }

  useIsomorphicLayoutEffect(function () {
    // No SSR Content
    if (!childRef.current.hasChildNodes()) {
      hydrate();
    }
  }, []);
  React.useEffect(function () {
    if (hydrated && didHydrate) {
      didHydrate();
    } // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [hydrated]);
  React.useEffect(function () {
    if (ssrOnly || hydrated) return;
    var rootElement = childRef.current;
    var cleanupFns = [];

    function cleanup() {
      cleanupFns.forEach(function (fn) {
        fn();
      });
    }

    if (promise) {
      promise.then(hydrate, hydrate);
    }

    if (whenVisible) {
      var element = noWrapper ? rootElement : // As root node does not have any box model, it cannot intersect.
      rootElement.firstElementChild;

      if (element && typeof IntersectionObserver !== "undefined") {
        var observerOptions = typeof whenVisible === "object" ? whenVisible : {
          rootMargin: "250px"
        };
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              hydrate();
            }
          });
        }, observerOptions);
        io.observe(element);
        cleanupFns.push(function () {
          io.disconnect();
        });
      } else {
        return hydrate();
      }
    }

    if (whenIdle) {
      // @ts-ignore
      if (typeof requestIdleCallback !== "undefined") {
        // @ts-ignore
        var idleCallbackId = requestIdleCallback(hydrate, {
          timeout: 500
        });
        cleanupFns.push(function () {
          // @ts-ignore
          cancelIdleCallback(idleCallbackId);
        });
      } else {
        var id = setTimeout(hydrate, 2000);
        cleanupFns.push(function () {
          clearTimeout(id);
        });
      }
    }

    if (whenScroll) {
      document.addEventListener('scroll', hydrate, {
        once: true,
        passive: true
      });
    }

    var events = [].concat(on);
    events.forEach(function (event) {
      rootElement.addEventListener(event, hydrate, {
        once: true,
        passive: true
      });
      cleanupFns.push(function () {
        rootElement.removeEventListener(event, hydrate, {});
      });
    });
    return cleanup;
  }, [hydrated, on, ssrOnly, whenIdle, whenVisible, didHydrate, promise, noWrapper]);
  var WrapperElement = typeof noWrapper === "string" ? noWrapper : "div";

  if (hydrated) {
    if (noWrapper) {
      return children;
    }

    return /*#__PURE__*/React.createElement(WrapperElement, _extends({
      ref: childRef,
      style: {
        display: "contents"
      }
    }, rest), children);
  } else {
    return /*#__PURE__*/React.createElement(WrapperElement, _extends({}, rest, {
      ref: childRef,
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: {
        __html: ""
      }
    }));
  }
}

exports.default = LazyHydrate;
