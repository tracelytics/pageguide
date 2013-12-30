$(function () {

    module("tl.pg");

    test("pageguide exists", function () {
        ok(tl.pg);
    });

    /**
     * for testing pageguide actions in the DOM: load example page HTML into the
     * qunit fixture element, then run the callback.
     * - title: title of unit being tested
     * - cb: callback function containing the body of the test.
     **/
    function loadFixtureAndTest (title, cb, delayStart, selector) {
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

    function cleanup () {
        $('#tlyPageGuideWrapper').remove();
        $('#tlyPageGuideOverlay').remove();
        $('body').removeClass();
    }

    module("DOM: loading pageguide");

    loadFixtureAndTest('fixture loaded', function () {
        expect(1);

        ok($('#exampleContent').length, 'fixture loaded correctly');
    });

    loadFixtureAndTest('default elements exist', function () {
        expect(2);

        tl.pg.init();
        ok($('#tlyPageGuideWrapper').length, 'wrapper exists');
        ok($('.tlypageguide_toggle').length, 'toggle exists');
    });

    loadFixtureAndTest('welcome exists', function () {
        expect(3);
        var pg = tl.pg.init({
            ready_callback: function () {
                ok($('#tlyPageGuideWrapper #tlyPageGuideWelcome').length, 'welcome inside wrapper');
                equal($('#tlyPageGuideOverlay').length, 1, 'only one overlay exists');
                ok($('body').hasClass('tlyPageGuideWelcomeOpen'));
                start();
                cleanup();
            }
        });
    }, true, '#examplePlusWelcome');
})
