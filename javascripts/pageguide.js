/*
 * Tracelytics PageGuide
 *
 * Copyright 2012 Tracelytics
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Contributing Author: Tracelytics Team
 */

/*
 * PageGuide usage:
 *
 *   Preferences:
 *     auto_show_first - Whether or not to focus on the first visible item
 *                       immediately on PG open (default true)
 *     loading_selector - The CSS selector for the loading element. pageguide
 *                        will wait until this element is no longer visible
 *                        starting up.
 *     track_events_cb - Optional callback for tracking user interactions
 *                       with pageguide.  Should be a method taking a single
 *                       parameter indicating the name of the interaction.
 *                       (default none)
 */
tl = window.tl || {};
tl.pg = tl.pg || {};

tl.pg.default_prefs = {
    'auto_show_first': true,
    'loading_selector' : '#loading',
    'track_events_cb': function() { return; }
};

tl.pg.init = function(preferences) {
    /* page guide object, for pages that have one */
    if ($("#tlyPageGuide").length === 0) {
        return;
    }

    var guide   = $("#tlyPageGuide"),
        wrapper = $('<div>', { id: 'tlyPageGuideWrapper' });

    $('<div/>', {
        'title': 'Launch Page Guide',
        'class': 'tlypageguide_toggle'
    }).append('page guide')
      .append('<div><span>' + guide.data('tourtitle') + '</span></div>')
      .append('<a href="javascript:void(0);" title="close guide">close guide &raquo;</a>').appendTo(wrapper);

    wrapper.append(guide);
    wrapper.append($('<div>', { 'id' : 'tlyPageGuideMessages' }));
    $('body').append(wrapper);

    var pg = new tl.pg.PageGuide($('#tlyPageGuideWrapper'), preferences);
    pg.ready(function() {
        pg.setup_handlers();
        pg.$base.children(".tlypageguide_toggle").animate({ "right": "-120px" }, 250);
    });
    return pg;
};

tl.pg.PageGuide = function (pg_elem, preferences) {
    this.preferences = $.extend({}, tl.pg.default_prefs, preferences);
    this.$base = pg_elem;
    this.$all_items = $('#tlyPageGuide > li', this.$base);
    this.$items = $([]); /* fill me with visible elements on pg expand */
    this.$message = $('#tlyPageGuideMessages');
    this.$fwd = $('a.tlypageguide_fwd', this.$base);
    this.$back = $('a.tlypageguide_back', this.$base);
    this.cur_idx = 0;
    this.track_event = this.preferences.track_events_cb;
};

tl.pg.isScrolledIntoView = function(elem) {
    var dvtop = $(window).scrollTop(),
        dvbtm = dvtop + $(window).height(),
        eltop = $(elem).offset().top,
        elbtm = eltop + $(elem).height();

    return (elbtm >= dvtop) && (eltop <= dvbtm - 100);
};

tl.pg.PageGuide.prototype.ready = function(callback) {
    var that = this,
        interval = window.setInterval(function() {
            if (!$(that.preferences.loading_selector).is(':visible')) {
                callback();
                clearInterval(interval);
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

        // modern browsers
        if (!$w.createPopup) {
            var k = $d.createTextNode(node_text, 0);
            ns.appendChild(k);
        }
        // for IE
        else {
            ie += node_text;
        }

        $(this).prepend('<ins>' + (i + 1) + '</ins>');
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
    this.track_event('PG.open');

    this._on_expand();
    this.$items.toggleClass('expanded');
    $('body').addClass('tlypageguide-open');
};

tl.pg.PageGuide.prototype.close = function() {
    this.track_event('PG.close');

    this.$items.toggleClass('expanded');
    this.$message.animate({ height: "0" }, 500, function() {
        $(this).hide();
    });
    /* clear number tags and shading elements */
    $('ins').remove();
    $('body').removeClass('tlypageguide-open');
};

tl.pg.PageGuide.prototype.setup_handlers = function () {
    var that = this;

    /* interaction: open/close PG interface */
    $('.tlypageguide_toggle', this.$base).live('click', function() {
        if ($('body').is('.tlypageguide-open')) {
            that.close();
        } else {
            that.open();
        }
        return false;
    });

    $('.tlypageguide_close', this.$message).live('click', function() {
        that.close();
        return false;
    });

    /* interaction: item click */
    this.$all_items.live('click', function() {
        var new_index = $(this).data('idx');

        that.track_event('PG.specific_elt');
        that.show_message(new_index);
    });

    /* interaction: fwd/back click */
    this.$fwd.live('click', function() {
        var new_index = (that.cur_idx + 1) % that.$items.length;

        that.track_event('PG.fwd');
        that.show_message(new_index);
        return false;
    });

    this.$back.live('click', function() {
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
    this.$message.empty()
      .append('<a href="#" class="tlypageguide_close" title="Close Guide">close</a>')
      .append('<span>' + $(old_item).children('ins').html() + '</span>')
      .append('<div>' + $(new_item).children('div').html() + '</div>')
      .append('<a href="#" class="tlypageguide_back" title="Previous">Previous</a>')
      .append('<a href="#" class="tlypageguide_fwd" title="Next">Next</a>');

    this.$items.removeClass("tlypageguide-active");
    $(new_item).addClass("tlypageguide-active");

    if (!tl.pg.isScrolledIntoView($(new_item))) {
        $('html,body').animate({scrollTop: $(new_item).offset().top - 50}, 500);
    }

    if (this.$message.is(":visible")) {
        this.roll_number($('span', this.$message), $(new_item).children('ins').html(), left);
    }
    else {
        $('span', this.$message).html($(new_item).children('ins').html());
        this.$message.show().animate({ height: "100px" }, 500);
    }
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
            setLeft = target.offset().left,
            setTop  = target.offset().top;

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

        arrow.css({ "left": setLeft + "px", "top": setTop + "px" });
    });
};