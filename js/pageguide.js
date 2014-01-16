/*
 * Tracelytics PageGuide
 *
 * Copyright 2013 Tracelytics
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Contributing Author: Tracelytics Team
 */

/*
 * PageGuide usage:
 *
 *  Preferences:
 *  auto_show_first:    Whether or not to focus on the first visible item
 *                      immediately on PG open (default true)
 *  loading_selector:   The CSS selector for the loading element. pageguide
 *                      will wait until this element is no longer visible
 *                      starting up.
 *  track_events_cb:    Optional callback for tracking user interactions
 *                      with pageguide.  Should be a method taking a single
 *                      parameter indicating the name of the interaction.
 *                      (default none)
 *  handle_doc_switch:  Optional callback to enlight or adapt interface
 *                      depending on current documented element. Should be a
 *                      function taking 2 parameters, current and previous
 *                      data-tourtarget selectors. (default null)
 *  custom_open_button: Optional id for toggling pageguide. Default null.
 *                      If not specified then the default button is used.
 *  pg_caption:         Optional - Sets the visible caption
 *  dismiss_welcome:    Optional function to permanently dismiss the welcome
 *                      message, corresponding to check_welcome_dismissed.
 *                      Default: sets a localStorage or cookie value for the
 *                      (hashed) current URL to indicate the welcome message
 *                      has been dismissed, corresponds to default
 *                      check_welcome_dismissed function.
 *  check_welcome_dismissed: Optional function to check whether or not the
 *                      welcome message has been dismissed. Must return true
 *                      or false. This function should check against whatever
 *                      state change is made in dismiss_welcome. Default:
 *                      checks whether a localStorage or cookie value has been
 *                      set for the (hashed) current URL, corresponds to default
 *                      dismiss_welcome function.
 */
tl = window.tl || {};
tl.pg = tl.pg || {};

(function ($) {
    /**
     * default preferences. can be overridden by user settings passed into
     * tl.pg.init().
     **/
    tl.pg.default_prefs = {
        'auto_show_first': true,
        'loading_selector' : '#loading',
        'track_events_cb': function() { return; },
        'handle_doc_switch': null,
        'custom_open_button': null,
        'pg_caption' : 'page guide',
        'tourtitle': 'Open Page Guide for help',
        'check_welcome_dismissed': function () {
            var key = 'tlypageguide_welcome_shown_' + tl.pg.hashUrl();
            // first, try to use localStorage
            try {
                if (localStorage.getItem(key)) {
                    return true;
                }
            // cookie fallback for older browsers
            } catch(e) {
                if (document.cookie.indexOf(key) > -1) {
                    return true;
                }
            }
            return false;
        },
        'dismiss_welcome': function () {
            var key = 'tlypageguide_welcome_shown_' + tl.pg.hashUrl();
            try {
                localStorage.setItem(key, true);
            } catch(e) {
                var exp = new Date();
                exp.setDate(exp.getDate() + 365);
                document.cookie = (key + '=true; expires=' + exp.toUTCString());
            }
        },
        'ready_callback': null
    };

    // boilerplate markup for the message display element and shadow/index bubble container.
    tl.pg.wrapper_markup =
        '<div id="tlyPageGuideWrapper">' +
            '<div id="tlyPageGuideMessages">' +
                '<a href="#" class="tlypageguide_close" title="Close Guide">close</a>' +
                '<span class="tlypageguide_index"></span>' +
                '<div class="tlypageguide_text"></div>' +
                '<a href="#" class="tlypageguide_back" title="Previous">Previous</a>' +
                '<a href="#" class="tlypageguide_fwd" title="Next">Next</a>' +
            '</div>' +
            '<div id="tlyPageGuideContent"></div>' +
        '</div>';

    // boilerplate markup for the toggle element.
    tl.pg.toggle_markup =
        '<div class="tlypageguide_toggle" title="Launch Page Guide">' +
            '<div><span class="tlypageguide_toggletitle"></span></div>' +
            '<a href="#" class="tlypageguide_close" title="close guide">close guide &raquo;</a>' +
        '</div>';

    /**
     * initiates the pageguide using the given preferences. must be idempotent, that is,
     * able to run multiple times without changing state.
     * preferences (object): any preferences the user wishes to override.
     **/
    tl.pg.init = function(preferences) {
        preferences = $.extend({}, tl.pg.default_prefs, preferences);
        clearInterval(tl.pg.interval);

        /* page guide object, for pages that have one */
        if ($("#tlyPageGuide").length === 0) {
            return;
        }

        var $guide = $("#tlyPageGuide");
        var $wrapper = $(tl.pg.wrapper_markup);

        var tourtitle = $guide.data('tourtitle') || preferences.tourtitle;

        if (preferences.custom_open_button == null && $('.tlypageguide_toggle').length < 1) {
            $wrapper.append(tl.pg.toggle_markup);
            $wrapper.find('.tlypageguide_toggle').prepend(preferences.pg_caption);
            $wrapper.find('.tlypageguide_toggletitle').text(tourtitle);
        }

        $wrapper.prepend($guide);

        // remove any stale pageguides
        $('#tlyPageGuideWrapper').remove();

        $('body').prepend($wrapper);

        var pg = new tl.pg.PageGuide($('#tlyPageGuideWrapper'), preferences);

        pg.ready(function() {
            pg.setup_welcome();
            pg.setup_handlers();
            pg.$base.children(".tlypageguide_toggle").animate({ "right": "-120px" }, 250);
            if (typeof(preferences.ready_callback) === 'function') {
                preferences.ready_callback();
            }
        });
        return pg;
    };

    /**
     * constructor for the base PageGuide object. contains: relevant elements,
     * user-defined preferences, and state information. all of this data is public.
     * pg_elem (jQuery element): the base wrapper element which contains all the pg
     *     elements
     * preferences (object): combined user-defined and default preferences.
     **/
    tl.pg.PageGuide = function (pg_elem, preferences) {
        this.preferences = preferences;
        this.$base = pg_elem;
        this.$message = this.$base.find('#tlyPageGuideMessages');
        this.$fwd = this.$base.find('a.tlypageguide_fwd');
        this.$back = this.$base.find('a.tlypageguide_back');
        this.$content = this.$base.find('#tlyPageGuideContent')
        this.$welcome = $('#tlyPageGuideWelcome');
        this.cur_idx = 0;
        this.cur_selector = null;
        this.track_event = this.preferences.track_events_cb;
        this.handle_doc_switch = this.preferences.handle_doc_switch;
        this.custom_open_button = this.preferences.custom_open_button;
        this.is_open = false;
        this.targetData = {};
        this.hashTable = {};
        this.changeQueue = [];
        this.visibleTargets = [];
    };

    /**
     * hash the current page's url. used in the default check_welcome_dismissed
     * and dismiss_welcome functions
     **/
    tl.pg.hashUrl = function () {
        return tl.pg.hashCode(window.location.href);
    };

    /**
     * generate a random numeric hash for a given string. originally from:
     * http://stackoverflow.com/a/7616484/1135244
     * str (string): the string to be hashed
     **/
    tl.pg.hashCode = function (str) {
        var hash = 0, i, char;
        if (str == null || str.length === 0) {
            return hash;
        }
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash;
        }
        return hash.toString();
    };

    /**
     * check whether the element targeted by the given selector is within the
     * currently scrolled viewport.
     * elem (string): selector for the element in question
     **/
    tl.pg.isScrolledIntoView = function(elem) {
        var dvtop = $(window).scrollTop(),
            dvbtm = dvtop + $(window).height(),
            eltop = $(elem).offset().top,
            elbtm = eltop + $(elem).height();

        return (elbtm >= dvtop) && (eltop <= dvbtm - 100);
    };

    /**
     * remove all traces of pageguide from the DOM.
     **/
    tl.pg.destroy = function () {
        $('#tlyPageGuideWrapper').remove();
        $('#tlyPageGuideOverlay').remove();
        $('body').removeClass('tlypageguide-open');
        $('body').removeClass('tlyPageGuideWelcomeOpen');
    };

    /**
     * check for a welcome message. if it exists, determine whether or not to show it,
     * using self.preferences.check_welcome_dismissed. then, bind relevant handlers to
     * the buttons included in the welcome message element.
     **/
    tl.pg.PageGuide.prototype.setup_welcome = function () {
        var $welcome = $('#tlyPageGuideWelcome');
        var self = this;
        if ($welcome.length > 0) {
            self.preferences.show_welcome = !self.preferences.check_welcome_dismissed();
            if (self.preferences.show_welcome) {
                if (!$('#tlyPageGuideOverlay').length) {
                    $('body').prepend('<div id="tlyPageGuideOverlay"></div>');
                }
                $welcome.appendTo(self.$base);
            }

            if ($welcome.find('.tlypageguide_ignore').length) {
                $welcome.on('click', '.tlypageguide_ignore', function () {
                    self.close_welcome();
                    self.track_event('PG.ignoreWelcome');
                });
            }
            if ($welcome.find('.tlypageguide_dismiss').length) {
                $welcome.on('click', '.tlypageguide_dismiss', function () {
                    self.close_welcome();
                    self.preferences.dismiss_welcome();
                    self.track_event('PG.dismissWelcome');
                });
            }
            $welcome.on('click', '.tlypageguide_start', function () {
                self.open();
                self.track_event('PG.startFromWelcome');
            });

            if (self.preferences.show_welcome) {
                self.pop_welcome();
            }
        }
    };

    /**
     * timer function. will poll the DOM at 250ms intervals until the user-defined
     * self.preferences.loading_selector becomes visible, at which point it will
     * execute the given callback. useful in cases where the DOM elements pageguide
     * depends on are loaded asynchronously.
     * callback (function): executes when loading selector is visible
     **/
    tl.pg.PageGuide.prototype.ready = function(callback) {
        var self = this;
        tl.pg.interval = window.setInterval(function() {
                if (!$(self.preferences.loading_selector).is(':visible')) {
                    callback();
                    clearInterval(tl.pg.interval);
                }
            }, 250);
        return this;
    };

    /**
     * grab any pageguide steps on the page that have not yet been added
     * to the pg object. for each one, append a shadow element and corresponding
     * index bubble to #tlyPageGuideContent.
     **/
    tl.pg.PageGuide.prototype.addSteps = function () {
        var self = this;
        $('#tlyPageGuide > li').each(function (i, el) {
            var $el = $(el);
            var tourTarget = $el.data('tourtarget');
            var positionClass = $el.attr('class');
            if (self.targetData[tourTarget] == null) {
                self.targetData[tourTarget] = {
                    targetStyle: {},
                    content: $el.html()
                };
                var hashCode = tl.pg.hashCode(tourTarget) + '';
                self.hashTable[hashCode] = tourTarget;
                self.$content.append(
                    '<div class="tlypageguide_shadow tlypageguide_shadow' + hashCode +
                    '" data-selectorhash="' + hashCode + '">' +
                        '<span class="tlyPageGuideStepIndex ' + positionClass +'"></span>' +
                    '</div>'
                );
            }
        });
    };

    /**
     * go through all the current targets and check whether the elements are
     * on the page and visible. if so, record all appropriate css data in self.targetData.
     * any changes in each self.targetData element get pushed to self.changeQueue.
     **/
    tl.pg.PageGuide.prototype.checkTargets = function () {
        var self = this;
        var visibleIndex = 0;
        var newVisibleTargets = [];
        for (var target in self.targetData) {
            var $el = $(target);
            var newTargetData = {
                targetStyle: {
                    display: (!!$el.length && $el.is(':visible')) ? 'block' : 'none'
                }
            };
            if (newTargetData.targetStyle.display === 'block') {
                var offset = $el.offset();
                $.extend(newTargetData.targetStyle, {
                    top: offset.top,
                    left: offset.left,
                    width: $el.outerWidth(),
                    height: $el.outerHeight(),
                    'z-index': $el.css('z-index')
                    // some kind of special casing for fixed positioning
                });
                visibleIndex++;
                newTargetData.index = visibleIndex;
                newVisibleTargets.push(target);
            }
            var diff = {
                target: target
            };
            // compare new styles with existing ones
            for (var prop in newTargetData.targetStyle) {
                if (newTargetData.targetStyle[prop] !== self.targetData[target][prop]) {
                    if (diff.targetStyle == null) {
                        diff.targetStyle = {};
                    }
                    diff.targetStyle[prop] = newTargetData.targetStyle[prop];
                }
            }
            // compare index with existing index
            if (newTargetData.index !== self.targetData[target].index) {
                diff.index = newTargetData.index;
            }
            // push diff onto changequeue if changes have been made
            if (diff.targetStyle != null || diff.index != null) {
                self.changeQueue.push(diff);
            }
            $.extend(self.targetData[target], newTargetData);
        }
        self.visibleTargets = newVisibleTargets;
    };

    /**
     * position the shadow elements (and their attached index bubbles) in their
     * appropriate places over the visible targets. executes by iterating through
     * all the changes that have been pushed to self.changeQueue
     **/
    tl.pg.PageGuide.prototype.positionOverlays = function () {
        var self = this;
        for (var i=0; i<self.changeQueue.length; i++) {
            var changes = self.changeQueue[i];
            var selector = '.tlypageguide_shadow' + tl.pg.hashCode(changes.target);
            var $el = self.$content.find(selector);
            if (changes.targetStyle != null) {
                var style = $.extend({}, changes.targetStyle);
                for (var prop in style) {
                    // fix this
                    if (prop === 'z-index') {
                        style[prop] += 1;
                    //} else if (typeof style[prop] === 'number') {
                        // TODO: change width, height, etc as necessary
                    //    style[prop] = style[prop] + 'px';
                    }
                }
                $el.css(style);
            }
            if (changes.index != null) {
                $el.find('.tlyPageGuideStepIndex').text(changes.index);
            }
        }
        self.changeQueue = [];
    };

    /**
     * find all pageguide steps and appropriately position their corresponding pageguide
     * elements. ideal to run on its own whenever pageguide is opened, or when a DOM
     * change takes place that will not affect the visibility of the target elements
     * (e.g. resize)
     **/
    tl.pg.PageGuide.prototype.refreshVisibleSteps = function () {
        var self = this;
        self.addSteps();
        self.checkTargets();
        self.positionOverlays();
    };

    /**
     * update visible steps on page, and also navigate to the next available step if
     * necessary. this is especially useful when DOM changes take place while the
     * pageguide is open, meaning its target elements may be affected.
     **/
    tl.pg.PageGuide.prototype.updateVisible = function () {
        var self = this;
        self.refreshVisibleSteps();
        if (self.cur_selector != null && self.cur_selector !== self.visibleTargets[self.cur_idx]) {
            // mod by target length in case user was viewing last target and it got removed
            var newIndex = self.cur_idx % self.visibleTargets.length;
            self.show_message(newIndex);
        }
    };

    /**
     * show the step specified by either a numeric index or a selector.
     * index (number): index of the currently visible step to show.
     **/
    tl.pg.PageGuide.prototype.show_message = function (index) {
        var self = this;
        var targetKey = self.visibleTargets[index];
        var target = self.targetData[targetKey];
        if (target != null) {
            var selector = '.tlypageguide_shadow' + tl.pg.hashCode(targetKey);

            self.$content.find('.tlypageguide-active').removeClass('tlypageguide-active');
            self.$content.find(selector).addClass('tlypageguide-active');

            self.$message.find('.tlypageguide_text').html(target.content);
            self.cur_idx = index;
            self.cur_selector = targetKey;

            // DOM stuff
            var defaultHeight = 100;
            var oldHeight = parseFloat(self.$message.css("height"));
            self.$message.css("height", "auto");
            var height = parseFloat(self.$message.outerHeight());
            self.$message.css("height", oldHeight);
            if (height < defaultHeight) {
                height = defaultHeight;
            }
            if (height > $(window).height()/2) {
                height = $(window).height()/2;
            }

            if (!tl.pg.isScrolledIntoView($(targetKey))) {
                $('html,body').animate({scrollTop: target.targetStyle.top - 50}, 500);
            }
            self.$message.show().animate({'height': height}, 500);
            self.roll_number(self.$message.find('span'), target.index);
        }
    };

    /**
     * navigate to the previous step. if at the first step, loop around to the last.
     **/
    tl.pg.PageGuide.prototype.navigateBack = function () {
        var self = this;
        /*
         * If -n < x < 0, then the result of x % n will be x, which is
         * negative. To get a positive remainder, compute (x + n) % n.
         */
        var new_index = (self.cur_idx + self.visibleTargets.length - 1) % self.visibleTargets.length;

        self.track_event('PG.back');
        self.show_message(new_index, true);
        return false;
    };

    /**
     * navigate to the next step. if at last step, loop back to the first.
     **/
    tl.pg.PageGuide.prototype.navigateForward = function () {
        var self = this;
        var new_index = (self.cur_idx + 1) % self.visibleTargets.length;

        self.track_event('PG.fwd');
        self.show_message(new_index, true);
        return false;
    };

    /**
     * open the pageguide! can be fired at any time, though it's usually done via
     * the toggle element (either boilerplate or user-specified) or the welcome
     * modal.
     **/
    tl.pg.PageGuide.prototype.open = function() {
        var self = this;
        if (self.preferences.show_welcome) {
            self.preferences.dismiss_welcome();
            self.close_welcome();
        }
        if (self.is_open) {
            return;
        } else {
            self.is_open = true;
        }

        self.track_event('PG.open');

        self.refreshVisibleSteps();

        if (self.preferences.auto_show_first && self.visibleTargets.length) {
            self.show_message(0);
        }
        $('body').addClass('tlypageguide-open');
    };

    /**
     * close the pageguide. can also be fired at any time, though usually done via
     * the toggle or the close button.
     **/
    tl.pg.PageGuide.prototype.close = function() {
        var self = this;
        if (!self.is_open) {
            return;
        } else {
            self.is_open = false;
        }

        self.track_event('PG.close');

        // TODO: fix this
        self.$content.find('.tlypageguide_shadow').css('display', 'none');
        self.$content.find('.tlypageguide-active').removeClass('tlypageguide-active');
        self.$message.animate({ height: "0" }, 500, function() {
            $(this).hide();
        });

        $('body').removeClass('tlypageguide-open');
    };

    /**
     * bind all relevant event handlers within the document.
     **/
    tl.pg.PageGuide.prototype.setup_handlers = function () {
        var self = this;

        /* interaction: open/close PG interface */
        var interactor = (self.custom_open_button == null) ?
                        self.$base.find('.tlypageguide_toggle') :
                        $(self.custom_open_button);
        interactor.off();
        interactor.on('click', function() {
            if (self.is_open) {
                self.close();
            } else if (self.preferences.show_welcome &&
                      !self.preferences.check_welcome_dismissed() &&
                      !$('body').hasClass('tlyPageGuideWelcomeOpen')) {
                self.pop_welcome();
            } else {
                self.open();
            }
            return false;
        });

        /* close guide */
        $('.tlypageguide_close', self.$message.add($('.tlypageguide_toggle')))
            .on('click', function() {
                self.close();
                return false;
        });

        /* interaction: item click */
        $('body').on('click', '.tlyPageGuideStepIndex', function () {
            var selector = self.hashTable[$(this).parent().data('selectorhash')];
            var target = self.targetData[selector];
            var index = (target) ? target.index : 1;
            self.track_event('PG.specific_elt');
            self.show_message(index - 1);
        });

        /* interaction: fwd/back click */
        self.$fwd.on('click', function() {
            self.navigateForward();
            return false;
        });

        self.$back.on('click', function() {
            self.navigateBack();
            return false;
        });

        /* register resize callback */
        $(window).resize(function() {
            self.refreshVisibleSteps();
        });
    };

    /**
     * animate a given number to roll to the side.
     * num_wrapper (jQuery element): the element whose number to roll
     * new_text (string): the new text to roll across the element
     * left (boolean): whether or not to roll to the left-hand side
     **/
    tl.pg.PageGuide.prototype.roll_number = function (num_wrapper, new_text, left) {
        num_wrapper.animate({ 'text-indent': (left ? '' : '-') + '50px' }, 'fast', function() {
            num_wrapper.html(new_text);
            num_wrapper.css({ 'text-indent': (left ? '-' : '') + '50px' }, 'fast').animate({ 'text-indent': "0" }, 'fast');
        });
    };

    /**
     * pop up the welcome modal.
     **/
    tl.pg.PageGuide.prototype.pop_welcome = function () {
        $('body').addClass('tlyPageGuideWelcomeOpen');
        this.track_event('PG.welcomeShown');
    };

    /**
     * close the welcome modal.
     **/
    tl.pg.PageGuide.prototype.close_welcome = function () {
        $('body').removeClass('tlyPageGuideWelcomeOpen');
    };
}(jQuery));
