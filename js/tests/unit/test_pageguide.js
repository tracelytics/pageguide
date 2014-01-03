$(function () {

    module('tl.pg');

    test('pageguide exists', function () {
        ok(tl.pg, 'tl.pg namespace exists');
    });

    loadInitAndTest('destroy', function () {
        expect(5);

        tl.pg.destroy();
        equal($('#tlyPageGuideWrapper').length, 0, 'no wrapper');
        equal($('#tlyPageGuideOverlay').length, 0, 'no overlay');
        equal($('body').hasClass('tlypageguide-open'), false, 'no open class');
        equal($('body').hasClass('tlyPageGuideWelcomeOpen'), false, 'no welcome open class');
        equal($('.tlypageguide_shadow').length, 0, 'no shadow elements');
    });

    loadAndTest('isScrolledIntoView', function () {
        expect(2);

        // NOTE: had to test on a qunit element because the fixture gets offset by defauly
        ok(tl.pg.isScrolledIntoView('#qunit-header'), 'top element scrolled into view');
        equal(tl.pg.isScrolledIntoView('.data-block:last'), false, 'bottom element not scrolled into view');
    });


    module('DOM: elements exist');

    loadAndTest('fixture loaded', function () {
        expect(1);

        ok($('#exampleContent').length, 'fixture loaded correctly');
    });

    loadAndTest('default elements exist', function () {
        expect(2);

        tl.pg.init();
        ok($('#tlyPageGuideWrapper').length, 'wrapper exists');
        ok($('.tlypageguide_toggle').length, 'toggle exists');
    });

    loadInitAndTest('welcome exists', function () {
        expect(3);

        ok($('#tlyPageGuideWrapper #tlyPageGuideWelcome').length, 'welcome inside wrapper');
        equal($('#tlyPageGuideOverlay').length, 1, 'only one overlay exists');
        ok($('body').hasClass('tlyPageGuideWelcomeOpen'), 'body class');
    }, '#examplePlusWelcome');


    module("DOM: basic interaction");

    loadInitAndTest('open', function () {
        expect(6);

        // note: cannot verify current displayed index, since it is set on a 200ms ('fast')
        // animation delay. may fix in future w/css changes
        $('.tlypageguide_toggle').trigger('click');
        ok($('body').hasClass('tlypageguide-open'), 'body class');
        ok($('#tlyPageGuideMessages').is(':visible'), 'message area shown');
        equal($('.tlypageguide-active').length, 1, 'only one active element');
        equal($('#tlyPageGuide > li:eq(0) > .tlyPageGuideStepText').text(),
            $('.tlypageguide_text').text(), 'first caption displayed');

        var numSteps = $('#tlyPageGuide > li').length;
        equal($('.tlypageguide_shadow:visible').length, numSteps, 'all step shadows shown');
        equal($('#tlyPageGuide ins:visible').length, numSteps, 'all step indices shown');
    });

    loadInitAndTest('close from toggle', function () {
        testClose(function () {
            $('.tlypageguide_toggle').trigger('click');
        });
    });

    loadInitAndTest('close from button', function () {
        testClose(function () {
            $('.tlypageguide_close').trigger('click');
        });
    });

    loadInitAndTest('arrow nav forward', function () {
        var itemLength = $('#tlyPageGuide > li').length;
        expect(itemLength);

        $('.tlypageguide_toggle').trigger('click');
        for (var i=1; i<=itemLength; i++) {
            var index = i % 4;
            $('.tlypageguide_fwd').trigger('click');
            equal($('#tlyPageGuide > li:eq(' + index + ') > .tlyPageGuideStepText').text(),
                $('.tlypageguide_text').text(), 'caption ' + index + ' displayed');
        }
    });

    loadInitAndTest('arrow nav backward', function () {
        var itemLength = $('#tlyPageGuide > li').length;
        expect(itemLength);

        $('.tlypageguide_toggle').trigger('click');
        for (var i=itemLength-1; i>=0; i--) {
            $('.tlypageguide_back').trigger('click');
            equal($('#tlyPageGuide > li:eq(' + i + ') > .tlyPageGuideStepText').text(),
                $('.tlypageguide_text').text(), 'caption ' + i + ' displayed');
        }
    });

    loadInitAndTest('bubble click nav', function () {
        var itemLength = $('#tlyPageGuide > li').length;
        expect(itemLength);

        $('.tlypageguide_toggle').trigger('click');
        $('.tlyPageGuideStepIndex').each(function (i, el) {
            $(el).trigger('click');
            equal($('#tlyPageGuide > li:eq(' + i + ') > .tlyPageGuideStepText').text(),
                $('.tlypageguide_text').text(), 'caption ' + i + ' displayed');
        });
    });

    // HELPER FUNCTIONS FOR TESTING

    /**
     * for testing pageguide load in the DOM: load example page HTML into the
     * qunit fixture element, then run the callback.
     * - title: title of unit being tested
     * - cb: callback function containing the body of the test.
     * - delayStart: optional boolean indicating whether to defer start() (meaning
     *   it will be handled within the callback)
     * - selector: optional string selector for the area to select within the
     *   example page
     **/
    function loadAndTest (title, cb, delayStart, selector) {
        var sel = selector || '#exampleContent';
        asyncTest(title, function () {
            $('#qunit-fixture').load('../../example/index.html '+sel, function () {
                cb();
                if (!delayStart) {
                    start();
                    tl.pg.destroy();
                }
            });
        });
    }

    /**
     * for running a test on pageguide ready. waits until pg.ready() fires to
     * run the test. useful for integration-type things (user interactions, etc)
     * - title: title of unit being tested
     * - cb: callback function containing the body of the test
     * - selector: optional string selector for the area to select within the
     *   example page
     **/
    function loadInitAndTest (title, cb, selector) {
        loadAndTest(title, function () {
            tl.pg.init({
                ready_callback: function () {
                    cb();
                    start();
                    tl.pg.destroy();
                }
            });
        }, true, selector);
    }

    /**
     * test a close interaction. since all close interactions result in the same
     * provable assertions, we can reuse them.
     * - closeAction: function containing the close interaction to test
     **/
    function testClose (closeAction) {
        expect(3);
        $('.tlypageguide_toggle').trigger('click');
        closeAction();
        ok($('#tlyPageGuideMessages').not(':visible'), 'message area hidden');
        equal($('.tlypageguide_shadow:visible').length, 0, 'step shadows hidden');
        equal($('#tlyPageGuide ins:visible').length, 0, 'step indices hidden');
    }
});
