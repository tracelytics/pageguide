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

    tl.pg.wrapper_markup =
        '<div id="tlyPageGuideWrapper">' +
            '<div id="tlyPageGuideMessages">' +
                '<a href="#" class="tlypageguide_close" title="Close Guide">close</a>' +
                '<span class="tlypageguide_index"></span>' +
                '<div class="tlypageguide_text"></div>' +
                '<a href="#" class="tlypageguide_back" title="Previous">Previous</a>' +
                '<a href="#" class="tlypageguide_fwd" title="Next">Next</a>' +
            '</div>' +
        '</div>';

    tl.pg.toggle_markup =
        '<div class="tlypageguide_toggle" title="Launch Page Guide">' +
            '<div><span class="tlypageguide_toggletitle"></span></div>' +
            '<a href="#" class="tlypageguide_close" title="close guide">close guide &raquo;</a>' +
        '</div>';

    tl.pg.init = function(preferences) {
        preferences = $.extend({}, tl.pg.default_prefs, preferences);
        clearInterval(tl.pg.interval);

        /* page guide object, for pages that have one */
        if ($("#tlyPageGuide").length === 0) {
            return;
        }

        var $guide = $("#tlyPageGuide");
        var $wrapper = $(tl.pg.wrapper_markup);
        //var $message = $(tl.pg.message_markup);

        var tourtitle = $guide.data('tourtitle') || preferences.tourtitle;

        if (preferences.custom_open_button == null && $('.tlypageguide_toggle').length < 1) {
            $wrapper.append(tl.pg.toggle_markup);
            $wrapper.find('.tlypageguide_toggle').prepend(preferences.pg_caption);
            $wrapper.find('.tlypageguide_toggletitle').text(tourtitle);
        }

        $wrapper.prepend($guide);

        // remove any stale pageguides
        $('#tlyPageGuideWrapper').remove();

        $('body').append($wrapper);

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

    tl.pg.PageGuide = function (pg_elem, preferences) {
        this.preferences = preferences;
        this.$base = pg_elem;
        this.$all_items = this.$base.find('#tlyPageGuide > li');
        this.$items = $([]); /* fill me with visible elements on pg expand */
        this.$message = $('#tlyPageGuideMessages');
        this.$fwd = this.$base.find('a.tlypageguide_fwd');
        this.$back = this.$base.find('a.tlypageguide_back');
        this.$welcome = $('#tlyPageGuideWelcome');
        this.cur_idx = 0;
        this.track_event = this.preferences.track_events_cb;
        this.handle_doc_switch = this.preferences.handle_doc_switch;
        this.custom_open_button = this.preferences.custom_open_button;
        this.is_open = false;
    };

    tl.pg.hashUrl = function() {
        var str = window.location.href;
        var hash = 0, i, char;
        if (str.length === 0) {
            return hash;
        }
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash;
        }
        return hash.toString();
    };

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
        $('.tlypageguide_shadow').removeClass('tlypageguide_shadow');
        $('body').removeClass('tlypageguide-open');
        $('body').removeClass('tlyPageGuideWelcomeOpen');
    };

    tl.pg.PageGuide.prototype.setup_welcome = function () {
        var $welcome = $('#tlyPageGuideWelcome');
        var that = this;
        if ($welcome.length > 0) {
            that.preferences.show_welcome = !that.preferences.check_welcome_dismissed();
            if (that.preferences.show_welcome) {
                if (!$('#tlyPageGuideOverlay').length) {
                    $('body').prepend('<div id="tlyPageGuideOverlay"></div>');
                }
                $welcome.appendTo(that.$base);
            }

            if ($welcome.find('.tlypageguide_ignore').length) {
                $welcome.on('click', '.tlypageguide_ignore', function () {
                    that.close_welcome();
                    that.track_event('PG.ignoreWelcome');
                });
            }
            if ($welcome.find('.tlypageguide_dismiss').length) {
                $welcome.on('click', '.tlypageguide_dismiss', function () {
                    that.close_welcome();
                    that.preferences.dismiss_welcome();
                    that.track_event('PG.dismissWelcome');
                });
            }
            $welcome.on('click', '.tlypageguide_start', function () {
                that.open();
                that.track_event('PG.startFromWelcome');
            });

            if (that.preferences.show_welcome) {
                that.pop_welcome();
            }
        }
    };

    tl.pg.PageGuide.prototype.ready = function(callback) {
        var that = this;
        tl.pg.interval = window.setInterval(function() {
                if (!$(that.preferences.loading_selector).is(':visible')) {
                    callback();
                    clearInterval(tl.pg.interval);
                }
            }, 250);
        return this;
    };

    /* to be executed on pg expand */
    tl.pg.PageGuide.prototype._on_expand = function () {
        var that = this,
            $d = document,
            $w = window;

        /* set up initial state */
        this.position_tour();
        this.cur_idx = 0;

        // create a new stylesheet:
        var ns = $d.createElement('style');
        $d.getElementsByTagName('head')[0].appendChild(ns);

        // keep Safari happy
        if (!$w.createPopup) {
            ns.appendChild($d.createTextNode(''));
            ns.setAttribute("type", "text/css");
        }

        // get a pointer to the stylesheet you just created
        var sh = $d.styleSheets[$d.styleSheets.length - 1];

        // space for IE rule set
        var ie = "";

        /* add number tags and PG shading elements */
        this.$items.each(function(i) {
            var $p = $($(this).data('tourtarget') + ":visible:first");
            $p.addClass("tlypageguide_shadow tlypageguide_shadow" + i);

            var node_text = '.tlypageguide_shadow' + i + ':after { height: ' +
                                $p.outerHeight() + 'px; width: ' + $p.outerWidth(false) + 'px; }';

            if (!$w.createPopup) {
                // modern browsers
                var k = $d.createTextNode(node_text, 0);
                ns.appendChild(k);
            } else {
                // for IE
                ie += node_text;
            }

            $(this).find('.tlyPageGuideStepIndex').remove();
            $(this).html('<div class="tlyPageGuideStepText">' + $(this).text() + '</div>');
            $(this).prepend('<ins class="tlyPageGuideStepIndex">' + (i + 1) + '</ins>');
            $(this).data('idx', i);
        });

        // is IE? slam styles in all at once:
        if ($w.createPopup) {
            sh.cssText = ie;
        }

        /* decide to show first? */
        if (this.preferences.auto_show_first && this.$items.length > 0) {
            this.show_message(0);
        }
    };

    tl.pg.PageGuide.prototype.open = function() {
        if (this.preferences.show_welcome) {
            this.preferences.dismiss_welcome();
            this.close_welcome();
        }
        if (this.is_open) {
            return;
        } else {
            this.is_open = true;
        }

        this.track_event('PG.open');

        this._on_expand();
        this.$items.toggleClass('expanded');
        $('body').addClass('tlypageguide-open');
    };

    tl.pg.PageGuide.prototype.close = function() {
        if (!this.is_open) {
            return;
        } else {
            this.is_open = false;
        }

        this.track_event('PG.close');

        this.$items.toggleClass('expanded');
        this.$message.animate({ height: "0" }, 500, function() {
            $(this).hide();
        });
        /* clear number tags and shading elements */
        $('[class~="tlypageguide_shadow"]').removeClass(function(i, c) {
            return c.match(/tlypageguide_shadow.*?\b/g).join(" ");
        });
        $('ins').remove();
        $('body').removeClass('tlypageguide-open');
    };

    tl.pg.PageGuide.prototype.setup_handlers = function () {
        var that = this;

        /* interaction: open/close PG interface */
        var interactor = (that.custom_open_button == null) ?
                        this.$base.find('.tlypageguide_toggle') :
                        $(that.custom_open_button);
        interactor.off();
        interactor.on('click', function() {
            if (that.is_open) {
                that.close();
            } else if (that.preferences.show_welcome &&
                      !that.preferences.check_welcome_dismissed() &&
                      !$('body').hasClass('tlyPageGuideWelcomeOpen')) {
                that.pop_welcome();
            } else {
                that.open();
            }
            return false;
        });

        $('.tlypageguide_close', this.$message.add($('.tlypageguide_toggle')))
            .on('click', function() {
                that.close();
                return false;
        });

        /* interaction: item click */
        this.$all_items.off();
        this.$all_items.on('click', function() {
            var new_index = $(this).data('idx');
            that.track_event('PG.specific_elt');
            that.show_message(new_index);
        });

        /* interaction: fwd/back click */
        this.$fwd.on('click', function() {
            var new_index = (that.cur_idx + 1) % that.$items.length;

            that.track_event('PG.fwd');
            that.show_message(new_index);
            return false;
        });

        this.$back.on('click', function() {
            /*
             * If -n < x < 0, then the result of x % n will be x, which is
             * negative. To get a positive remainder, compute (x + n) % n.
             */
            var new_index = (that.cur_idx + that.$items.length - 1) % that.$items.length;

            that.track_event('PG.back');
            that.show_message(new_index, true);
            return false;
        });

        /* register resize callback */
        $(window).resize(function() { that.position_tour(); });
    };

    tl.pg.PageGuide.prototype.show_message = function (new_index, left) {
        var old_idx = this.cur_idx,
            old_item = this.$items[old_idx],
            new_item = this.$items[new_index];

        this.cur_idx = new_index;
        if(this.handle_doc_switch){
            this.handle_doc_switch($(new_item).data('tourtarget'),
                                   $(old_item).data('tourtarget'));
        }

        $('div', this.$message).html($(new_item).children('div').html());
        this.$items.removeClass("tlypageguide-active");
        $(new_item).addClass("tlypageguide-active");

        if (!tl.pg.isScrolledIntoView($(new_item))) {
            $('html,body').animate({scrollTop: $(new_item).offset().top - 50}, 500);
        }
        var defaultHeight = 100;
        var oldHeight = parseFloat(this.$message.css("height"));
        this.$message.css("height", "auto");
        var height = parseFloat(this.$message.outerHeight());
        this.$message.css("height", oldHeight + 'px');
        if (height < defaultHeight) {
            height = defaultHeight;
        }
        if (height > $(window).height()/2) {
            height = $(window).height()/2;
        }
        height = height + "px";

        this.$message.show().animate({'height': height}, 500);
        this.roll_number(this.$message.find('span'), $(new_item).children('ins').html(), left);
    };

    tl.pg.PageGuide.prototype.roll_number = function (num_wrapper, new_text, left) {
        num_wrapper.animate({ 'text-indent': (left ? '' : '-') + '50px' }, 'fast', function() {
            num_wrapper.html(new_text);
            num_wrapper.css({ 'text-indent': (left ? '-' : '') + '50px' }, 'fast').animate({ 'text-indent': "0" }, 'fast');
        });
    };

    tl.pg.PageGuide.prototype.position_tour = function () {
        /* set PG element positions for visible tourtargets */
        this.$items = this.$all_items.filter(function () {
            return $($(this).data('tourtarget')).is(':visible');
        });

        this.$items.each(function() {
            var arrow   = $(this),
                target  = $(arrow.data('tourtarget')).filter(':visible:first'),
                position = arrow.data('position'),
                setLeft = target.offset().left,
                setTop  = target.offset().top;

            if (position == "fixed") {
                setTop  -= $(window).scrollTop();
            }

            if (arrow.hasClass("tlypageguide_top")) {
                setTop -= 60;
            } else if (arrow.hasClass("tlypageguide_bottom")) {
                setTop += target.outerHeight() + 15;
            } else {
                setTop += 5;
            }

            if (arrow.hasClass("tlypageguide_right")) {
                setLeft += target.outerWidth(false) + 15;
            } else if (arrow.hasClass("tlypageguide_left")) {
                setLeft -= 65;
            } else {
                setLeft += 5;
            }

            arrow.css({ "left": setLeft + "px", "top": setTop + "px", "position": position});
        });
    };

    tl.pg.PageGuide.prototype.pop_welcome = function () {
        $('body').addClass('tlyPageGuideWelcomeOpen');
        this.track_event('PG.welcomeShown');
    };

    tl.pg.PageGuide.prototype.close_welcome = function () {
        $('body').removeClass('tlyPageGuideWelcomeOpen');
    };
}(jQuery));
