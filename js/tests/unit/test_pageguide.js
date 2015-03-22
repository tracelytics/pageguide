$(function () {
    var pg = {}; // reference for pageguide object

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
        ok(tl.pg.isScrolledIntoView('#qunit-header', 0), 'top element scrolled into view');
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

        ok($('#tlyPageGuideWrapper .tlyPageGuideWelcome').length, 'welcome inside wrapper');
        equal($('#tlyPageGuideOverlay').length, 1, 'only one overlay exists');
        ok($('body').hasClass('tlyPageGuideWelcomeOpen'), 'body class');
    }, '#examplePlusWelcome');


    module('DOM: basic interaction');

    loadInitAndTest('open', function () {
        expect(6);

        $('.tlypageguide_toggle').trigger('click');
        testOpen();
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
            equal($('#tlyPageGuide > li:eq(' + index + ')').text(),
                $('.tlypageguide_text').text(), 'caption ' + index + ' displayed');
        }
    });

    loadInitAndTest('arrow nav backward', function () {
        var itemLength = $('#tlyPageGuide > li').length;
        expect(itemLength);

        $('.tlypageguide_toggle').trigger('click');
        for (var i=itemLength-1; i>=0; i--) {
            $('.tlypageguide_back').trigger('click');
            equal($('#tlyPageGuide > li:eq(' + i + ')').text(),
                $('.tlypageguide_text').text(), 'caption ' + i + ' displayed');
        }
    });

    loadInitAndTest('bubble click nav', function () {
        var itemLength = $('#tlyPageGuide > li').length;
        expect(itemLength);

        $('.tlypageguide_toggle').trigger('click');
        $('.tlyPageGuideStepIndex').each(function (i, el) {
            $(el).trigger('click');
            equal($('#tlyPageGuide > li:eq(' + i + ')').text(),
                $('.tlypageguide_text').text(), 'caption ' + i + ' displayed');
        });
    });

    module('DOM: target changes');

    loadInitAndTest('remove target before open', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect(originalStepLength + 1);

        $('#second_element_to_target').remove();
        $('.tlypageguide_toggle').trigger('click');
        equal($('.tlypageguide_shadow:visible').length, (originalStepLength - 1),
            'correct number of step shadows');
        equal($('.tlyPageGuideStepIndex:visible').length, (originalStepLength - 1),
            'correct number of step indices');
        testSequentialIndices();
    });

    loadInitAndTest('add target back in after removing and opening', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect(originalStepLength + 2);

        var secondElementHtml = $('#second_element_to_target').html();
        $('#second_element_to_target').remove();
        $('.tlypageguide_toggle').trigger('click');

        $('.tlypageguide_close').trigger('click');
        $('#exampleContent > .wrapper').append(
            '<div id="second_element_to_target">' + secondElementHtml + '</div>'
        );

        $('.tlypageguide_toggle').trigger('click');
        equal($('.tlypageguide_shadow:visible').length, originalStepLength,
            'correct number of step shadows');
        equal($('.tlyPageGuideStepIndex:visible').length, originalStepLength,
            'correct number of step indices');
        testSequentialIndices();
    });

    loadInitAndTest('hide target before open', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect(originalStepLength + 1);

        $('#second_element_to_target').hide();
        $('.tlypageguide_toggle').trigger('click');
        equal($('.tlypageguide_shadow:visible').length, (originalStepLength - 1),
            '# of step shadows reflect missing element');
        equal($('.tlyPageGuideStepIndex:visible').length, (originalStepLength - 1),
            '# of step indices reflect missing element');
        testSequentialIndices();
    });

    loadInitAndTest('show target after hiding and opening', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect(originalStepLength + 2);

        $('#second_element_to_target').hide();
        $('.tlypageguide_toggle').trigger('click');

        $('.tlypageguide_close').trigger('click');
        $('#second_element_to_target').show();
        $('.tlypageguide_toggle').trigger('click');
        equal($('.tlypageguide_shadow:visible').length, originalStepLength,
            'correct number of step shadows');
        equal($('.tlyPageGuideStepIndex:visible').length, originalStepLength,
            'correct number of step indices');
        testSequentialIndices();
    });

    loadInitAndTest('remove target while open', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect(originalStepLength + 1);

        $('.tlypageguide_toggle').trigger('click');
        $('#second_element_to_target').remove();
        pg.updateVisible();

        equal($('.tlypageguide_shadow:visible').length, (originalStepLength - 1),
            'correct number of step shadows');
        equal($('.tlyPageGuideStepIndex:visible').length, (originalStepLength - 1),
            'correct number of step indices');
        testSequentialIndices();
    });

    loadInitAndTest('hide current targets while open', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect((originalStepLength + 1) * originalStepLength);

        $('.data-block').each(function (i, el) {
            $('.tlypageguide_toggle').trigger('click');
            pg.show_message(i);
            $(el).hide();
            pg.updateVisible();
            equal($('.tlypageguide_shadow:visible').length, (originalStepLength - 1),
                'correct number of step shadows');
            equal($('.tlyPageGuideStepIndex:visible').length, (originalStepLength - 1),
                'correct number of step indices');
            testSequentialIndices();
            $(el).show();
            $('.tlypageguide_close').trigger('click');
        });
    });

    loadInitAndTest('show current targets while open', function () {
        var originalStepLength = $('#tlyPageGuide > li').length;
        expect((originalStepLength + 2) * originalStepLength);

        $('.data-block').each(function (i, el) {
            $(el).hide();
            $('.tlypageguide_toggle').trigger('click');
            pg.show_message(i);
            $(el).show();
            pg.updateVisible();
            equal($('.tlypageguide_shadow:visible').length, originalStepLength,
                'correct number of step shadows');
            equal($('.tlyPageGuideStepIndex:visible').length, originalStepLength,
                'correct number of step indices');
            testSequentialIndices();
            $('.tlypageguide_close').trigger('click');
        });
    });

    module('DOM: welcome message');

    loadInitAndTest('welcome start click', function () {
        expect(9);

        $('.tlypageguide_start').trigger('click');
        testOpen();
        ok(checkLocalStorageItem(), 'localStorage item exists');
        ok($('.tlyPageGuideWelcome').not(':visible'), 'welcome hidden');
        ok($('.tlyPageGuideOverlay').not(':visible'), 'overlay hidden');
        localStorage.clear();
    }, '#examplePlusWelcome');

    loadInitAndTest('welcome start and open', function () {
        expect(8);

        $('.tlypageguide_start').trigger('click');
        $('.tlypageguide_close').trigger('click');
        $('.tlypageguide_toggle').trigger('click');
        ok($('.tlyPageGuideWelcome').not(':visible'), 'welcome hidden');
        ok($('#tlyPageGuideOverlay').not(':visible'), 'overlay hidden');
        testOpen();
        localStorage.clear();
    }, '#examplePlusWelcome');

    loadInitAndTest('welcome toggle click', function () {
        expect(9);

        $('.tlypageguide_toggle').trigger('click');
        testOpen();
        ok(checkLocalStorageItem(), 'localStorage item exists');
        ok($('.tlyPageGuideWelcome').not(':visible'), 'welcome hidden');
        ok($('#tlyPageGuideOverlay').not(':visible'), 'overlay hidden');
        localStorage.clear();
    }, '#examplePlusWelcome');

    loadInitAndTest('welcome ignore click', function () {
        expect(5);

        $('.tlypageguide_ignore').trigger('click');
        ok($('.tlyPageGuideWelcome').not(':visible'), 'welcome hidden');
        ok($('.tlyPageGuideOverlay').not(':visible'), 'overlay hidden');
        equal(checkLocalStorageItem(), false, 'no localStorage item yet');
        $('.tlypageguide_toggle').trigger('click');
        ok($('.tlyPageGuideWelcome').is(':visible'), 'welcome shown again');
        ok($('#tlyPageGuideOverlay').is(':visible'), 'overlay shown again');
    }, '#examplePlusWelcome');

    loadInitAndTest('welcome dismiss click', function () {
        expect(11);

        $('.tlypageguide_dismiss').trigger('click');
        ok($('.tlyPageGuideWelcome').not(':visible'), 'welcome hidden');
        ok($('#tlyPageGuideOverlay').not(':visible'), 'overlay hidden');
        ok(checkLocalStorageItem(), 'localStorage item exists');
        $('.tlypageguide_toggle').trigger('click');
        ok($('.tlyPageGuideWelcome').not(':visible'), 'welcome hidden');
        ok($('#tlyPageGuideOverlay').not(':visible'), 'overlay hidden');
        testOpen();
        localStorage.clear();
    }, '#examplePlusWelcome');

    module('multiple pageguides');

    loadInitAndTest('2 pageguides 1 page', function () {
        expect(8);
        var pg2 = tl.pg.init({
            steps_element: '#titlePageGuide',
            ready_callback: function () {
                equal($('.tlypageguide_toggle').length, 2);
                equal($('#tlyPageGuideWrapper').length, 1);

                // check first one
                $('.tlypageguide_toggle:first').trigger('click');
                equal($('#tlyPageGuide > li:eq(0)').text(),
                    $('.tlypageguide_text').text(), 'first caption for first pg displayed');
                var numStepsFirst = $('#tlyPageGuide > li').length;
                equal($('.tlypageguide_shadow:visible').length, numStepsFirst, 'all step shadows shown for first pg');
                equal($('.tlyPageGuideStepIndex:visible').length, numStepsFirst, 'all step indices shown for first pg');
                $('.tlypageguide_toggle:first').trigger('click');

                // check second one
                $('.tlypageguide_toggle:eq(1)').trigger('click');
                equal($('#titlePageGuide > li:eq(0)').text(),
                    $('.tlypageguide_text').text(), 'first caption for second pg displayed');
                var numStepsSecond = $('#tlyPageGuide > li').length;
                equal($('.tlypageguide_shadow:visible').length, numStepsSecond, 'all step shadows shown for second pg');
                equal($('.tlyPageGuideStepIndex:visible').length, numStepsSecond, 'all step indices shown for second pg');
                $('.tlypageguide_toggle:eq(1)').trigger('click');
                start();
                tl.pg.destroy();
            }
        });
    }, null, true);

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
    function loadInitAndTest (title, cb, selector, delayStart) {
        loadAndTest(title, function () {
            pg = tl.pg.init({
                ready_callback: function () {
                    cb();
                    if (!delayStart) {
                        start();
                        tl.pg.destroy();
                    }
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
        equal($('.tlyPageGuideStepIndex:visible').length, 0, 'step indices hidden');
    }

    /**
     * test an open interaction. once again, all open interactions result in the same
     * state, so we can reuse the assertions.
     * NOTE: cannot verify current displayed index, since it is set on a 200ms ('fast')
     * animation delay. may fix in future w/css changes
     **/
    function testOpen () {
        ok($('body').hasClass('tlypageguide-open'), 'body class');
        ok($('#tlyPageGuideMessages').is(':visible'), 'message area shown');
        equal($('.tlypageguide-active').length, 1, 'only one active element');
        equal($('#tlyPageGuide > li:eq(0)').text(),
            $('.tlypageguide_text').text(), 'first caption displayed');

        var numSteps = $('#tlyPageGuide > li').length;
        equal($('.tlypageguide_shadow:visible').length, numSteps, 'all step shadows shown');
        equal($('.tlyPageGuideStepIndex:visible').length, numSteps, 'all step indices shown');
    }

    /**
     * go through all the visible step indices (number bubbles) and make sure they
     * each increase sequentially by 1.
     **/
    function testSequentialIndices () {
        $('.tlyPageGuideStepIndex:visible').each(function (i, el) {
            equal(i, (parseFloat($(el).text()) - 1), 'step ' + i + ' has correct number');
        });
    }

    /**
     * check for the localstorage item used by default to determine whether to
     * display the welcome message
     **/
    function checkLocalStorageItem () {
        return !!localStorage.getItem('tlypageguide_welcome_shown_' + tl.pg.hashUrl());
    }
});
