$(function () {

    module("tl.pg");

    test("pageguide exists", function () {
        ok(tl.pg);
    });

    module("DOM operations");

    loadFixtureAndTest('fixture loaded', function () {
        ok($('#exampleContent').length);
    });

    /**
     * for testing pageguide actions in the DOM: load example page HTML into the
     * qunit fixture element, then run the callback.
     * - title: title of unit being tested
     * - cb: callback function containing the body of the test.
     **/
    function loadFixtureAndTest (title, cb) {
        asyncTest(title, function () {
            $('#qunit-fixture').load('../../example/index.html #exampleContent', function () {
                cb();
                start();
            });
        });
    }
})
