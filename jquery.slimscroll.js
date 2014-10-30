/*! Copyright (c) 2011 Piotr Rochala (http://rocha.la)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Original Version: 1.3.3
 * 
 * Version: 1.1.0
 *
 * Modified by Milano
 *
 */
(function ($) {

    $.fn.extend({
        slimScroll: function (options) {

            var defaults = {

                // width in pixels of the visible scroll area
                width: 'auto',

                // height in pixels of the visible scroll area
                height: '250px',

                // width in pixels of the scrollbar and rail
                size: '7px',

                // width in pixels of the scrollbar rail, set this value greater than scrollbar size will enable animation effect
                railSize: '10px',

                // scrollbar color, accepts any hex/color value
                color: '#000',

                // scrollbar position - left/right
                position: 'right',

                // distance in pixels between the side edge and the scrollbar
                distance: '1px',

                // default scroll position on load - top / bottom / $('selector')
                start: 'top',

                // sets scrollbar opacity
                opacity: .4,

                // enables always-on mode for the scrollbar
                //alwaysVisible : false,

                // check if we should hide the scrollbar when user is hovering over
                //disableFadeOut : false,

                // sets visibility of the rail
                //railVisible : false,

                // sets rail color
                railColor: '#000',

                // sets rail opacity
                railOpacity: .15,

                // whether  we should use jQuery UI Draggable to enable bar dragging
                railDraggable: true,

                // defautlt CSS class of the slimscroll rail
                railClass: 'slimScrollRail',

                // defautlt CSS class of the slimscroll bar
                barClass: 'slimScrollBar',

                // defautlt CSS class of the slimscroll wrapper
                wrapperClass: 'slimScrollDiv',

                // check if mousewheel should scroll the window if we reach top/bottom
                allowPageScroll: false,

                // scroll amount applied to each mouse wheel step
                wheelStep: 20,

                // scroll amount applied when user is using gestures
                touchScrollStep: 200,

                // sets border radius
                //borderRadius: '7px',

                // sets border radius of the rail
                //railBorderRadius : '7px'
            };

            var o = $.extend(defaults, options);

            // do it for every element that matches selector
            this.each(function () {

                var isOverPanel, isOverBar, isDragg, queueHide, touchDif,
                    barHeight, percentScroll, lastScroll,
                    divS = '<div></div>',
                    minBarHeight = 30,
                    releaseScroll = false;

                //css class
                var barClass = '.' + o.barClass,
                    barClassHover = barClass + ':hover',
                    railClass = '.' + o.railClass,
                    railClassHover = railClass + ':hover',
                    railClassOver = 'railClassOver';

                // used in event handlers and for better minification
                var me = $(this);

                // ensure we are not binding it again
                if (me.parent().hasClass(o.wrapperClass)) {
                    // start from last bar position
                    var offset = me.scrollTop();

                    // find bar and rail
                    bar = me.parent().find(barClass);
                    rail = me.parent().find(railClass);

                    getBarHeight();

                    // check if we should scroll existing instance
                    if ($.isPlainObject(options)) {
                        // Pass height: auto to an existing slimscroll object to force a resize after contents have changed
                        if ('height' in options && options.height == 'auto') {
                            me.parent().css('height', 'auto');
                            me.css('height', 'auto');
                            var height = me.parent().parent().height();
                            me.parent().css('height', height);
                            me.css('height', height);
                        }

                        if ('scrollTo' in options) {
                            // jump to a static point
                            offset = parseInt(o.scrollTo);
                        } else if ('scrollBy' in options) {
                            // jump by value pixels
                            offset += parseInt(o.scrollBy);
                        } else if ('destroy' in options) {
                            // remove slimscroll elements
                            bar.remove();
                            rail.remove();
                            me.unwrap();
                            return;
                        }

                        // scroll content by the given offset
                        scrollContent(offset, false, true);
                    }

                    return;
                }

                // optionally set height to the parent's height
                o.height = (o.height == 'auto') ? me.parent().height() : o.height;

                // wrap content
                var wrapper = $(divS)
                    .addClass(o.wrapperClass)
                    .css({
                        position: 'relative',
                        overflow: 'hidden',
                        width: o.width,
                        height: o.height
                    });

                // update style for the div
                me.css({
                    overflow: 'hidden',
                    width: o.width,
                    height: o.height
                });

                // common css
                addCss(railClass + ', ' + barClass + ' {position: absolute; top: 0;cursor: pointer;transition: width 250ms;-webkit-transition: width 250ms;-moz-transition: width 250ms;-o-transition: width 250ms;}');
                addCss(barClassHover + ', ' + barClass + '.slimScrollHover, ' + railClassHover + ' ' + barClass + ' {width: ' + o.railSize + ';opacity: 1}');
                addCss(railClass + ' {width: ' + o.railSize + ';height: 100%;z-index: 90;}');
                addCss(barClass + ' {width: ' + o.size + ';z-index: 99;}');
                addCss('.' + railClassOver + ' {opacity: 1;background: ' + getColor(o.railColor, o.railOpacity) + '}');

                // create scrollbar rail
                var rail = $(divS)
                    .addClass(o.railClass)
                    .css({
                        /*width: o.railSize,
                        //height: '100%',
                        //position: 'absolute',
                        //top: 0,
                        display: (o.alwaysVisible && o.railVisible) ? 'block' : 'none', */
                        'border-radius': o.railSize,
                        BorderRadius: o.railSize,
                        MozBorderRadius: o.railSize,
                        WebkitBorderRadius: o.railSize,
                        /*background: getColor(o.railColor, o.railOpacity),//o.railColor,
                        //opacity: (o.alwaysVisible || o.railVisible) ? 1 : 0,//o.railOpacity,
                        //zIndex: 90*/
                    });

                // create scrollbar
                var bar = $(divS)
                    .addClass(o.barClass)
                    .css({
                        background: getColor(o.color, o.opacity), //o.color,
                        /*width: o.size,
                        //position: 'absolute',
                        //top: 0,
                        //opacity: o.alwaysVisible ? 1 : 0,//o.opacity,
                        //display: o.alwaysVisible ? 'block' : 'none', */
                        'border-radius': o.size,
                        BorderRadius: o.size,
                        MozBorderRadius: o.size,
                        WebkitBorderRadius: o.size,
                        //zIndex: 99
                    });

                // set position
                var posCss = (o.position == 'right') ? {
                    right: o.distance
                } : {
                    left: o.distance
                };
                rail.css(posCss);
                //bar.css(posCss);
                bar.css((o.position == 'right') ? {right: 0} : {left: 0});

                // wrap it
                me.wrap(wrapper);

                // append to parent div
                //me.parent().append(bar);
                me.parent().append(rail);
                rail.append(bar);

                hideBar();

                // make it draggable and no longer dependent on the jqueryUI
                if (o.railDraggable) {
                    bar.bind("mousedown", function (e) {
                        var $doc = $(document);
                        isDragg = true;
                        t = parseFloat(bar.css('top'));
                        pageY = e.pageY;

                        $doc.bind("mousemove.slimscroll", function (e) {
                            currTop = t + e.pageY - pageY;
                            bar.css('top', currTop);
                            scrollContent(0, bar.position().top, false); // scroll content
                        });

                        $doc.bind("mouseup.slimscroll", function (e) {
                            isDragg = false;
                            hideBar();
                            $doc.unbind('.slimscroll');
                        });
                        return false;
                    }).bind("selectstart.slimscroll", function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });

                    // click on rail to scroll content
                    rail.bind('click', function (e) {

                        if (bar.is(":hover")) {
                            return;
                        }

                        var offset = $(this).offset(),
                            pageY = e.pageY - offset.top,
                            t = parseFloat(bar.css('top'));

                        if (pageY < t) {
                            currTop = t - bar.height();
                        } else {
                            currTop = t + bar.height();
                        }

                        bar.animate({'top': currTop}, 'fast', function() {
                            scrollContent(0, bar.position().top, false); // scroll content
                        });
                    });
                }

                // on rail over
                rail.hover(function () {
                    isOverBar = true;
                    showBar();
                    rail.stop(true, true).addClass(railClassOver);
                }, function () {
                    if (!isDragg) {
                        isOverBar = false;
                        hideBar();
                        rail.stop(true, true).removeClass(railClassOver);
                    }
                });

                // on bar over
                bar.hover(function () {
                    isOverBar = true;
                    //rail.stop(true,true).animate({opacity: 1}, 'fast');
                }, function () {
                    isOverBar = false;
                    //rail.animate({opacity: 0}, 'slow');
                });

                // show on parent mouseover
                me.hover(function () {                    
                    isOverPanel = true;
                    showBar();
                    hideBar();
                }, function () {
                    isOverPanel = false;
                    hideBar();
                }).on('mousemove', function (e) {
                    if (isNear(rail, 20, e)) {
                        isOverBar = true;
                        showBar();
                    } else {
                        isOverBar = false;
                        hideBar();
                    };
                });

                // support for mobile
                me.bind('touchstart', function (e, b) {
                    if (e.originalEvent.touches.length) {
                        // record where touch started
                        touchDif = e.originalEvent.touches[0].pageY;
                    }
                });

                me.bind('touchmove', function (e) {
                    // prevent scrolling the page if necessary
                    if (!releaseScroll) {
                        e.originalEvent.preventDefault();
                    }
                    if (e.originalEvent.touches.length) {
                        // see how far user swiped
                        var diff = (touchDif - e.originalEvent.touches[0].pageY) / o.touchScrollStep;
                        // scroll content
                        scrollContent(diff, true);
                        touchDif = e.originalEvent.touches[0].pageY;
                    }
                });

                // set up initial height
                getBarHeight();

                // check start position
                if (o.start === 'bottom') {
                    // scroll content to bottom
                    bar.css({
                        top: me.outerHeight() - bar.outerHeight()
                    });
                    scrollContent(0, true);
                } else if (o.start !== 'top') {
                    // assume jQuery selector
                    scrollContent($(o.start).position().top, null, true);

                    // make sure bar stays hidden
                    // if (!o.alwaysVisible) {
                        bar.hide();
                    // }
                }

                // attach scroll events
                attachWheel();

                function _onWheel(e) {
                    // use mouse wheel only when mouse is over
                    // if (!isOverPanel) {
                    //     return;
                    // }

                    var e = e || window.event;

                    var delta = 0;
                    if (e.wheelDelta) {
                        delta = -e.wheelDelta / 120;
                    }
                    if (e.detail) {
                        delta = e.detail / 3;
                    }

                    var target = e.target || e.srcTarget || e.srcElement;
                    if ($(target).closest('.' + o.wrapperClass).is(me.parent())) {
                        // scroll content
                        scrollContent(delta, true);
                    }

                    // stop window scroll
                    if (e.preventDefault && !releaseScroll) {
                        e.preventDefault();
                    }
                    if (!releaseScroll) {
                        e.returnValue = false;
                    }
                }

                function scrollContent(y, isWheel, isJump) {
                    releaseScroll = false;
                    var delta = y;
                    var maxTop = me.outerHeight() - bar.outerHeight();

                    if (isWheel) {
                        // move bar with mouse wheel
                        delta = parseInt(bar.css('top')) + y * parseInt(o.wheelStep) / 100 * bar.outerHeight();

                        // move bar, make sure it doesn't go out
                        delta = Math.min(Math.max(delta, 0), maxTop);

                        // if scrolling down, make sure a fractional change to the
                        // scroll position isn't rounded away when the scrollbar's CSS is set
                        // this flooring of delta would happened automatically when
                        // bar.css is set below, but we floor here for clarity
                        delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);

                        // scroll the scrollbar
                        bar.css({
                            top: delta + 'px'
                        });
                    }

                    // calculate actual scroll amount
                    percentScroll = parseInt(bar.css('top')) / (me.outerHeight() - bar.outerHeight());
                    delta = percentScroll * (me[0].scrollHeight - me.outerHeight());

                    if (isJump) {
                        delta = y;
                        var offsetTop = delta / me[0].scrollHeight * me.outerHeight();
                        offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
                        bar.css({
                            top: offsetTop + 'px'
                        });
                    }

                    // scroll content
                    me.scrollTop(delta);

                    // fire scrolling event
                    me.trigger('slimscrolling', ~~delta);

                    // ensure bar is visible
                    showBar();

                    // trigger hide when scroll is stopped
                    hideBar();
                }

                function attachWheel() {
                    if (window.addEventListener) {
                        this.addEventListener('DOMMouseScroll', _onWheel, false);
                        this.addEventListener('mousewheel', _onWheel, false);
                    } else {
                        document.attachEvent("onmousewheel", _onWheel)
                    }
                }

                function getBarHeight() {
                    // calculate scrollbar height and make sure it is not too small
                    barHeight = Math.max((me.outerHeight() / me[0].scrollHeight) * me.outerHeight(), minBarHeight);
                    bar.css({
                        height: barHeight + 'px'
                    });

                    // hide scrollbar if content is not long enough
                    /*var display = barHeight == me.outerHeight() ? 'none' : 'block';
                    bar.css({ display: display });*/
                    var opacity = barHeight == me.outerHeight() ? 0 : 1;
                    bar.css({opacity: opacity});
                }

                function showBar(fakeScroll) {
                    // recalculate bar height
                    getBarHeight();
                    clearTimeout(queueHide);

                    // when bar reached top or bottom
                    if (percentScroll == ~~percentScroll) {
                        //release wheel
                        releaseScroll = o.allowPageScroll;

                        // publish approporiate event
                        if (lastScroll != percentScroll) {
                            var msg = (~~percentScroll == 0) ? 'top' : 'bottom';
                            me.trigger('slimscroll', msg);
                        }
                    } else {
                        releaseScroll = false;
                    }
                    lastScroll = percentScroll;

                    // show only when required
                    if (barHeight >= me.outerHeight()) {
                        //allow window scroll
                        releaseScroll = true;
                        return;
                    }
                    /*bar.stop(true,true).animate({opacity: 1}, 'fast').addClass('slimScrollHover');//.fadeIn('fast')
                    if (o.railVisible) { rail.stop(true,true).animate({opacity: 1}, 'fast').addClass('slimScrollHover');/*fadeIn('fast') }*/
                    if (isDragg) {
                        bar.addClass('slimScrollHover');
                    }

                    rail.stop(true, true).animate({
                        visibility: 'visible',
                        opacity: 1
                    }, 'slow');
                }

                function hideBar() {
                    // only hide when options allow it
                    // if (!o.alwaysVisible) {
                        queueHide = setTimeout(function () {
                            if (/*!(o.disableFadeOut && isOverPanel) && */!isOverBar && !isDragg) {
                                //bar.fadeOut('slow').removeClass('slimScrollHover');
                                //rail.fadeOut('slow').removeClass('slimScrollHover');
                                //bar.animate({opacity: 0}, 'slow').removeClass('slimScrollHover');
                                bar.removeClass('slimScrollHover');
                                rail.animate({
                                    visibility: 'hidden',
                                    opacity: 0
                                }, 500).removeClass(railClassOver);
                            }
                        }, 800);
                    // }
                }

                function addCss(css) {
                    var head = document.getElementsByTagName('head')[0];
                    var s = document.createElement('style');
                    s.setAttribute('type', 'text/css');
                    if (s.styleSheet) { // IE
                        s.styleSheet.cssText = css;
                    } else { // the world
                        s.appendChild(document.createTextNode(css));
                    }
                    head.appendChild(s);
                }

                function hexToRgb(hex) {
                    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                        return r + r + g + g + b + b;
                    });

                    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                    } : null;
                }

                function getColor(color, opacity) {
                    var rgb = hexToRgb(color);
                    return rgb ? 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + opacity + ')' : color.replace('rgb', 'rgba').replace(')', ', ' + opacity + ')');
                }

                function isNear( element, distance, event ) {

                    var left = element.offset().left - distance,
                        top = element.offset().top - distance,
                        right = left + element.width() + 2*distance,
                        bottom = top + element.height() + 2*distance,
                        x = event.pageX,
                        y = event.pageY;

                    return ( x > left && x < right && y > top && y < bottom );

                };

            });

            // maintain chainability
            return this;
        }
    });

    $.fn.extend({
        slimscroll: $.fn.slimScroll
    });

})(jQuery);