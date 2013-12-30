$(function () {

    module("tl.pg");

    test("pageguide exists", function () {
        ok(tl.pg);
    });

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
                    cleanup();
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
                    cleanup();
                }
            });
        }, true, selector);
    }

    function cleanup () {
        $('#tlyPageGuideWrapper').remove();
        $('#tlyPageGuideOverlay').remove();
        $('body').removeClass();
    }

    module("DOM: loading pageguide");

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
        expect(2);

        $('.tlypageguide_toggle').trigger('click');
        ok($('body').hasClass('tlypageguide-open'), 'body class');
        ok($('#tlyPageGuideMessages').is(':visible'), 'message area shown');
    });
})
